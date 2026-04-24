import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnavailabilityDto } from './dto/create-unavailability.dto';
import { startOfMonth, endOfMonth } from 'date-fns';

@Injectable()
export class UnavailabilitiesService {
  constructor(private prisma: PrismaService) {}

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

  async create(dto: CreateUnavailabilityDto) {
    const date = new Date(dto.date);
    try {
      return await this.prisma.unavailability.create({
        data: { date, reason: dto.reason },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Cette date est déjà bloquée.');
      }
      throw error;
    }
  }

  async deleteById(id: string) {
    const existing = await this.prisma.unavailability.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Indisponibilité introuvable.');
    }
    await this.prisma.unavailability.delete({ where: { id } });
  }

  async deleteByDate(dateStr: string) {
    const date = new Date(dateStr);
    const existing = await this.prisma.unavailability.findUnique({ where: { date } });
    if (!existing) {
      throw new NotFoundException('Aucune indisponibilité à cette date.');
    }
    await this.prisma.unavailability.delete({ where: { date } });
  }
}
