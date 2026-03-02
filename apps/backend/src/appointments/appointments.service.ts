import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { getSlotsForDay, isWeekendDay } from './slots.config';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

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
      select: { date: true, timeSlot: true, firstName: true, lastName: true, status: true },
    });

    const allDays = eachDayOfInterval({ start: from, end: to });
    return allDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = day.getDay();
      const isWeekend = isWeekendDay(dayOfWeek);
      const isThursday = dayOfWeek === 4;
      const daySlots = getSlotsForDay(dayOfWeek);

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

  async create(dto: CreateAppointmentDto) {
    const date = new Date(dto.date);
    const dayOfWeek = date.getDay();
    const allowedSlots = getSlotsForDay(dayOfWeek);

    // Validate slot is allowed for this day
    if (!allowedSlots.includes(dto.timeSlot)) {
      throw new BadRequestException(`Le créneau ${dto.timeSlot} n'est pas disponible ce jour.`);
    }

    // Thursday noon = Benj
    if (dayOfWeek === 4 && dto.timeSlot === '12:00') {
      throw new ConflictException('Le jeudi midi est réservé pour Benj Brichet.');
    }

    const existing = await this.prisma.appointment.findFirst({
      where: {
        date,
        timeSlot: dto.timeSlot,
        status: { not: 'CANCELLED' },
      },
    });

    if (existing) {
      throw new ConflictException('Ce créneau est déjà réservé.');
    }

    // Clean up cancelled appointments on same slot
    await this.prisma.appointment.deleteMany({
      where: { date, timeSlot: dto.timeSlot, status: 'CANCELLED' },
    });

    const appointment = await this.prisma.appointment.create({
      data: {
        date,
        timeSlot: dto.timeSlot,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
      },
    });

    await this.mail.sendCreatedToClient(appointment);
    await this.mail.sendCreatedToAdmin(appointment);

    return appointment;
  }

  async findByEmail(email: string) {
    if (!email) throw new BadRequestException('Email requis.');
    return this.prisma.appointment.findMany({
      where: { email },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        timeSlot: true,
        firstName: true,
        lastName: true,
        status: true,
        magicToken: true,
        createdAt: true,
      },
    });
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

  async findByWeek(week?: string) {
    const ref = week ? new Date(week) : new Date();
    const from = startOfWeek(ref, { weekStartsOn: 1 });
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

    await this.mail.sendStatusUpdate(updated);

    return updated;
  }

  async delete(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });

    if (!appointment) {
      throw new NotFoundException('Réservation introuvable.');
    }

    await this.prisma.appointment.delete({ where: { id } });
  }
}
