# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a full specification (`salon-booking-claude-code.md`) for a hair salon online booking app to be code-generated. **The actual project code does not exist yet** — the spec file contains all file contents to scaffold.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Nuxt 3 + Vue 3 + Nuxt UI (`@nuxt/ui`) |
| Backend | NestJS (port 3001) |
| Database | PostgreSQL (via Docker) + Prisma ORM |
| Email | Resend SDK |
| Monorepo | pnpm workspaces |

## Target Structure After Generation

```
salon-booking/
├── apps/frontend/     ← Nuxt 3 app (port 3000)
├── apps/backend/      ← NestJS app (port 3001)
├── packages/prisma/   ← Shared Prisma schema + migrations
├── docker-compose.yml
└── package.json       ← pnpm workspace root
```

## Commands (after generation)

```bash
# Start PostgreSQL
pnpm db:up

# Run database migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Open Prisma Studio
pnpm db:studio

# Start backend (watch mode)
pnpm dev:backend

# Start frontend
pnpm dev:frontend
```

## Architecture

**Data model:** Single `Appointment` entity with fields: `id`, `date` (`@db.Date`), `firstName`, `lastName`, `email`, `magicToken` (unique CUID for public status URLs), `status` (PENDING/CONFIRMED/CANCELLED). One appointment per day enforced by `@@unique([date])`.

**Auth:** Admin routes protected by `x-admin-password` request header checked against `ADMIN_PASSWORD` env var via `AdminGuard`. Admin password stored client-side in an 8h cookie.

**Email flow:** Resend sends emails on two events — appointment creation (to client + admin) and status change (to client). All email logic lives in `MailService`.

**API routes:**
- `GET /appointments/availability?month=YYYY-MM` — public, returns day availability array
- `POST /appointments` — public, creates appointment, triggers emails
- `GET /appointments/status/:token` — public, lookup by magic token
- `GET /appointments/admin?week=YYYY-MM-DD` — admin-only, weekly view with stats
- `PATCH /appointments/admin/:id/status` — admin-only, confirm or cancel

**Frontend composable:** All API calls go through `useAppointments()` in `composables/useAppointments.ts`. The API base URL comes from `NUXT_PUBLIC_API_URL` runtime config.

## Key Implementation Notes

- `date-fns` must be installed in **both** `apps/frontend` and `apps/backend`
- Import French locale explicitly: `import { fr } from 'date-fns/locale'`
- The Prisma `date` field is `@db.Date` (no time) — always normalize with `new Date(dateString)` before DB comparisons
- Backend must run `prisma generate` before building — add to `postinstall` script
- CORS is configured to allow only `FRONTEND_URL`; set this env var correctly
- Admin middleware (`middleware/auth-admin.ts`) guards `/admin` route by checking `admin_password` cookie

## Environment Variables

Copy `.env.example` to `.env` in the project root:

```
DATABASE_URL=postgresql://salon:salon_secret@localhost:5432/salon_booking
ADMIN_PASSWORD=changeme_admin_password
RESEND_API_KEY=re_xxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=proprietaire@monsalon.fr
NUXT_PUBLIC_API_URL=http://localhost:3001
```

## Deployment

- **Database:** Neon (managed PostgreSQL) — run `pnpm db:migrate:deploy` after setting prod `DATABASE_URL`
- **Backend:** Railway — root directory `apps/backend`, release command `npx prisma migrate deploy`
- **Frontend:** Vercel — root directory `apps/frontend`, set `NUXT_PUBLIC_API_URL` to the Railway backend URL
- **Email:** Resend — verify domain before production use