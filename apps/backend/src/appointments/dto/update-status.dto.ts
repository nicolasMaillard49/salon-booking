import { IsEnum } from 'class-validator';

export enum StatusUpdate {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export class UpdateStatusDto {
  @IsEnum(StatusUpdate)
  status: StatusUpdate;
}
