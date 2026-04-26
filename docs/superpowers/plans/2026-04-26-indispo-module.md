# Module Indisponibilité — Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le module d'indisponibilité actuel (basé sur localStorage, non fonctionnel) par un module backend-backed avec API, persistance Postgres, blocage par jour entier ou plage de dates, et cascade-cancel automatique des RDV existants avec email.

**Architecture:** Nouveau modèle Prisma `Unavailability(date unique)`, module Nest `UnavailabilitiesModule` (controller + service) avec routes publique GET et admin POST/DELETE, intégration dans `AppointmentsService` (lecture en `getAvailability`, vérif en `create`). Frontend : composable `useUnavailabilities()`, refonte de la page admin (intégration API + modal cascade + modal range), nettoyage du `BookingCalendar.vue` (suppression du code localStorage).

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL, Nuxt 3, Vue 3, Nuxt UI 2, Resend, pnpm workspaces.

**Spec source :** `docs/superpowers/specs/2026-04-26-indispo-design.md`

**Branche :** dev sur `feat/unavailability-module`, merge fast-forward sur `main` à la fin.

> **Note sur les tests :** le projet n'a aucune infra de test installée (pas de Jest, Vitest, Playwright). Introduire un framework dépasse de loin le scope. Le plan utilise une vérification manuelle systématique : `curl` sur les endpoints API + smoke tests dans le navigateur après chaque tâche frontend. Un script bash de QA est ajouté en fin de plan.

---

## File Structure

**Fichiers créés :**

```
apps/backend/src/unavailabilities/
├── unavailabilities.module.ts        ← Module Nest (provider + controller)
├── unavailabilities.controller.ts    ← Routes HTTP (GET public, POST/DELETE admin)
├── unavailabilities.service.ts       ← Logique métier : CRUD + cascade-cancel
└── dto/
    ├── create-unavailability.dto.ts       ← { date, cascade? }
    └── create-range.dto.ts                ← { from, to, cascade? }

apps/frontend/composables/
└── useUnavailabilities.ts            ← Wrapper $fetch des endpoints

packages/prisma/migrations/<timestamp>_add_unavailability/
└── migration.sql                     ← Généré par prisma migrate dev
```

**Fichiers modifiés :**

| Fichier | Pourquoi |
|---|---|
| `packages/prisma/schema.prisma` | Ajout du modèle `Unavailability` |
| `apps/backend/src/app.module.ts` | Importer `UnavailabilitiesModule` |
| `apps/backend/src/appointments/appointments.module.ts` | Importer `UnavailabilitiesModule` (pour injection) |
| `apps/backend/src/appointments/appointments.service.ts` | Consommer `UnavailabilitiesService` dans `getAvailability` et `create` |
| `apps/frontend/pages/admin/indisponibilite.vue` | Suppression localStorage, intégration API, modal cascade, modal range |
| `apps/frontend/components/BookingCalendar.vue` | Suppression de toute la logique `blockedDates`/`isBlocked` (devient redondant car le backend marque les slots) |

---

## Task 1: Setup branche + Prisma schema + migration

**Files:**
- Modify: `packages/prisma/schema.prisma`
- Create: `packages/prisma/migrations/<timestamp>_add_unavailability/migration.sql` (généré)

- [ ] **Step 1.1 : Créer la branche feature**

```bash
git checkout -b feat/unavailability-module
```

- [ ] **Step 1.2 : Ajouter le modèle Unavailability au schema Prisma**

Éditer `packages/prisma/schema.prisma`. Ajouter à la fin du fichier (après le modèle `Photo`) :

```prisma
model Unavailability {
  id        String   @id @default(cuid())
  date      DateTime @unique @db.Date
  createdAt DateTime @default(now())
}
```

- [ ] **Step 1.3 : Générer + appliquer la migration**

```bash
pnpm --filter backend exec prisma migrate dev --name add_unavailability
```

Expected: une nouvelle migration créée dans `packages/prisma/migrations/<timestamp>_add_unavailability/migration.sql` contenant un `CREATE TABLE "Unavailability"`. Le client Prisma est régénéré automatiquement.

- [ ] **Step 1.4 : Vérifier la table en base**

```bash
docker exec salon_postgres psql -U salon -d salon_booking -c "\d \"Unavailability\""
```

Expected: 3 colonnes (`id`, `date`, `createdAt`), `date` UNIQUE.

- [ ] **Step 1.5 : Commit**

```bash
git add packages/prisma/schema.prisma packages/prisma/migrations/
git commit -m "feat(db): add Unavailability model + migration"
```

---

## Task 2: DTOs

**Files:**
- Create: `apps/backend/src/unavailabilities/dto/create-unavailability.dto.ts`
- Create: `apps/backend/src/unavailabilities/dto/create-range.dto.ts`

- [ ] **Step 2.1 : Créer le DTO single**

Fichier `apps/backend/src/unavailabilities/dto/create-unavailability.dto.ts` :

```typescript
import { IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateUnavailabilityDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsBoolean()
  cascade?: boolean;
}
```

- [ ] **Step 2.2 : Créer le DTO range**

Fichier `apps/backend/src/unavailabilities/dto/create-range.dto.ts` :

```typescript
import { IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateRangeDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsBoolean()
  cascade?: boolean;
}
```

- [ ] **Step 2.3 : Commit**

```bash
git add apps/backend/src/unavailabilities/dto/
git commit -m "feat(unavailabilities): add DTOs"
```

---

## Task 3: UnavailabilitiesService — CRUD basique (sans cascade)

**Files:**
- Create: `apps/backend/src/unavailabilities/unavailabilities.service.ts`

- [ ] **Step 3.1 : Créer le service**

Fichier `apps/backend/src/unavailabilities/unavailabilities.service.ts` :

```typescript
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateUnavailabilityDto } from './dto/create-unavailability.dto';
import { CreateRangeDto } from './dto/create-range.dto';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

@Injectable()
export class UnavailabilitiesService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async findAll(month?: string) {
    if (month) {
      const ref = new Date(`${month}-01`);
      const from = startOfMonth(ref);
      const to = endOfMonth(ref);
      return this.prisma.unavailability.findMany({
        where: { date: { gte: from, lte: to } },
        orderBy: { date: 'asc' },
      });
    }
    return this.prisma.unavailability.findMany({ orderBy: { date: 'asc' } });
  }

  async findInRange(from: Date, to: Date) {
    return this.prisma.unavailability.findMany({
      where: { date: { gte: from, lte: to } },
    });
  }

  async deleteByDate(dateStr: string) {
    const date = new Date(dateStr);
    const existing = await this.prisma.unavailability.findUnique({ where: { date } });
    if (!existing) {
      throw new NotFoundException('Aucune indisponibilité à cette date.');
    }
    await this.prisma.unavailability.delete({ where: { date } });
  }

  async create(dto: CreateUnavailabilityDto) {
    const date = new Date(dto.date);

    // Note: cascade-cancel logic added in Task 5
    try {
      return await this.prisma.unavailability.create({ data: { date } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Cette date est déjà bloquée.');
      }
      throw error;
    }
  }
}
```

