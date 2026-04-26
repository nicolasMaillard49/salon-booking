import { IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateRangeDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsOptional()
  @IsBoolean()
  cascade?: boolean;
}
