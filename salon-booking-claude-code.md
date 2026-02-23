# 🏗️ Génération complète du projet : Salon Booking

Tu vas générer un projet complet de réservation en ligne pour un salon de coiffure.
Suis **scrupuleusement** ce document dans l'ordre indiqué. Ne saute aucune étape.

---

## 📦 Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Nuxt 3 + Vue 3 + Nuxt UI |
| Backend | NestJS |
| Base de données | PostgreSQL + Prisma |
| Email | Resend (SDK officiel) |
| Monorepo | pnpm workspaces |
| Dev local DB | Docker Compose |

---

## 🗂️ Structure exacte du monorepo à générer

```
salon-booking/
├── apps/
│   ├── frontend/
│   │   ├── pages/
│   │   │   ├── index.vue
│   │   │   ├── booking/
│   │   │   │   └── [token].vue
│   │   │   └── admin/
│   │   │       ├── login.vue
│   │   │       └── index.vue
│   │   ├── components/
│   │   │   ├── BookingCalendar.vue
│   │   │   ├── BookingForm.vue
│   │   │   └── admin/
│   │   │       ├── WeekView.vue
│   │   │       └── AppointmentCard.vue
│   │   ├── composables/
│   │   │   └── useAppointments.ts
│   │   ├── app.vue
│   │   ├── nuxt.config.ts
│   │   └── package.json
│   │
│   └── backend/
│       ├── src/
│       │   ├── appointments/
│       │   │   ├── appointments.module.ts
│       │   │   ├── appointments.controller.ts
│       │   │   ├── appointments.service.ts
│       │   │   └── dto/
│       │   │       ├── create-appointment.dto.ts
│       │   │       └── update-status.dto.ts
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   └── admin.guard.ts
│       │   ├── mail/
│       │   │   ├── mail.module.ts
│       │   │   └── mail.service.ts
│       │   ├── prisma/
│       │   │   ├── prisma.module.ts
│       │   │   └── prisma.service.ts
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── .env.example
│       └── package.json
│
├── packages/
│   └── prisma/
│       ├── schema.prisma
│       └── (migrations seront générées par Prisma)
│
├── docker-compose.yml
├── package.json         ← racine pnpm workspaces
├── pnpm-workspace.yaml
├── .env.example
└── .gitignore
```

---

## ⚙️ Fichiers de configuration racine

### `package.json` (racine)
```json
{
  "name": "salon-booking",
  "private": true,
  "scripts": {
    "dev:frontend": "pnpm --filter frontend dev",
    "dev:backend": "pnpm --filter backend start:dev",
    "db:up": "docker compose up -d",
    "db:migrate": "pnpm --filter prisma-db migrate dev",
    "db:generate": "pnpm --filter prisma-db generate",
    "db:studio": "pnpm --filter prisma-db studio"
  }
}
```

### `pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `docker-compose.yml`
```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    container_name: salon_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: salon_booking
      POSTGRES_USER: salon
      POSTGRES_PASSWORD: salon_secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### `.env.example` (racine)
```env
# Backend
DATABASE_URL=postgresql://salon:salon_secret@localhost:5432/salon_booking
ADMIN_PASSWORD=changeme_admin_password
RESEND_API_KEY=re_xxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=proprietaire@monsalon.fr

# Frontend
NUXT_PUBLIC_API_URL=http://localhost:3001
```

### `.gitignore`
```
node_modules/
.env
dist/
.nuxt/
.output/
```

---

## 🗃️ Schéma Prisma

### `packages/prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Appointment {
  id         String   @id @default(cuid())
  date       DateTime @db.Date
  firstName  String
  lastName   String
  email      String
  magicToken String   @unique @default(cuid())
  status     Status   @default(PENDING)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([date])
}

enum Status {
  PENDING
  CONFIRMED
  CANCELLED
}
```

### `packages/prisma/package.json`
```json
{
  "name": "prisma-db",
  "version": "1.0.0",
  "scripts": {
    "migrate": "prisma migrate dev --schema=schema.prisma",
    "generate": "prisma generate --schema=schema.prisma",
    "studio": "prisma studio --schema=schema.prisma",
    "migrate:deploy": "prisma migrate deploy --schema=schema.prisma"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0"
  }
}
```

---

## 🔧 Backend NestJS

### `apps/backend/package.json`
```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "build": "nest build"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@prisma/client": "^5.0.0",
    "resend": "^3.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "prisma": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

