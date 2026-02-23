import { IsString, IsEmail, IsDateString, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsDateString()
  date: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  email: string;
}
