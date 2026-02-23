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

  @Get('my')
  findByEmail(@Query('email') email: string) {
    return this.service.findByEmail(email);
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