- [ ] **Step 3.2 : Vérifier que ça compile**

```bash
pnpm --filter backend exec tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Step 3.3 : Commit**

```bash
git add apps/backend/src/unavailabilities/unavailabilities.service.ts
git commit -m "feat(unavailabilities): add service with basic CRUD"
```

---

## Task 4: UnavailabilitiesController + Module + AppModule wiring

**Files:**
- Create: `apps/backend/src/unavailabilities/unavailabilities.controller.ts`
- Create: `apps/backend/src/unavailabilities/unavailabilities.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 4.1 : Créer le controller**

Fichier `apps/backend/src/unavailabilities/unavailabilities.controller.ts` :

```typescript
import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UnavailabilitiesService } from './unavailabilities.service';
import { CreateUnavailabilityDto } from './dto/create-unavailability.dto';
import { CreateRangeDto } from './dto/create-range.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('unavailabilities')
export class UnavailabilitiesController {
  constructor(private readonly service: UnavailabilitiesService) {}

  @Get()
  findAll(@Query('month') month?: string) {
    return this.service.findAll(month);
  }

  @UseGuards(AdminGuard)
  @Post('admin')
  create(@Body() dto: CreateUnavailabilityDto) {
    return this.service.create(dto);
  }

  @UseGuards(AdminGuard)
  @Delete('admin/by-date/:date')
  deleteByDate(@Param('date') date: string) {
    return this.service.deleteByDate(date);
  }
}
```

(La route `/admin/range` sera ajoutée en Task 6.)

- [ ] **Step 4.2 : Créer le module**

Fichier `apps/backend/src/unavailabilities/unavailabilities.module.ts` :

```typescript
import { Module } from '@nestjs/common';
import { UnavailabilitiesController } from './unavailabilities.controller';
import { UnavailabilitiesService } from './unavailabilities.service';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MailModule, AuthModule],
  controllers: [UnavailabilitiesController],
  providers: [UnavailabilitiesService],
  exports: [UnavailabilitiesService],
})
export class UnavailabilitiesModule {}
```

- [ ] **Step 4.3 : Enregistrer dans AppModule**

Éditer `apps/backend/src/app.module.ts`. Ajouter l'import en haut :

```typescript
import { UnavailabilitiesModule } from './unavailabilities/unavailabilities.module';
```

Ajouter `UnavailabilitiesModule` dans le tableau `imports` (après `AppointmentsModule`) :

```typescript
imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  PrismaModule,
  MailModule,
  AuthModule,
  AppointmentsModule,
  UnavailabilitiesModule,
  PhotosModule,
],
```

- [ ] **Step 4.4 : Vérifier que ça compile + démarre**

```bash
pnpm --filter backend exec tsc --noEmit
```

Expected: 0 erreurs.

