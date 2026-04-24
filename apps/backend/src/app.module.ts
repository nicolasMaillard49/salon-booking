import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PhotosModule } from './photos/photos.module';
import { UnavailabilitiesModule } from './unavailabilities/unavailabilities.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MailModule,
    AuthModule,
    AppointmentsModule,
    PhotosModule,
    UnavailabilitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