### `apps/backend/src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}
bootstrap();
```

### `apps/backend/src/app.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    AuthModule,
    AppointmentsModule,
  ],
})
export class AppModule {}
```

### `apps/backend/src/prisma/prisma.service.ts`
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### `apps/backend/src/prisma/prisma.module.ts`
```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### `apps/backend/src/auth/admin.guard.ts`
```typescript
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const password = request.headers['x-admin-password'];

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      throw new UnauthorizedException('Mot de passe admin invalide');
    }
    return true;
  }
}
```

### `apps/backend/src/auth/auth.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

@Module({
  providers: [AdminGuard],
  exports: [AdminGuard],
})
export class AuthModule {}
```

### `apps/backend/src/appointments/dto/create-appointment.dto.ts`
```typescript
import { IsString, IsEmail, IsDateString, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsDateString()
  date: string; // format ISO: "2025-03-18"

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  email: string;
}
```

### `apps/backend/src/appointments/dto/update-status.dto.ts`
```typescript
import { IsEnum } from 'class-validator';

export enum Status {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export class UpdateStatusDto {
  @IsEnum(Status)
  status: Status;
}
```

### `apps/backend/src/appointments/appointments.service.ts`
```typescript
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  // Retourne les jours déjà réservés pour un mois donné (format "YYYY-MM")
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

    const booked = await this.prisma.appointment.findMany({
      where: {
        date: { gte: from, lte: to },
        status: { not: 'CANCELLED' },
      },
      select: { date: true },
    });

    const bookedDates = booked.map(a => format(a.date, 'yyyy-MM-dd'));