Redémarrer le backend (s'il tourne déjà, le watch reload prend le relais ; sinon `pnpm dev:backend` dans un autre terminal).

Vérifier le mapping de route dans la sortie Nest :

```
[RoutesResolver] UnavailabilitiesController {/unavailabilities}:
[RouterExplorer] Mapped {/unavailabilities, GET} route
[RouterExplorer] Mapped {/unavailabilities/admin, POST} route
[RouterExplorer] Mapped {/unavailabilities/admin/by-date/:date, DELETE} route
```

- [ ] **Step 4.5 : Smoke test des endpoints**

```bash
# GET public, doit retourner []
curl -s http://localhost:3001/unavailabilities | jq

# POST admin sans password → 401
curl -s -X POST http://localhost:3001/unavailabilities/admin \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-12-25"}' | jq

# POST admin avec password → 201 + objet créé
curl -s -X POST http://localhost:3001/unavailabilities/admin \
  -H "Content-Type: application/json" \
  -H "x-admin-password: changeme_admin_password" \
  -d '{"date":"2026-12-25"}' | jq

# Re-POST même date → 409 "Cette date est déjà bloquée."
curl -s -X POST http://localhost:3001/unavailabilities/admin \
  -H "Content-Type: application/json" \
  -H "x-admin-password: changeme_admin_password" \
  -d '{"date":"2026-12-25"}' | jq

# GET → la date apparaît
curl -s http://localhost:3001/unavailabilities | jq

# DELETE par date
curl -s -X DELETE http://localhost:3001/unavailabilities/admin/by-date/2026-12-25 \
  -H "x-admin-password: changeme_admin_password" | jq

# DELETE date inexistante → 404
curl -s -X DELETE http://localhost:3001/unavailabilities/admin/by-date/2099-01-01 \
  -H "x-admin-password: changeme_admin_password" | jq
```

Expected: chaque comportement décrit dans les commentaires se produit.

- [ ] **Step 4.6 : Commit**

```bash
git add apps/backend/src/unavailabilities/unavailabilities.controller.ts \
        apps/backend/src/unavailabilities/unavailabilities.module.ts \
        apps/backend/src/app.module.ts
git commit -m "feat(unavailabilities): controller + module + AppModule wiring"
```

---

## Task 5: Cascade-cancel sur POST single

**Files:**
- Modify: `apps/backend/src/unavailabilities/unavailabilities.service.ts`

- [ ] **Step 5.1 : Ajouter la logique cascade dans `create()`**

Remplacer la méthode `create()` du service par :

```typescript
async create(dto: CreateUnavailabilityDto) {
  const date = new Date(dto.date);

  // 1. Lister les RDV actifs sur cette date
  const activeBookings = await this.prisma.appointment.findMany({
    where: {
      date,
      status: { not: 'CANCELLED' },
    },
    select: {
      id: true,
      timeSlot: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  // 2. Conflit sans cascade → 409 avec liste
  if (activeBookings.length > 0 && !dto.cascade) {
    throw new ConflictException({
      message: 'Des RDV actifs existent sur cette date.',
      conflicts: activeBookings,
    });
  }

  // 3. Transaction : cancel tous les RDV + insert l'unavailability
  let cancelledForMail: typeof activeBookings = [];
  try {
    cancelledForMail = await this.prisma.$transaction(async (tx) => {
      if (activeBookings.length > 0) {
        await tx.appointment.updateMany({
          where: { date, status: { not: 'CANCELLED' } },
          data: { status: 'CANCELLED' },
        });
      }
      await tx.unavailability.create({ data: { date } });
      return activeBookings;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Cette date est déjà bloquée.');
    }
    throw error;
  }

  // 4. Envoi des mails APRÈS commit (side-effect non rollbackable, erreurs silenciées)
  for (const b of cancelledForMail) {
    const full = await this.prisma.appointment.findUnique({ where: { id: b.id } });
    if (full) {
      await this.mail.sendStatusUpdate(full).catch(() => {});
    }
  }

  return this.prisma.unavailability.findUnique({ where: { date } });
}
```

- [ ] **Step 5.2 : Vérifier la compilation**

```bash
pnpm --filter backend exec tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Step 5.3 : Smoke test cascade**

Préparer un RDV de test :

```bash
# Créer un RDV pour le 2026-12-26 à 12:00 (jeudi → 12:00 réservé pour Benj, on prend 18:00)
# 2026-12-26 est un samedi en réalité, donc créneaux WE 13-18h. On prend 14:00.
curl -s -X POST http://localhost:3001/appointments \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-12-26","timeSlot":"14:00","firstName":"Test","lastName":"User","email":"test@example.com"}' | jq

# Tenter de bloquer la date sans cascade → 409 + body avec conflicts
curl -s -X POST http://localhost:3001/unavailabilities/admin \
  -H "Content-Type: application/json" \
  -H "x-admin-password: changeme_admin_password" \
  -d '{"date":"2026-12-26"}' -w "\nHTTP:%{http_code}\n" | jq

# Avec cascade → succès, RDV cancelled
curl -s -X POST http://localhost:3001/unavailabilities/admin \
  -H "Content-Type: application/json" \
  -H "x-admin-password: changeme_admin_password" \
  -d '{"date":"2026-12-26","cascade":true}' | jq

# Vérifier le RDV : doit être en CANCELLED
docker exec salon_postgres psql -U salon -d salon_booking -c \
  "SELECT id, status FROM \"Appointment\" WHERE email='test@example.com'"

# Cleanup
curl -s -X DELETE http://localhost:3001/unavailabilities/admin/by-date/2026-12-26 \
  -H "x-admin-password: changeme_admin_password" | jq
docker exec salon_postgres psql -U salon -d salon_booking -c \
  "DELETE FROM \"Appointment\" WHERE email='test@example.com'"
```

Expected: première tentative retourne 409 avec `conflicts` array. Deuxième tentative crée l'unavailability et passe le RDV en CANCELLED. Si `RESEND_API_KEY` est valide, un email est envoyé (sinon erreur silenciée comme prévu).

- [ ] **Step 5.4 : Commit**

```bash
git add apps/backend/src/unavailabilities/unavailabilities.service.ts
git commit -m "feat(unavailabilities): cascade-cancel active bookings on POST"
```

---

## Task 6: Range endpoint (POST /admin/range)

**Files:**
- Modify: `apps/backend/src/unavailabilities/unavailabilities.service.ts`
- Modify: `apps/backend/src/unavailabilities/unavailabilities.controller.ts`

- [ ] **Step 6.1 : Ajouter `createRange()` au service**

Ajouter cette méthode dans `UnavailabilitiesService` (avant `create()` ou après — au choix) :

```typescript
async createRange(dto: CreateRangeDto) {
  const from = new Date(dto.from);
  const to = new Date(dto.to);

  if (from > to) {
    throw new ConflictException('La date de début doit être antérieure ou égale à la date de fin.');
  }

  const days = eachDayOfInterval({ start: from, end: to });

  // 1. Récupérer les indispos déjà existantes dans la plage
  const existing = await this.prisma.unavailability.findMany({
    where: { date: { gte: from, lte: to } },
    select: { date: true },
  });
  const existingSet = new Set(existing.map(u => format(u.date, 'yyyy-MM-dd')));

  const datesToCreate = days
    .map(d => format(d, 'yyyy-MM-dd'))
    .filter(d => !existingSet.has(d));

  // 2. Lister tous les RDV actifs sur les dates à créer
  const activeBookings = await this.prisma.appointment.findMany({
    where: {
      date: { in: datesToCreate.map(d => new Date(d)) },
      status: { not: 'CANCELLED' },
    },
    select: {
      id: true,
      date: true,
      timeSlot: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  // 3. Conflit sans cascade → 409
  if (activeBookings.length > 0 && !dto.cascade) {
    throw new ConflictException({
      message: 'Des RDV actifs existent dans la plage.',
      conflicts: activeBookings.map(b => ({
        ...b,
        date: format(b.date, 'yyyy-MM-dd'),
      })),
    });
  }

  // 4. Transaction : cancel + bulk create
  await this.prisma.$transaction(async (tx) => {
    if (activeBookings.length > 0) {
      await tx.appointment.updateMany({
        where: {
          date: { in: datesToCreate.map(d => new Date(d)) },
          status: { not: 'CANCELLED' },
        },
        data: { status: 'CANCELLED' },
      });
    }
    if (datesToCreate.length > 0) {
      await tx.unavailability.createMany({
        data: datesToCreate.map(d => ({ date: new Date(d) })),
        skipDuplicates: true,
      });
    }
  });

  // 5. Mails post-commit
  for (const b of activeBookings) {
    const full = await this.prisma.appointment.findUnique({ where: { id: b.id } });
    if (full) {
      await this.mail.sendStatusUpdate(full).catch(() => {});
    }
  }

  // 6. Retour
  const created = await this.prisma.unavailability.findMany({
    where: { date: { in: datesToCreate.map(d => new Date(d)) } },
    orderBy: { date: 'asc' },
  });
  return {
    created,
    skipped: Array.from(existingSet),
  };
}
```

- [ ] **Step 6.2 : Ajouter la route au controller**

Ajouter dans `UnavailabilitiesController` (après la route POST simple) :

```typescript
@UseGuards(AdminGuard)
@Post('admin/range')
createRange(@Body() dto: CreateRangeDto) {
  return this.service.createRange(dto);
}
```

(L'import `CreateRangeDto` est déjà dans le fichier depuis Task 4.)

- [ ] **Step 6.3 : Vérifier la compilation**

```bash
pnpm --filter backend exec tsc --noEmit
```

- [ ] **Step 6.4 : Smoke test range**

```bash
# Bloquer une plage de 3 jours
curl -s -X POST http://localhost:3001/unavailabilities/admin/range \
  -H "Content-Type: application/json" \
  -H "x-admin-password: changeme_admin_password" \
  -d '{"from":"2026-12-20","to":"2026-12-22"}' | jq

# Vérifier les 3 dates créées
curl -s "http://localhost:3001/unavailabilities?month=2026-12" | jq

# Re-tenter même plage → skipped non vide, created vide
curl -s -X POST http://localhost:3001/unavailabilities/admin/range \
  -H "Content-Type: application/json" \
  -H "x-admin-password: changeme_admin_password" \
  -d '{"from":"2026-12-20","to":"2026-12-22"}' | jq

# Range avec from > to → 409
curl -s -X POST http://localhost:3001/unavailabilities/admin/range \
  -H "Content-Type: application/json" \
  -H "x-admin-password: changeme_admin_password" \
  -d '{"from":"2026-12-22","to":"2026-12-20"}' -w "\nHTTP:%{http_code}\n" | jq

# Cleanup
for d in 2026-12-20 2026-12-21 2026-12-22; do
  curl -s -X DELETE http://localhost:3001/unavailabilities/admin/by-date/$d \
    -H "x-admin-password: changeme_admin_password"
done
```

- [ ] **Step 6.5 : Commit**

```bash
git add apps/backend/src/unavailabilities/unavailabilities.service.ts \
        apps/backend/src/unavailabilities/unavailabilities.controller.ts
git commit -m "feat(unavailabilities): range endpoint with bulk cascade"
```

---

## Task 7: Intégration dans `AppointmentsService`

**Files:**
- Modify: `apps/backend/src/appointments/appointments.module.ts`
- Modify: `apps/backend/src/appointments/appointments.service.ts`

- [ ] **Step 7.1 : Importer `UnavailabilitiesModule` dans `AppointmentsModule`**

Éditer `apps/backend/src/appointments/appointments.module.ts` :

```typescript
import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { MailModule } from '../mail/mail.module';
import { AuthModule } from '../auth/auth.module';
import { UnavailabilitiesModule } from '../unavailabilities/unavailabilities.module';

@Module({
  imports: [MailModule, AuthModule, UnavailabilitiesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
```

- [ ] **Step 7.2 : Injecter `UnavailabilitiesService` + adapter `getAvailability` et `create`**

Éditer `apps/backend/src/appointments/appointments.service.ts`. Ajouter l'import :

```typescript
import { UnavailabilitiesService } from '../unavailabilities/unavailabilities.service';
```

Modifier le constructeur :

```typescript
constructor(
  private prisma: PrismaService,
  private mail: MailService,
  private unavailabilities: UnavailabilitiesService,
) {}
```

Remplacer entièrement la méthode `getAvailability` :

```typescript
async getAvailability(month?: string, start?: string, end?: string) {
  let from: Date;
  let to: Date;

  if (month) {
    const ref = new Date(`${month}-01`);
    from = startOfMonth(ref);
    to = endOfMonth(ref);
  } else if (start && end) {
    from = new Date(start);
    to = new Date(end);
  } else {
    from = startOfMonth(new Date());
    to = endOfMonth(new Date());
  }

  const [booked, unavailable] = await Promise.all([
    this.prisma.appointment.findMany({
      where: {
        date: { gte: from, lte: to },
        status: { not: 'CANCELLED' },
      },
      select: { date: true, timeSlot: true, firstName: true, lastName: true, status: true },
    }),
    this.unavailabilities.findInRange(from, to),
  ]);

  const blockedSet = new Set(unavailable.map(u => format(u.date, 'yyyy-MM-dd')));

  const allDays = eachDayOfInterval({ start: from, end: to });
  return allDays.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayOfWeek = day.getDay();
    const isWeekend = isWeekendDay(dayOfWeek);
    const isThursday = dayOfWeek === 4;
    const daySlots = getSlotsForDay(dayOfWeek);
    const isBlocked = blockedSet.has(dateStr);

    const slots = daySlots.map(time => {
      // Thursday noon = Benj Brichet
      if (isThursday && time === '12:00') {
        return {
          time,
          available: false,
          bookedBy: 'Benj Brichet',
          isPending: false,
          isBenjThursday: true,
        };
      }

      // Slot bloqué par admin → ressemble à un slot réservé sans nom
      if (isBlocked) {
        return {
          time,
          available: false,
          bookedBy: undefined,
          isPending: false,
          isBenjThursday: false,
        };
      }

      const booking = booked.find(
        a => format(a.date, 'yyyy-MM-dd') === dateStr && a.timeSlot === time,
      );

      return {
        time,
        available: !booking,
        bookedBy: booking ? `${booking.firstName} ${booking.lastName[0]}.` : undefined,
        isPending: booking ? booking.status === 'PENDING' : false,
        isBenjThursday: false,
      };
    });

    return { date: dateStr, isWeekend, slots };
  });
}
```

Modifier la méthode `create` — ajouter une vérification au début, juste après le calcul de `dayOfWeek` :

```typescript
async create(dto: CreateAppointmentDto) {
  const date = new Date(dto.date);
  const dayOfWeek = date.getDay();

  // NEW: rejeter si date bloquée par admin
  const blocked = await this.prisma.unavailability.findUnique({ where: { date } });
  if (blocked) {
    throw new ConflictException('Cette date est indisponible.');
  }

  const allowedSlots = getSlotsForDay(dayOfWeek);
  // ... le reste de la méthode reste identique
```

- [ ] **Step 7.3 : Vérifier la compilation**

```bash
pnpm --filter backend exec tsc --noEmit
```

Expected: 0 erreurs.

- [ ] **Step 7.4 : Smoke test intégration**

```bash
# Bloquer le 2026-12-15
curl -s -X POST http://localhost:3001/unavailabilities/admin \
  -H "Content-Type: application/json" \
  -H "x-admin-password: changeme_admin_password" \
  -d '{"date":"2026-12-15"}' | jq

# GET availability décembre 2026 → vérifier que les slots du 15 ont tous available:false
curl -s "http://localhost:3001/appointments/availability?month=2026-12" \
  | jq '.[] | select(.date=="2026-12-15")'

# Tenter de créer un RDV sur le 15 → 409 "Cette date est indisponible."
curl -s -X POST http://localhost:3001/appointments \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-12-15","timeSlot":"18:00","firstName":"Bob","lastName":"Test","email":"bob@test.com"}' \
  -w "\nHTTP:%{http_code}\n" | jq

# Cleanup
curl -s -X DELETE http://localhost:3001/unavailabilities/admin/by-date/2026-12-15 \
  -H "x-admin-password: changeme_admin_password"
```

Expected: GET retourne tous les slots du 15 avec `available:false` et `bookedBy:null/undefined`. POST appointment retourne 409.

- [ ] **Step 7.5 : Commit**

```bash
git add apps/backend/src/appointments/appointments.module.ts \
        apps/backend/src/appointments/appointments.service.ts
git commit -m "feat(appointments): integrate unavailabilities (block in availability + reject on create)"
```

---

## Task 8: Frontend composable

**Files:**
- Create: `apps/frontend/composables/useUnavailabilities.ts`

- [ ] **Step 8.1 : Créer le composable**

Fichier `apps/frontend/composables/useUnavailabilities.ts` :

```typescript
export interface Unavailability {
  id: string
  date: string
  createdAt: string
}

export interface ConflictBooking {
  id: string
  date?: string
  timeSlot: string
  firstName: string
  lastName: string
  email: string
}

export interface RangeResult {
  created: Unavailability[]
  skipped: string[]
}

export const useUnavailabilities = () => {
  const config = useRuntimeConfig()
  const API = config.public.apiUrl

  const getAll = (month?: string) =>
    $fetch<Unavailability[]>(`${API}/unavailabilities${month ? `?month=${month}` : ''}`)

  const create = (date: string, adminPassword: string, cascade = false) =>
    $fetch<Unavailability>(`${API}/unavailabilities/admin`, {
      method: 'POST',
      body: { date, cascade },
      headers: { 'x-admin-password': adminPassword },
    })

  const createRange = (from: string, to: string, adminPassword: string, cascade = false) =>
    $fetch<RangeResult>(`${API}/unavailabilities/admin/range`, {
      method: 'POST',
      body: { from, to, cascade },
      headers: { 'x-admin-password': adminPassword },
    })

  const removeByDate = (date: string, adminPassword: string) =>
    $fetch(`${API}/unavailabilities/admin/by-date/${date}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': adminPassword },
    })

  return { getAll, create, createRange, removeByDate }
}
```

- [ ] **Step 8.2 : Commit**

```bash
git add apps/frontend/composables/useUnavailabilities.ts
git commit -m "feat(frontend): add useUnavailabilities composable"
```

---

## Task 9: Refonte de la page admin

**Files:**
- Modify: `apps/frontend/pages/admin/indisponibilite.vue`

- [ ] **Step 9.1 : Réécrire entièrement la page**

Remplacer **tout le contenu** de `apps/frontend/pages/admin/indisponibilite.vue` par :

```vue
<template>
  <div class="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
    <!-- Header -->
    <div class="bg-white border-b border-zinc-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center gap-4">
          <button
            @click="router.push('/admin')"
            class="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-zinc-900">Gérer l'indisponibilité</h1>
            <p class="text-sm text-zinc-500 mt-1">Bloquez les jours non disponibles</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Sidebar - Quick Actions -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl border border-zinc-200 p-6 sticky top-24">
            <h3 class="font-semibold text-zinc-900 mb-4">Actions rapides</h3>

            <div class="space-y-3">
              <button
                :disabled="loading"
                @click="onBlockToday"
                class="w-full py-3 px-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium hover:bg-red-100 transition-colors text-sm disabled:opacity-50"
              >
                Bloquer aujourd'hui
              </button>

              <button
                :disabled="loading"
                @click="rangeModalOpen = true"
                class="w-full py-3 px-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-medium hover:bg-amber-100 transition-colors text-sm disabled:opacity-50"
              >
                Bloquer une plage
              </button>

              <button
                :disabled="loading || blockedDates.length === 0"
                @click="clearAllModalOpen = true"
                class="w-full py-3 px-4 bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-700 font-medium hover:bg-zinc-200 transition-colors text-sm disabled:opacity-50"
              >
                Débloquer tout
              </button>
            </div>

            <div class="mt-8 pt-6 border-t border-zinc-200">
              <div class="text-sm text-zinc-500 mb-2">Jour(s) bloqué(s)</div>
              <div class="text-3xl font-bold text-zinc-900">{{ blockedDates.length }}</div>
            </div>
          </div>
        </div>

        <!-- Main Content - Calendar -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl border border-zinc-200 p-6 mb-6">
            <div class="flex items-center justify-between mb-6">
              <button @click="previousMonth" class="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <h3 class="text-lg font-bold text-zinc-900">
                {{ currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }) }}
              </h3>

              <button @click="nextMonth" class="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                <svg class="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-7 gap-2 mb-4">
              <div v-for="(day, i) in ['L', 'M', 'M', 'J', 'V', 'S', 'D']" :key="i" class="text-center text-xs font-semibold text-zinc-500 py-2">
                {{ day }}
              </div>
            </div>

            <div class="grid grid-cols-7 gap-2">
              <button
                v-for="day in calendarDays"
                :key="day.date"
                @click="onToggleDay(day.date)"
                :disabled="day.isOtherMonth || loading"
                class="aspect-square p-2 rounded-lg transition-all relative group"
                :class="[
                  day.isOtherMonth ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
                  day.isBlocked
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-zinc-50 text-zinc-900 hover:bg-zinc-100 border border-zinc-200',
                ]"
              >
                <span class="text-sm">{{ day.day }}</span>
                <div v-if="day.isBlocked" class="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
              </button>
            </div>
          </div>

          <!-- Blocked Dates List -->
          <div class="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 class="font-semibold text-zinc-900 mb-4">Jours bloqués</h3>

            <div v-if="blockedDates.length === 0" class="text-center py-8 text-zinc-500">
              <p>Aucun jour bloqué</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="date in sortedBlockedDates"
                :key="date"
                class="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <span class="font-medium text-red-900">
                  {{ new Date(date).toLocaleString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
                </span>
                <button
                  @click="onUnblock(date)"
                  :disabled="loading"
                  class="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                >
                  Débloquer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal cascade-cancel -->
    <UModal v-model="cascadeModalOpen">
      <div class="p-6">
        <h3 class="text-lg font-bold text-zinc-900 mb-3">Confirmer le blocage</h3>
        <p class="text-sm text-zinc-700 mb-4">
          {{ cascadeConflicts.length }} RDV actif(s) sur le
          <strong>{{ cascadeDateLabel }}</strong>.
          Bloquer va les annuler et envoyer un email d'annulation au(x) client(s).
        </p>
        <ul class="text-xs text-zinc-600 mb-6 space-y-1 max-h-40 overflow-y-auto">
          <li v-for="c in cascadeConflicts" :key="c.id" class="flex justify-between">
            <span>{{ c.firstName }} {{ c.lastName }} — {{ c.timeSlot }}</span>
            <span class="text-zinc-400">{{ c.email }}</span>
          </li>
        </ul>
        <div class="flex justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="cascadeModalOpen = false">Annuler</UButton>
          <UButton color="red" @click="confirmCascade">Bloquer et annuler les RDV</UButton>
        </div>
      </div>
    </UModal>

    <!-- Modal range -->
    <UModal v-model="rangeModalOpen">
      <div class="p-6">
        <h3 class="text-lg font-bold text-zinc-900 mb-4">Bloquer une plage de dates</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1">Du</label>
            <UInput v-model="rangeFrom" type="date" />
          </div>
          <div>
            <label class="block text-sm font-medium text-zinc-700 mb-1">Au</label>
            <UInput v-model="rangeTo" type="date" />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <UButton color="gray" variant="ghost" @click="rangeModalOpen = false">Annuler</UButton>
          <UButton color="indigo" :disabled="!rangeFrom || !rangeTo" @click="onSubmitRange">Bloquer la plage</UButton>
        </div>
      </div>
    </UModal>

    <!-- Modal "Débloquer tout" -->
    <UModal v-model="clearAllModalOpen">
      <div class="p-6">
        <h3 class="text-lg font-bold text-zinc-900 mb-3">Débloquer tous les jours ?</h3>
        <p class="text-sm text-zinc-700 mb-6">
          Ceci supprimera les <strong>{{ blockedDates.length }}</strong> indisponibilité(s) actuellement enregistrée(s).
        </p>
        <div class="flex justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="clearAllModalOpen = false">Annuler</UButton>
          <UButton color="red" @click="confirmClearAll">Tout débloquer</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import type { Unavailability, ConflictBooking } from '~/composables/useUnavailabilities'

definePageMeta({ middleware: 'auth-admin' })

const router = useRouter()
const toast = useToast()
const { getAll, create, createRange, removeByDate } = useUnavailabilities()

const adminPassword = ref('')
const currentDate = ref(new Date())
const unavailabilities = ref<Unavailability[]>([])
const loading = ref(false)

// Modals
const cascadeModalOpen = ref(false)
const cascadeConflicts = ref<ConflictBooking[]>([])
const cascadePendingDate = ref<string | null>(null)
const cascadePendingMode = ref<'single' | 'range'>('single')
const cascadePendingRange = ref<{ from: string; to: string } | null>(null)
const cascadeDateLabel = ref('')

const rangeModalOpen = ref(false)
const rangeFrom = ref('')
const rangeTo = ref('')

const clearAllModalOpen = ref(false)

const blockedDates = computed(() => unavailabilities.value.map(u => u.date.slice(0, 10)))
const sortedBlockedDates = computed(() => [...blockedDates.value].sort())

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const startDate = new Date(firstDay)
  const offset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  startDate.setDate(startDate.getDate() - offset)

  const days = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const isCurrentMonth = date.getMonth() === month
    days.push({
      date: dateStr,
      day: date.getDate(),
      isOtherMonth: !isCurrentMonth,
      isBlocked: blockedDates.value.includes(dateStr),
    })
  }
  return days
})

async function loadMonth() {
  loading.value = true
  try {
    unavailabilities.value = await getAll(format(currentDate.value, 'yyyy-MM'))
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e?.data?.message || 'Chargement impossible', color: 'red' })
  } finally {
    loading.value = false
  }
}

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  loadMonth()
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  loadMonth()
}

async function onToggleDay(date: string) {
  if (blockedDates.value.includes(date)) {
    await onUnblock(date)
  } else {
    await tryBlock(date)
  }
}

async function tryBlock(date: string) {
  loading.value = true
  try {
    await create(date, adminPassword.value, false)
    toast.add({ title: 'Jour bloqué', color: 'green' })
    await loadMonth()
  } catch (e: any) {
    if (e?.statusCode === 409 && e?.data?.conflicts) {
      // Conflit avec RDV existants → ouvrir modal cascade
      cascadeConflicts.value = e.data.conflicts
      cascadePendingDate.value = date
      cascadePendingMode.value = 'single'
      cascadeDateLabel.value = new Date(date).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      cascadeModalOpen.value = true
    } else {
      toast.add({ title: 'Erreur', description: e?.data?.message || 'Blocage impossible', color: 'red' })
    }
  } finally {
    loading.value = false
  }
}

async function onBlockToday() {
  await tryBlock(format(new Date(), 'yyyy-MM-dd'))
}

async function onUnblock(date: string) {
  loading.value = true
  try {
    await removeByDate(date, adminPassword.value)
    toast.add({ title: 'Jour débloqué', color: 'green' })
    await loadMonth()
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e?.data?.message || 'Déblocage impossible', color: 'red' })
  } finally {
    loading.value = false
  }
}

async function onSubmitRange() {
  if (!rangeFrom.value || !rangeTo.value) return
  rangeModalOpen.value = false
  loading.value = true
  try {
    await createRange(rangeFrom.value, rangeTo.value, adminPassword.value, false)
    toast.add({ title: 'Plage bloquée', color: 'green' })
    rangeFrom.value = ''
    rangeTo.value = ''
    await loadMonth()
  } catch (e: any) {
    if (e?.statusCode === 409 && e?.data?.conflicts) {
      cascadeConflicts.value = e.data.conflicts
      cascadePendingMode.value = 'range'
      cascadePendingRange.value = { from: rangeFrom.value, to: rangeTo.value }
      cascadeDateLabel.value = `${rangeFrom.value} → ${rangeTo.value}`
      cascadeModalOpen.value = true
    } else {
      toast.add({ title: 'Erreur', description: e?.data?.message || 'Blocage plage impossible', color: 'red' })
    }
  } finally {
    loading.value = false
  }
}

async function confirmCascade() {
  cascadeModalOpen.value = false
  loading.value = true
  try {
    if (cascadePendingMode.value === 'single' && cascadePendingDate.value) {
      await create(cascadePendingDate.value, adminPassword.value, true)
    } else if (cascadePendingMode.value === 'range' && cascadePendingRange.value) {
      await createRange(cascadePendingRange.value.from, cascadePendingRange.value.to, adminPassword.value, true)
      rangeFrom.value = ''
      rangeTo.value = ''
    }
    toast.add({ title: 'Blocage effectué', description: 'Les RDV ont été annulés et les clients notifiés.', color: 'green' })
    await loadMonth()
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e?.data?.message || 'Cascade impossible', color: 'red' })
  } finally {
    loading.value = false
    cascadeConflicts.value = []
    cascadePendingDate.value = null
    cascadePendingRange.value = null
  }
}

async function confirmClearAll() {
  clearAllModalOpen.value = false
  loading.value = true
  try {
    for (const date of [...blockedDates.value]) {
      await removeByDate(date, adminPassword.value)
    }
    toast.add({ title: 'Tous les jours débloqués', color: 'green' })
    await loadMonth()
  } catch (e: any) {
    toast.add({ title: 'Erreur', description: e?.data?.message || 'Déblocage en masse impossible', color: 'red' })
    await loadMonth()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Récupère le password depuis le cookie posé par /admin/login
  adminPassword.value = useCookie('admin_password').value || ''
  loadMonth()
})
</script>
```

- [ ] **Step 9.2 : Smoke test browser**

S'assurer que backend et frontend tournent (`pnpm dev:backend` + `pnpm dev:frontend`).

Dans le navigateur :

1. Aller sur `http://localhost:3000/admin/login` → entrer `changeme_admin_password`
2. Aller sur `http://localhost:3000/admin/indisponibilite`
3. Cliquer sur un jour libre → doit passer en rouge, toast "Jour bloqué"
4. Cliquer sur le même jour rouge → doit redevenir libre, toast "Jour débloqué"
5. Cliquer "Bloquer aujourd'hui" → la date du jour passe en rouge
6. Cliquer "Bloquer une plage" → modal s'ouvre, choisir une plage de 3 jours, valider → 3 jours en rouge
7. Cliquer "Débloquer tout" → modal de confirmation, valider → tous reviennent libres
8. Vérifier dans la liste "Jours bloqués" que les actions s'y reflètent

- [ ] **Step 9.3 : Smoke test cascade**

Préparer un RDV via curl :

```bash
curl -s -X POST http://localhost:3001/appointments \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-12-26","timeSlot":"14:00","firstName":"Test","lastName":"Cascade","email":"cascade@test.com"}' | jq
```

Dans le navigateur, sur la page admin/indisponibilite, cliquer sur le 26 décembre 2026 (naviguer au mois si besoin) :
- Modal cascade s'affiche avec le RDV "Test Cascade"
- Cliquer "Bloquer et annuler les RDV"
- Toast "Blocage effectué", le 26 passe en rouge
- Vérifier en base : `docker exec salon_postgres psql -U salon -d salon_booking -c "SELECT status FROM \"Appointment\" WHERE email='cascade@test.com'"` → CANCELLED

Cleanup :

```bash
docker exec salon_postgres psql -U salon -d salon_booking -c \
  "DELETE FROM \"Appointment\" WHERE email='cascade@test.com'"
```

- [ ] **Step 9.4 : Commit**

```bash
git add apps/frontend/pages/admin/indisponibilite.vue
git commit -m "feat(admin): rewrite indispo page with API + cascade modal + range modal"
```

---

## Task 10: Cleanup `BookingCalendar.vue`

**Files:**
- Modify: `apps/frontend/components/BookingCalendar.vue`

- [ ] **Step 10.1 : Supprimer la logique localStorage**

Dans `apps/frontend/components/BookingCalendar.vue` :

**Dans le `<script setup>`** :

Supprimer ces lignes :

```typescript
const blockedDates = ref<string[]>([])

// Load blocked dates from localStorage on mount
const loadBlockedDates = () => {
  if (typeof window !== 'undefined') {
    try {
      blockedDates.value = JSON.parse(localStorage.getItem('blockedDates') || '[]')
    } catch {
      blockedDates.value = []
    }
  }
}
```

Dans l'interface `DayCell`, supprimer la ligne `isBlocked: boolean`.

Dans `daysInMonth.value.map(...)`, supprimer la ligne `const isBlocked = blockedDates.value.includes(dateStr)` et la propriété `isBlocked` du retour.

Dans `dayCellClass(day: DayCell)`, supprimer le bloc :

```typescript
if (day.isBlocked) {
  return 'bg-red-100 text-red-700 cursor-not-allowed ring-2 ring-red-300 ring-offset-1 shadow-sm shadow-red-200'
}
```

Dans `splitSlotClass(...)` : aucune ref à isBlocked → rien à faire.

Dans `onMounted` : supprimer l'appel `loadBlockedDates()`.

**Dans le `<template>`** :

Pour la cellule weekday (split midi/soir), simplifier les bindings : retirer toutes les conditions `day.isBlocked`. Concrètement remplacer :

```vue
<button
  v-else-if="!day.isWeekend"
  :disabled="day.isPast || day.availableCount === 0 || day.isBlocked"
  class="h-20 rounded-lg overflow-hidden flex flex-col transition-all duration-150 cursor-pointer"
  :class="[
    day.isBlocked ? 'opacity-50 cursor-not-allowed' : day.isPast || day.availableCount === 0 ? 'cursor-not-allowed' : 'hover:scale-110 hover:z-10',
    expandedDay === day.date && !day.isBlocked ? 'ring-2 ring-indigo-500 ring-offset-1' : '',
  ]"
  @click="!day.isPast && day.availableCount > 0 && !day.isBlocked && toggleDay(day.date)"
>
  <!-- Numéro du jour (bandeau) -->
  <div class="w-full px-1.5 pt-1 pb-0.5 flex items-center justify-between" :class="day.isBlocked ? 'bg-red-600/80' : 'bg-indigo-800/80'">
    <span
      class="text-[10px] font-mono font-bold leading-none text-white"
      :class="day.isToday ? 'text-red-300' : ''"
    >
      {{ day.dayNumber }}
    </span>
    <span v-if="day.isBlocked" class="text-[7px] font-mono font-bold text-white/90">INDISPO</span>
  </div>
```

par :

```vue
<button
  v-else-if="!day.isWeekend"
  :disabled="day.isPast || day.availableCount === 0"
  class="h-20 rounded-lg overflow-hidden flex flex-col transition-all duration-150 cursor-pointer"
  :class="[
    day.isPast || day.availableCount === 0 ? 'cursor-not-allowed' : 'hover:scale-110 hover:z-10',
    expandedDay === day.date ? 'ring-2 ring-indigo-500 ring-offset-1' : '',
  ]"
  @click="!day.isPast && day.availableCount > 0 && toggleDay(day.date)"
>
  <!-- Numéro du jour (bandeau) -->
  <div class="w-full px-1.5 pt-1 pb-0.5 flex items-center justify-between bg-indigo-800/80">
    <span
      class="text-[10px] font-mono font-bold leading-none text-white"
      :class="day.isToday ? 'text-red-300' : ''"
    >
      {{ day.dayNumber }}
    </span>
  </div>
```

Pour la cellule weekend, remplacer :

```vue
<button
  v-else
  :disabled="day.isPast || day.availableCount === 0 || day.isBlocked"
  class="h-20 rounded-lg transition-all duration-150 relative flex flex-col items-start justify-start p-1.5 overflow-hidden"
  :class="[dayCellClass(day), expandedDay === day.date && !day.isBlocked ? 'ring-2 ring-indigo-500 ring-offset-1' : day.isBlocked ? 'ring-1 ring-red-300' : '']"
  @click="!day.isPast && day.availableCount > 0 && !day.isBlocked && toggleDay(day.date)"
>
  <span
    class="text-[11px] font-mono font-bold leading-none"
    :class="day.isToday ? 'text-red-300' : ''"
  >
    {{ day.dayNumber }}
  </span>
  <div class="absolute bottom-1 left-1 right-1 flex items-center justify-center">
    <span
      v-if="day.isBlocked"
      class="text-[9px] font-mono font-bold text-red-600"
    >
      Indispo
    </span>
    <span
      v-else-if="day.availableCount > 0"
      class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white/20"
    >
      {{ day.availableCount }}/{{ day.slots.length }}
    </span>
    <span
      v-else
      class="text-[9px] font-mono text-zinc-400"
    >
      Complet
    </span>
  </div>
</button>
```

par :

```vue
<button
  v-else
  :disabled="day.isPast || day.availableCount === 0"
  class="h-20 rounded-lg transition-all duration-150 relative flex flex-col items-start justify-start p-1.5 overflow-hidden"
  :class="[dayCellClass(day), expandedDay === day.date ? 'ring-2 ring-indigo-500 ring-offset-1' : '']"
  @click="!day.isPast && day.availableCount > 0 && toggleDay(day.date)"
>
  <span
    class="text-[11px] font-mono font-bold leading-none"
    :class="day.isToday ? 'text-red-300' : ''"
  >
    {{ day.dayNumber }}
  </span>
  <div class="absolute bottom-1 left-1 right-1 flex items-center justify-center">
    <span
      v-if="day.availableCount > 0"
      class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white/20"
    >
      {{ day.availableCount }}/{{ day.slots.length }}
    </span>
    <span
      v-else
      class="text-[9px] font-mono text-zinc-400"
    >
      Complet
    </span>
  </div>
</button>
```

**Légende** : retirer l'item "Indisponible" (le span avec `bg-red-100 border border-red-300`) :

```vue
<span class="flex items-center gap-2 text-sm text-zinc-600">
  <span class="w-4 h-4 rounded bg-red-100 border border-red-300 inline-block" />
  Indisponible
</span>
```

→ supprimer ce bloc entier.

- [ ] **Step 10.2 : Smoke test public**

Dans le navigateur :

1. Aller sur la page admin et bloquer un jour (ex: 2026-12-15)
2. Aller sur `http://localhost:3000` (page publique de réservation)
3. Naviguer jusqu'à décembre 2026 — le 15 doit apparaître :
   - **Si jour de semaine** : cellule indigo foncée avec midi+soir tous les deux affichés "Pris"
   - **Si week-end** : cellule grise "Complet"
4. Cliquer dessus : la cellule reste désactivée (slots tous available:false → bouton disabled). Si on a forcé l'expansion, le panneau s'ouvre mais tous les boutons de slots sont disabled "Réservé".
5. Aller sur la page admin et débloquer le jour
6. Recharger la page publique : le jour redevient cliquable et réservable

- [ ] **Step 10.3 : Commit**

```bash
git add apps/frontend/components/BookingCalendar.vue
git commit -m "refactor(booking): drop localStorage blocked-dates logic — backend now marks slots"
```

---

## Task 11: QA finale + merge

**Files:** —

- [ ] **Step 11.1 : QA scénarios spec**

Dérouler les 5 scénarios listés dans le spec (`docs/superpowers/specs/2026-04-26-indispo-design.md` § "Tests / QA manuelle") :

1. **Cross-device** : bloquer un jour depuis Chrome, vérifier que Firefox (ou navigation privée) le voit aussi (admin et calendrier client).
2. **Cascade single** : créer un RDV, le bloquer via l'UI admin, confirmer la cascade → RDV en CANCELLED, mail envoyé (vérifier les logs backend ou Resend dashboard).
3. **Cascade range** : créer 2 RDV sur des dates dans une plage de 7 jours, bloquer la plage → modal liste les 2 RDV, confirmer → tout passe.
4. **Réservation refusée** : un jour étant bloqué, tenter de réserver depuis l'UI client → bouton désactivé. Tenter via curl → 409.
5. **Déblocage** : débloquer un jour → ce jour redevient réservable (vérifier UI client + curl).

- [ ] **Step 11.2 : Vérifier que rien n'est cassé sur les flows existants**

- Réserver un RDV normal sur un jour libre → succès, mails envoyés
- Confirmer/annuler un RDV depuis `/admin` → succès
- Statut public via magic token → fonctionne

- [ ] **Step 11.3 : Merge sur main**

```bash
git checkout main
git merge --ff-only feat/unavailability-module
git push origin main
```

Si pas de fast-forward possible (main a avancé entre-temps) :

```bash
git rebase main feat/unavailability-module
git checkout main
git merge --ff-only feat/unavailability-module
git push origin main
```

- [ ] **Step 11.4 : Vérifier le redeploy prod**

- Railway : tab "Deployments" → la nouvelle build doit passer. Le release command `npx prisma migrate deploy` applique la migration `add_unavailability` sur Neon.
- Vercel : la nouvelle build du frontend doit passer.
- Smoke test prod : aller sur l'admin de prod, bloquer une date test, vérifier sur le calendrier client (autre device), débloquer.

- [ ] **Step 11.5 : Cleanup branche locale**

```bash
git branch -d feat/unavailability-module
git push origin --delete feat/unavailability-module 2>/dev/null || true
```

---

## Self-Review (faite après écriture)

**Spec coverage :**
- ✅ Modèle Unavailability (sans reason) → Task 1
- ✅ GET public + POST/DELETE admin → Task 4
- ✅ Cascade-cancel single → Task 5
- ✅ Range endpoint → Task 6
- ✅ Intégration `getAvailability` (slots `available:false` sans `bookedBy`) + `create` (rejet) → Task 7
- ✅ Composable frontend → Task 8
- ✅ Page admin (toggle jour, modal cascade, modal range, débloquer tout, liste) → Task 9
- ✅ Cleanup `BookingCalendar.vue` → Task 10
- ✅ Toast Nuxt UI succès/échec → Task 9
- ✅ Pas de `forwardRef` (dépendance unidirectionnelle) → confirmé en Task 7 (`AppointmentsModule` importe `UnavailabilitiesModule`, jamais l'inverse)
- ✅ Mails post-commit → Task 5/6 (boucle après `$transaction`)
- ✅ QA prod + smoke test → Task 11

**Cohérence types/signatures :**
- `UnavailabilitiesService.create(dto)` retourne `Unavailability` — Task 3 le déclare via `findUnique`, cohérent avec usage frontend (`Unavailability` interface dans Task 8)
- `findInRange(from, to)` utilisée par `AppointmentsService.getAvailability` (Task 7) → ✅ déclarée Task 3
- DTO `CreateRangeDto` importé Task 4, méthode `createRange` ajoutée Task 6 → ✅
- `useUnavailabilities` exporte `getAll`, `create`, `createRange`, `removeByDate` → consommés en Task 9 → ✅

**Placeholders / TODO :** aucun trouvé.

**Hors-scope respecté :** pas de récurrence, pas de granularité créneau, pas de `reason`, pas de soft-delete.
