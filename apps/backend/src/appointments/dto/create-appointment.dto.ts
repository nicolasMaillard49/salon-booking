import { IsString, IsEmail, IsDateString, MinLength, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsDateString()
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'timeSlot must be HH:mm format' })
  timeSlot: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  email: string;
}