    // Générer tous les jours de la période et marquer disponibilité
    const allDays = eachDayOfInterval({ start: from, end: to });
    return allDays.map(day => ({
      date: format(day, 'yyyy-MM-dd'),
      available: !bookedDates.includes(format(day, 'yyyy-MM-dd')),
    }));
  }

  async create(dto: CreateAppointmentDto) {
    const date = new Date(dto.date);

    // Vérifier si le créneau est déjà pris
    const existing = await this.prisma.appointment.findFirst({
      where: {
        date,
        status: { not: 'CANCELLED' },
      },
    });

    if (existing) {
      throw new ConflictException('Ce créneau est déjà réservé.');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        date,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
      },
    });

    // Envoyer les emails de confirmation
    await this.mail.sendCreatedToClient(appointment);
    await this.mail.sendCreatedToAdmin(appointment);

    return appointment;
  }

  async findByToken(magicToken: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { magicToken },
    });

    if (!appointment) {
      throw new NotFoundException('Réservation introuvable.');
    }

    return appointment;
  }

  // Admin : récupérer les RDV d'une semaine
  async findByWeek(week?: string) {
    const ref = week ? new Date(week) : new Date();
    const from = startOfWeek(ref, { weekStartsOn: 1 }); // Lundi
    const to = endOfWeek(ref, { weekStartsOn: 1 });

    const appointments = await this.prisma.appointment.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });

    return {
      week: format(from, 'yyyy-MM-dd'),
      total: appointments.length,
      pending: appointments.filter(a => a.status === 'PENDING').length,
      confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
      appointments,
    };
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Réservation introuvable.');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
    });

    // Envoyer un email au client pour l'informer du changement
    await this.mail.sendStatusUpdate(updated);

    return updated;
  }
}
```

### `apps/backend/src/appointments/appointments.controller.ts`
```typescript
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  // --- Routes publiques ---

  @Get('availability')
  getAvailability(
    @Query('month') month?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.service.getAvailability(month, start, end);
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.service.create(dto);
  }

  @Get('status/:token')
  findByToken(@Param('token') token: string) {
    return this.service.findByToken(token);
  }

  // --- Routes admin (protégées) ---

  @UseGuards(AdminGuard)
  @Get('admin')
  findByWeek(@Query('week') week?: string) {
    return this.service.findByWeek(week);
  }

  @UseGuards(AdminGuard)
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}
```

### `apps/backend/src/appointments/appointments.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
```

### `apps/backend/src/mail/mail.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);
  private adminEmail = process.env.ADMIN_EMAIL!;
  private frontendUrl = process.env.FRONTEND_URL!;

  private formatDate(date: Date): string {
    return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr });
  }

  async sendCreatedToClient(appointment: any) {
    const statusUrl = `${this.frontendUrl}/booking/${appointment.magicToken}`;
    await this.resend.emails.send({
      from: 'Mon Salon <noreply@monsalon.fr>',
      to: appointment.email,
      subject: '✂️ Votre demande de RDV est enregistrée',
      html: `
        <h2>Bonjour ${appointment.firstName} !</h2>
        <p>Votre demande de rendez-vous pour le <strong>${this.formatDate(appointment.date)}</strong> a bien été reçue.</p>
        <p>Elle est actuellement <strong>en attente de confirmation</strong>.</p>
        <p>Vous recevrez un email dès que votre rendez-vous sera confirmé ou annulé.</p>
        <p><a href="${statusUrl}">👉 Suivre mon rendez-vous</a></p>
        <hr/>
        <small>Mon Salon de Coiffure</small>
      `,
    });
  }

  async sendCreatedToAdmin(appointment: any) {
    const adminUrl = `${this.frontendUrl}/admin`;
    await this.resend.emails.send({
      from: 'Mon Salon <noreply@monsalon.fr>',
      to: this.adminEmail,
      subject: `📅 Nouvelle demande : ${appointment.firstName} ${appointment.lastName}`,
      html: `
        <h2>Nouvelle demande de RDV</h2>
        <p><strong>Client :</strong> ${appointment.firstName} ${appointment.lastName}</p>
        <p><strong>Email :</strong> ${appointment.email}</p>
        <p><strong>Date souhaitée :</strong> ${this.formatDate(appointment.date)}</p>
        <p><a href="${adminUrl}">👉 Gérer depuis le panneau admin</a></p>
      `,
    });
  }

  async sendStatusUpdate(appointment: any) {
    const isConfirmed = appointment.status === 'CONFIRMED';
    const statusUrl = `${this.frontendUrl}/booking/${appointment.magicToken}`;

    await this.resend.emails.send({
      from: 'Mon Salon <noreply@monsalon.fr>',
      to: appointment.email,
      subject: isConfirmed
        ? `✅ Votre RDV du ${this.formatDate(appointment.date)} est confirmé !`
        : `❌ Votre RDV du ${this.formatDate(appointment.date)} a été annulé`,
      html: `
        <h2>Bonjour ${appointment.firstName} !</h2>
        ${isConfirmed
          ? `<p>Votre rendez-vous du <strong>${this.formatDate(appointment.date)}</strong> est <strong>confirmé</strong>. À bientôt ! ✂️</p>`
          : `<p>Votre rendez-vous du <strong>${this.formatDate(appointment.date)}</strong> a malheureusement été <strong>annulé</strong>.</p><p>N'hésitez pas à réserver une autre date.</p>`
        }
        <p><a href="${statusUrl}">👉 Voir mon rendez-vous</a></p>
        <hr/>
        <small>Mon Salon de Coiffure</small>
      `,
    });
  }
}
```

### `apps/backend/src/mail/mail.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

---

## 🎨 Frontend Nuxt 3

### `apps/frontend/package.json`
```json
{
  "name": "frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nuxt dev --port 3000",
    "build": "nuxt build",
    "preview": "nuxt preview"
  },
  "dependencies": {
    "nuxt": "^3.11.0",
    "@nuxt/ui": "^2.15.0",
    "date-fns": "^3.6.0"
  }
}
```

### `apps/frontend/nuxt.config.ts`
```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001',
    },
  },
  colorMode: {
    preference: 'light',
  },
})
```

### `apps/frontend/app.vue`
```vue
<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
```

### `apps/frontend/composables/useAppointments.ts`
```typescript
export const useAppointments = () => {
  const config = useRuntimeConfig();
  const API = config.public.apiUrl;

  // Récupère les disponibilités d'un mois
  const getAvailability = async (month: string) => {
    return $fetch<{ date: string; available: boolean }[]>(
      `${API}/appointments/availability?month=${month}`
    );
  };

  // Créer un RDV
  const createAppointment = async (data: {
    date: string;
    firstName: string;
    lastName: string;
    email: string;
  }) => {
    return $fetch(`${API}/appointments`, { method: 'POST', body: data });
  };

  // Récupérer un RDV par magic token
  const getByToken = async (token: string) => {
    return $fetch(`${API}/appointments/status/${token}`);
  };

  // Admin : récupérer les RDV de la semaine
  const getWeek = async (week: string, adminPassword: string) => {
    return $fetch(`${API}/appointments/admin?week=${week}`, {
      headers: { 'x-admin-password': adminPassword },
    });
  };

  // Admin : changer le statut d'un RDV
  const updateStatus = async (id: string, status: 'CONFIRMED' | 'CANCELLED', adminPassword: string) => {
    return $fetch(`${API}/appointments/admin/${id}/status`, {
      method: 'PATCH',
      body: { status },
      headers: { 'x-admin-password': adminPassword },
    });
  };

  return { getAvailability, createAppointment, getByToken, getWeek, updateStatus };
};
```

### `apps/frontend/pages/index.vue`
```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-2xl mx-auto py-12 px-4">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-3xl font-bold text-gray-900">Mon Salon de Coiffure</h1>
        <p class="text-gray-500 mt-2">Réservez votre rendez-vous en ligne</p>
      </div>

      <!-- Étape 1 : Calendrier -->
      <UCard v-if="!selectedDate" class="mb-6">
        <template #header>
          <h2 class="text-lg font-semibold">Choisissez une date</h2>
        </template>
        <BookingCalendar @select="onDateSelected" />
      </UCard>

      <!-- Étape 2 : Formulaire -->
      <UCard v-else>
        <template #header>
          <div class="flex items-center gap-2">
            <UButton icon="i-heroicons-arrow-left" variant="ghost" size="sm" @click="selectedDate = null" />
            <h2 class="text-lg font-semibold">
              Réservation pour le {{ formatSelectedDate }}
            </h2>
          </div>
        </template>
        <BookingForm :date="selectedDate" @success="onSuccess" />
      </UCard>

      <!-- Succès -->
      <UCard v-if="success" class="mt-6 border-green-200 bg-green-50">
        <div class="text-center py-4">
          <div class="text-4xl mb-3">✅</div>
          <h3 class="text-lg font-semibold text-green-800">Demande envoyée !</h3>
          <p class="text-green-700 mt-1">
            Vous allez recevoir un email de confirmation. Votre RDV est en attente de validation.
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const selectedDate = ref<string | null>(null);
const success = ref(false);

const formatSelectedDate = computed(() =>
  selectedDate.value
    ? format(new Date(selectedDate.value), 'EEEE d MMMM yyyy', { locale: fr })
    : ''
);

function onDateSelected(date: string) {
  selectedDate.value = date;
  success.value = false;
}

function onSuccess() {
  selectedDate.value = null;
  success.value = true;
}
</script>
```

### `apps/frontend/components/BookingCalendar.vue`
```vue
<template>
  <div>
    <!-- Navigation mois -->
    <div class="flex items-center justify-between mb-4">
      <UButton icon="i-heroicons-chevron-left" variant="ghost" @click="prevMonth" />
      <span class="font-semibold capitalize">{{ currentMonthLabel }}</span>
      <UButton icon="i-heroicons-chevron-right" variant="ghost" @click="nextMonth" />
    </div>

    <!-- Jours de la semaine -->
    <div class="grid grid-cols-7 gap-1 mb-2">
      <div v-for="d in weekDays" :key="d" class="text-center text-xs text-gray-400 font-medium py-1">
        {{ d }}
      </div>
    </div>

    <!-- Grille du mois -->
    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 text-2xl" />
    </div>

    <div v-else class="grid grid-cols-7 gap-1">
      <!-- Cases vides pour aligner le 1er jour -->
      <div v-for="_ in firstDayOffset" :key="`empty-${_}`" />

      <button
        v-for="day in daysInMonth"
        :key="day.date"
        :disabled="!day.available || day.isPast"
        @click="day.available && !day.isPast && emit('select', day.date)"
        class="rounded-lg py-2 text-sm font-medium transition-colors"
        :class="{
          'bg-primary-500 text-white hover:bg-primary-600 cursor-pointer': day.available && !day.isPast,
          'bg-gray-100 text-gray-400 cursor-not-allowed': !day.available || day.isPast,
          'ring-2 ring-primary-300': day.isToday,
        }"
      >
        {{ day.dayNumber }}
      </button>
    </div>

    <div class="flex gap-4 mt-4 text-xs text-gray-500">
      <span class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-primary-500 inline-block" /> Disponible
      </span>
      <span class="flex items-center gap-1">
        <span class="w-3 h-3 rounded bg-gray-200 inline-block" /> Non disponible
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, isBefore, isToday, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

const emit = defineEmits<{ select: [date: string] }>();
const { getAvailability } = useAppointments();

const today = startOfDay(new Date());
const currentDate = ref(new Date());
const availability = ref<{ date: string; available: boolean }[]>([]);
const loading = ref(false);

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const currentMonthLabel = computed(() =>
  format(currentDate.value, 'MMMM yyyy', { locale: fr })
);

const firstDayOffset = computed(() => {
  const firstDay = getDay(startOfMonth(currentDate.value));
  // Convertir dimanche(0) → 6, lundi(1) → 0, etc.
  return firstDay === 0 ? 6 : firstDay - 1;
});

const daysInMonth = computed(() => {
  const start = startOfMonth(currentDate.value);
  const end = endOfMonth(currentDate.value);
  return eachDayOfInterval({ start, end }).map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const avail = availability.value.find(a => a.date === dateStr);
    return {
      date: dateStr,
      dayNumber: day.getDate(),
      available: avail?.available ?? false,
      isPast: isBefore(day, today),
      isToday: isToday(day),
    };
  });
});

async function loadAvailability() {
  loading.value = true;
  try {
    const month = format(currentDate.value, 'yyyy-MM');
    availability.value = await getAvailability(month);
  } finally {
    loading.value = false;
  }
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
  loadAvailability();
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
  loadAvailability();
}

onMounted(loadAvailability);
</script>
```

### `apps/frontend/components/BookingForm.vue`
```vue
<template>
  <UForm :state="form" @submit="onSubmit" class="space-y-4">
    <UFormField label="Prénom" name="firstName">
      <UInput v-model="form.firstName" placeholder="Jean" required />
    </UFormField>

    <UFormField label="Nom" name="lastName">
      <UInput v-model="form.lastName" placeholder="Dupont" required />
    </UFormField>

    <UFormField label="Email" name="email">
      <UInput v-model="form.email" type="email" placeholder="jean@email.com" required />
    </UFormField>

    <UAlert
      v-if="error"
      color="red"
      variant="soft"
      :description="error"
      icon="i-heroicons-exclamation-triangle"
    />

    <UButton type="submit" :loading="loading" block color="primary">
      Confirmer ma demande de RDV
    </UButton>
  </UForm>
</template>

<script setup lang="ts">
const props = defineProps<{ date: string }>();
const emit = defineEmits<{ success: [] }>();
const { createAppointment } = useAppointments();

const loading = ref(false);
const error = ref('');
const form = reactive({ firstName: '', lastName: '', email: '' });

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    await createAppointment({ ...form, date: props.date });
    emit('success');
  } catch (e: any) {
    error.value = e?.data?.message || 'Une erreur est survenue. Veuillez réessayer.';
  } finally {
    loading.value = false;
  }
}
</script>
```

### `apps/frontend/pages/booking/[token].vue`
```vue
<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Chargement -->
      <UCard v-if="pending" class="text-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 text-3xl" />
        <p class="mt-3 text-gray-500">Chargement de votre rendez-vous...</p>
      </UCard>

      <!-- Erreur -->
      <UCard v-else-if="error" class="text-center py-8">
        <div class="text-4xl mb-3">❌</div>
        <h2 class="text-lg font-semibold text-gray-800">Rendez-vous introuvable</h2>
        <p class="text-gray-500 mt-2">Ce lien est invalide ou a expiré.</p>
        <UButton class="mt-4" to="/" variant="soft">Retour à l'accueil</UButton>
      </UCard>

      <!-- RDV trouvé -->
      <UCard v-else-if="appointment">
        <template #header>
          <div class="text-center">
            <h1 class="text-xl font-bold text-gray-900">Mon Rendez-vous</h1>
          </div>
        </template>

        <div class="space-y-4">
          <div class="text-center py-4">
            <div class="text-5xl mb-3">{{ statusEmoji }}</div>
            <UBadge :color="statusColor" size="lg" class="capitalize">
              {{ statusLabel }}
            </UBadge>
          </div>

          <div class="border-t pt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Nom</span>
              <span class="font-medium">{{ appointment.firstName }} {{ appointment.lastName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Date</span>
              <span class="font-medium capitalize">{{ formatDate(appointment.date) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Demandé le</span>
              <span class="font-medium">{{ formatDate(appointment.createdAt) }}</span>
            </div>
          </div>

          <UAlert
            v-if="appointment.status === 'PENDING'"
            color="yellow"
            variant="soft"
            description="Votre demande est en attente de confirmation. Vous recevrez un email dès validation."
            icon="i-heroicons-clock"
          />
          <UAlert
            v-else-if="appointment.status === 'CONFIRMED'"
            color="green"
            variant="soft"
            description="Votre rendez-vous est confirmé. À bientôt !"
            icon="i-heroicons-check-circle"
          />
          <UAlert
            v-else
            color="red"
            variant="soft"
            description="Ce rendez-vous a été annulé. Vous pouvez en réserver un autre."
            icon="i-heroicons-x-circle"
          />
        </div>

        <template #footer>
          <UButton to="/" variant="soft" block>Retour à l'accueil</UButton>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const route = useRoute();
const { getByToken } = useAppointments();

const { data: appointment, pending, error } = await useAsyncData(
  'appointment',
  () => getByToken(route.params.token as string)
);

const statusEmoji = computed(() => {
  if (appointment.value?.status === 'CONFIRMED') return '✅';
  if (appointment.value?.status === 'CANCELLED') return '❌';
  return '⏳';
});

const statusLabel = computed(() => {
  if (appointment.value?.status === 'CONFIRMED') return 'Confirmé';
  if (appointment.value?.status === 'CANCELLED') return 'Annulé';
  return 'En attente';
});

const statusColor = computed(() => {
  if (appointment.value?.status === 'CONFIRMED') return 'green';
  if (appointment.value?.status === 'CANCELLED') return 'red';
  return 'yellow';
});

function formatDate(date: string) {
  return format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr });
}
</script>
```

### `apps/frontend/pages/admin/login.vue`
```vue
<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-xl font-bold text-center">✂️ Espace Admin</h1>
      </template>

      <UForm :state="form" @submit="onSubmit" class="space-y-4">
        <UFormField label="Mot de passe" name="password">
          <UInput
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            required
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="red"
          variant="soft"
          description="Mot de passe incorrect."
        />

        <UButton type="submit" :loading="loading" block>
          Se connecter
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const form = reactive({ password: '' });
const loading = ref(false);
const error = ref(false);

async function onSubmit() {
  loading.value = true;
  error.value = false;
  try {
    // Tester le mot de passe en appelant une route admin
    const config = useRuntimeConfig();
    await $fetch(`${config.public.apiUrl}/appointments/admin`, {
      headers: { 'x-admin-password': form.password },
    });
    // Si succès → stocker dans cookie et rediriger
    const adminPassword = useCookie('admin_password', { maxAge: 60 * 60 * 8 }); // 8h
    adminPassword.value = form.password;
    await navigateTo('/admin');
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
}
</script>
```

### `apps/frontend/pages/admin/index.vue`
```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto py-8 px-4">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold text-gray-900">✂️ Tableau de bord</h1>
        <UButton variant="ghost" icon="i-heroicons-arrow-left-on-rectangle" @click="logout">
          Déconnexion
        </UButton>
      </div>

      <!-- Navigation semaine -->
      <UCard class="mb-6">
        <div class="flex items-center justify-between">
          <UButton icon="i-heroicons-chevron-left" variant="ghost" @click="prevWeek" />
          <span class="font-semibold">Semaine du {{ weekLabel }}</span>
          <UButton icon="i-heroicons-chevron-right" variant="ghost" @click="nextWeek" />
        </div>
      </UCard>

      <!-- Stats de la semaine -->
      <div v-if="weekData" class="grid grid-cols-3 gap-4 mb-6">
        <UCard class="text-center">
          <div class="text-3xl font-bold text-gray-900">{{ weekData.total }}</div>
          <div class="text-sm text-gray-500 mt-1">Total</div>
        </UCard>
        <UCard class="text-center">
          <div class="text-3xl font-bold text-yellow-500">{{ weekData.pending }}</div>
          <div class="text-sm text-gray-500 mt-1">En attente</div>
        </UCard>
        <UCard class="text-center">
          <div class="text-3xl font-bold text-green-500">{{ weekData.confirmed }}</div>
          <div class="text-sm text-gray-500 mt-1">Confirmés</div>
        </UCard>
      </div>

      <!-- Liste des RDV -->
      <div v-if="loading" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 text-3xl" />
      </div>

      <div v-else-if="weekData?.appointments.length === 0" class="text-center py-12 text-gray-400">
        Aucun rendez-vous cette semaine.
      </div>

      <div v-else class="space-y-3">
        <AdminAppointmentCard
          v-for="appt in weekData?.appointments"
          :key="appt.id"
          :appointment="appt"
          @confirm="confirmAppt"
          @cancel="cancelAppt"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';

definePageMeta({ middleware: 'auth-admin' });

const { getWeek, updateStatus } = useAppointments();
const adminPassword = useCookie('admin_password');

const currentWeek = ref(new Date());
const weekData = ref<any>(null);
const loading = ref(false);

const weekLabel = computed(() =>
  format(currentWeek.value, "d MMMM yyyy", { locale: fr })
);

async function loadWeek() {
  loading.value = true;
  try {
    weekData.value = await getWeek(
      format(currentWeek.value, 'yyyy-MM-dd'),
      adminPassword.value!
    );
  } finally {
    loading.value = false;
  }
}

function prevWeek() { currentWeek.value = subWeeks(currentWeek.value, 1); loadWeek(); }
function nextWeek() { currentWeek.value = addWeeks(currentWeek.value, 1); loadWeek(); }

async function confirmAppt(id: string) {
  await updateStatus(id, 'CONFIRMED', adminPassword.value!);
  await loadWeek();
}

async function cancelAppt(id: string) {
  await updateStatus(id, 'CANCELLED', adminPassword.value!);
  await loadWeek();
}

function logout() {
  adminPassword.value = null;
  navigateTo('/admin/login');
}

onMounted(loadWeek);
</script>
```

### `apps/frontend/components/admin/AppointmentCard.vue`
```vue
<template>
  <UCard>
    <div class="flex items-center justify-between">
      <div>
        <div class="font-semibold text-gray-900">
          {{ appointment.firstName }} {{ appointment.lastName }}
        </div>
        <div class="text-sm text-gray-500 capitalize">
          {{ formatDate(appointment.date) }}
        </div>
        <div class="text-sm text-gray-400">{{ appointment.email }}</div>
      </div>

      <div class="flex items-center gap-3">
        <UBadge :color="statusColor" variant="soft">{{ statusLabel }}</UBadge>

        <template v-if="appointment.status === 'PENDING'">
          <UButton
            color="green"
            variant="soft"
            size="sm"
            icon="i-heroicons-check"
            @click="emit('confirm', appointment.id)"
          >
            Valider
          </UButton>
          <UButton
            color="red"
            variant="soft"
            size="sm"
            icon="i-heroicons-x-mark"
            @click="emit('cancel', appointment.id)"
          >
            Annuler
          </UButton>
        </template>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const props = defineProps<{
  appointment: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    date: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  };
}>();

const emit = defineEmits<{
  confirm: [id: string];
  cancel: [id: string];
}>();

const statusLabel = computed(() => ({
  PENDING: 'En attente',
  CONFIRMED: 'Confirmé',
  CANCELLED: 'Annulé',
}[props.appointment.status]));

const statusColor = computed(() => ({
  PENDING: 'yellow',
  CONFIRMED: 'green',
  CANCELLED: 'red',
}[props.appointment.status]));

function formatDate(date: string) {
  return format(new Date(date), 'EEEE d MMMM', { locale: fr });
}
</script>
```

### `apps/frontend/middleware/auth-admin.ts`
```typescript
export default defineNuxtRouteMiddleware(() => {
  const adminPassword = useCookie('admin_password');
  if (!adminPassword.value) {
    return navigateTo('/admin/login');
  }
});
```

---

## 🚀 Instructions de déploiement

### Base de données — Neon (PostgreSQL gratuit)
1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un projet → copier la `DATABASE_URL`
3. Lancer les migrations : `pnpm db:migrate:deploy`

### Backend — Railway
1. Créer un compte sur [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo" → sélectionner le repo
3. Configurer le root directory sur `apps/backend`
4. Ajouter les variables d'environnement :
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
   - `RESEND_API_KEY`
   - `FRONTEND_URL`
   - `ADMIN_EMAIL`
5. Ajouter la commande de release : `npx prisma migrate deploy`

### Frontend — Vercel
1. Importer le repo sur [vercel.com](https://vercel.com)
2. Root directory : `apps/frontend`
3. Ajouter la variable : `NUXT_PUBLIC_API_URL` = URL Railway du backend

### Email — Resend
1. Créer un compte sur [resend.com](https://resend.com)
2. Ajouter et vérifier ton domaine (ou utiliser le domaine de test pour commencer)
3. Générer une API key → ajouter dans les variables d'env

---

## 📋 Checklist de génération

Claude Code doit vérifier après génération :

- [ ] `pnpm install` à la racine fonctionne sans erreur
- [ ] `docker compose up -d` démarre PostgreSQL correctement
- [ ] `pnpm db:migrate` crée les tables sans erreur
- [ ] `pnpm dev:backend` démarre sur le port 3001
- [ ] `pnpm dev:frontend` démarre sur le port 3000
- [ ] `GET /appointments/availability?month=2025-03` retourne un tableau de dates
- [ ] `POST /appointments` crée un RDV et l'unicité par jour est respectée
- [ ] `GET /appointments/status/:token` retourne le bon RDV
- [ ] `GET /appointments/admin` avec header `x-admin-password` retourne les données de la semaine
- [ ] `PATCH /appointments/admin/:id/status` change le statut correctement
- [ ] Le calendrier frontend affiche les jours disponibles / non disponibles
- [ ] Le formulaire de réservation soumet et affiche le message de succès
- [ ] La page `/booking/[token]` affiche le bon statut
- [ ] La page `/admin/login` redirige vers `/admin` après succès
- [ ] Le dashboard admin affiche les stats et les boutons valider/annuler
- [ ] Les emails sont envoyés via Resend (tester avec un vrai compte Resend)

---

## ⚠️ Points d'attention

- Le package `date-fns` doit être installé dans **les deux** apps (`frontend` et `backend`)
- La locale `fr` de `date-fns` doit être importée explicitement : `import { fr } from 'date-fns/locale'`
- Le Prisma Client doit être généré avant le build NestJS : ajouter `prisma generate` dans le script `postinstall` du backend
- Le champ `date` en BDD est de type `@db.Date` (date sans heure) — toujours normaliser en `new Date(dateString)` côté backend avant de comparer
- Le cookie `admin_password` est stocké côté client, ce qui est suffisant pour un usage interne — ne jamais exposer ce site publiquement sans HTTPS
- Configurer HTTPS sur Railway et Vercel (automatique sur les deux plateformes en production)
