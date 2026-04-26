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
