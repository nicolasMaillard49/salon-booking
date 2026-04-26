import { IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateUnavailabilityDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsBoolean()
  cascade?: boolean;
}
