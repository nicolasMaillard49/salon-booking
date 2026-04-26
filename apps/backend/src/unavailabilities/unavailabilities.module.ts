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
