# Module Indisponibilité — Design

**Date :** 2026-04-26
**Statut :** Spec validée · prêt pour implémentation
**Branche cible :** `main` (merge direct après dev)

## Contexte & motivation

L'actuel module d'indispo (`apps/frontend/pages/admin/indisponibilite.vue`) stocke les jours bloqués **uniquement en `localStorage`**. Conséquences :

- Pas partagé entre appareils (un blocage fait depuis un téléphone n'est pas vu sur un ordi).
- Le backend ignore complètement les blocages : `getAvailability()` et `create()` ne les consultent pas → un client peut réserver un jour soi-disant "bloqué" depuis n'importe quel device.
- `BookingCalendar.vue` lit aussi le `localStorage` côté client → l'affichage du blocage ne fonctionne que sur le device qui a posé le blocage.

→ Le module est de fait **non fonctionnel**.

Une branche `origin/claude/add-unavailability-admin-SaZE4` (commit `333f8ec`) avait commencé une implémentation backend-backed mais n'a jamais été mergée. On la reprend, on la simplifie selon les choix de design ci-dessous, on merge sur `main`.

## Décisions de design (brainstorming)

| # | Décision | Justification |
|---|---|---|
| 1 | Blocage **jour entier** uniquement | Le plus simple ; suffit pour congés et jours off |
| 2 | + Mode **plage de dates** "du X au Y" | Indispensable pour bloquer une semaine de congés en un clic |
| 3 | **Pas de raison** attachée au blocage | Le moins de friction possible ; les vacances n'ont pas besoin d'être commentées |
| 4 | RDV existant sur jour qu'on bloque → **warning + cascade-cancel + email auto** | Cohérence : pas d'incohérence entre indispo admin et RDV actif |
| 5 | Côté client : créneau bloqué = **rouge identique à un créneau réservé** | Le client n'a pas à savoir si c'est l'admin ou un autre client qui l'a pris |
| 6 | **Pas de logique sur les dates passées** | Cleanup manuel si besoin |
| 7 | **Layout admin actuel conservé** | Calendrier mensuel + sidebar actions rapides + liste — pas de redesign |

## Architecture

### Data model (Prisma)

```prisma
model Unavailability {
  id        String   @id @default(cuid())
  date      DateTime @unique @db.Date
  createdAt DateTime @default(now())
}
```

→ Différence vs branche existante : **suppression de `reason`** (décision Q3).

Migration Prisma : `add_unavailability` qui crée la table. Pas de conflit avec `cleanup_blocked_dates_if_exists` (commit `124fda4`) — c'était une autre table (`BlockedDate`) supprimée ; `Unavailability` est neuf.

### Modules backend

- Nouveau `UnavailabilitiesModule` (`apps/backend/src/unavailabilities/`) : controller + service + DTO
- `AppointmentsService` consomme `UnavailabilitiesService` (lecture seule pour `getAvailability` et `create`)
- `UnavailabilitiesService` consomme directement `PrismaService` + `MailService` pour le cascade-cancel (modifie le `status` des Appointment via Prisma sans passer par `AppointmentsService`) → **dépendance unidirectionnelle**, pas de `forwardRef` nécessaire
- `MailService` reste partagé

## API

### Public

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/unavailabilities?month=YYYY-MM` | Liste des indispos du mois (ou toutes si pas de query) |

Réponse : `Array<{id: string, date: string, createdAt: string}>`

### Admin (header `x-admin-password`)

| Méthode | Route | Body | Description |
|---|---|---|---|
| `POST` | `/unavailabilities/admin` | `{date: string, cascade?: boolean}` | Bloque un jour |
| `POST` | `/unavailabilities/admin/range` | `{from: string, to: string, cascade?: boolean}` | Bloque une plage de dates (inclusif) |
| `DELETE` | `/unavailabilities/admin/by-date/:date` | — | Débloque un jour |

#### Sémantique POST simple

1. Si la date a des RDV actifs (`status != CANCELLED`) **et** `cascade !== true` :
   - HTTP **409** avec body `{conflicts: [{id, timeSlot, firstName, lastName, email}]}`
   - Pas de blocage inséré
2. Si `cascade === true` :
   - **Transaction Prisma** : pour chaque RDV actif → `update status=CANCELLED` ; puis `unavailability.create()`. Atomicité DB garantie (si l'insert échoue, les RDV restent confirmés).
   - **Après commit** de la transaction : `mail.sendStatusUpdate()` pour chaque RDV cancelled (les envois mail ne doivent pas être dans la transaction — side-effect externe non rollbackable, et bloque la connexion DB sur du network IO). Erreurs silenciées comme partout ailleurs dans le projet.
3. Si la date est déjà bloquée → HTTP **409** "Cette date est déjà bloquée." (Prisma P2002)

#### Sémantique POST range

- Itère sur chaque jour de la plage
- Agrège les conflicts ; si non-empty et `cascade !== true` → **409** avec tous les conflicts
- Sinon retourne `{created: [Unavailability...], skipped: [date...]}` (skipped = dates déjà bloquées, on les ignore silencieusement plutôt que de fail toute la plage)

## Backend integration

### `AppointmentsService.getAvailability()`

- Charge `unavailabilities.findInRange(from, to)` en parallèle de la liste des bookings (`Promise.all`)
- Pour chaque jour de la période :
  - Si la date est dans la map des indispos : **tous les slots** retournent `{available: false, bookedBy: undefined, isPending: false, isBenjThursday: false}` → rendu identique à un slot réservé sans nom (le frontend affiche "Réservé" par fallback)
  - Sinon : logique existante (booked → pris, libre → dispo)
- **Pas de champ `isBlocked`** exposé au frontend (volontaire : décision Q5 = look-alike avec un slot réservé)

### `AppointmentsService.create()`

- Avant l'insert : `unavailabilities.findUnique({where: {date}})`
- Si trouvé : `throw new ConflictException('Cette date est indisponible.')`

## Frontend admin — `pages/admin/indisponibilite.vue`

### Suppressions

- `JSON.parse(localStorage.getItem('blockedDates'))` et tous les `setItem`
- La logique `blockedDates.value.indexOf(...) > -1` et autres manipulations de l'array local

### Ajouts

- Composable `useUnavailabilities()` (de la branche, simplifié — drop le param `reason`)
- État réactif chargé depuis `getAll(month)` au mount et à chaque changement de mois
- Click sur un jour du calendrier :
  - Jour déjà bloqué → `removeByDate(date, password)` → refresh liste
  - Jour libre + aucun RDV actif sur la date → `create({date}, password)` → refresh liste
  - Jour libre + au moins un RDV actif → ouvre un **modal de confirmation** :
    > "{N} RDV(s) actif(s) sur le {date} seront annulés et un email partira au(x) client(s). Confirmer ?"
    - OK → `create({date, cascade: true}, password)` → refresh liste
    - Annuler → ferme le modal sans rien faire
  - Pour détecter les conflits : on tente d'abord le POST sans `cascade`, on lit le body 409, on présente le modal, puis on retente avec `cascade: true`

### Sidebar "Actions rapides" (refactor)

| Bouton actuel | Action après refactor |
|---|---|
| Bloquer aujourd'hui | Reste : POST sur la date du jour (cascade modal si RDV) |
| Bloquer toute la semaine | **Remplacé** par "Bloquer une plage" → modal avec 2 date pickers (`UInput type="date"`) → POST `/range` (cascade modal si conflicts) |
| Débloquer tout | DELETE en boucle sur chaque date de la liste actuelle (modal Nuxt UI de confirmation, pas de `confirm()` natif) |

### Liste des jours bloqués

- Inchangée visuellement
- Bouton "Débloquer" → `removeByDate(date, password)` → refresh

### Erreurs

- Toast Nuxt UI rouge sur tout `$fetch` qui throw (sauf 409 → modal de confirmation cascade)
- Toast Nuxt UI vert sur succès

## Frontend public — `components/BookingCalendar.vue`

### Suppressions

- `const blockedDates = ref<string[]>([])`
- `loadBlockedDates()` et son call dans `onMounted`
- Le champ `isBlocked` dans `DayCell`
- Le calcul `isBlocked: blockedDates.value.includes(dateStr)` dans `daysInMonth`
- Tout le rendu spécifique : badge "INDISPO", label "Indispo", classe `bg-red-100 text-red-700 ring-red-300`, conditions `day.isBlocked` dans les bindings, `splitSlotClass` cas blocked
- L'item "Indisponible" de la légende

→ Un jour bloqué = tous ses slots `available: false` côté backend → la cellule s'affiche naturellement comme "Complet" / "Réservé" via la logique existante. Aucune logique frontend supplémentaire requise.

## Email cascade-cancel

- Réutiliser `MailService.sendStatusUpdate(appointment)` qui gère déjà `CANCELLED` (cf. spec projet)
- Convention du projet : erreurs d'envoi mail silencieuses (commit `06ab8ae`)
- Pas de nouvelle méthode mail à créer

## Error handling

| Cas | Code HTTP | Message |
|---|---|---|
| Date déjà bloquée | 409 | "Cette date est déjà bloquée." |
| RDV actifs sans cascade | 409 | (body `{conflicts: [...]}`) |
| Date passée à bloquer | accepté | (Q6 : pas de logique passé) |
| DELETE date inexistante | 404 | "Aucune indisponibilité à cette date." |
| Création avec date invalide | 400 | (validation DTO `class-validator`) |

## Tests / QA manuelle

Pas d'infra de test dans le projet — QA manuelle sur les scénarios :

1. **Bloquer un jour libre** depuis le device A → vérifier sur device B (autre navigateur) que le jour est bien bloqué côté admin et côté calendrier client.
2. **Bloquer un jour avec un RDV PENDING** → modal s'affiche, confirmer → RDV passe `CANCELLED`, le client reçoit un email d'annulation, le jour est bloqué.
3. **Bloquer une plage de 7 jours dont 2 ont des RDV** → modal liste les 2 conflicts, confirmer → 2 RDV cancelled + 7 indispos créées (ou 5 selon dates déjà bloquées).
4. **Tenter une réservation sur un jour bloqué** depuis l'UI client → bouton de slot grisé. Tenter en POST direct (curl) → 409 "Cette date est indisponible."
5. **Débloquer un jour** depuis la liste → le jour redevient réservable côté client.

## Plan de déploiement

1. Dev sur branche locale `feat/unavailability-module`
2. Tester les 5 scénarios sur le local (`pnpm db:up` + `pnpm dev:backend` + `pnpm dev:frontend`)
3. Merge `main` → push → Railway redeploy backend (qui run `prisma migrate deploy`) → Vercel redeploy frontend
4. Vérifier en prod que la migration s'est appliquée (Prisma Studio ou Neon dashboard)
5. Smoke test prod : bloquer un jour test depuis l'admin, vérifier que le calendrier client le voit, débloquer.

## Hors scope (volontaire)

- Pas de récurrence hebdomadaire ("tous les mardis")
- Pas de granularité créneau (juste midi ou juste soir)
- Pas de raison/note attachée
- Pas de soft-delete / historique
- Pas de notification admin lors d'un cascade-cancel (c'est lui qui le déclenche)
