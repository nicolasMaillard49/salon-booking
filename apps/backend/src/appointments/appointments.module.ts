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
