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
}
