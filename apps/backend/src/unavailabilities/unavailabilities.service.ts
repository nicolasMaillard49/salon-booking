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
}
