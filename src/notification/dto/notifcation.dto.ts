import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsInt()
  userId: number;

  @IsInt()
  typeId: number; // Lookup table for notification type

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  link?: string;
}

export class MarkAsReadDto {
  @IsInt()
  notificationId: number;
}

export class NotificationResponseDto {
  id: number;
  userId: number;
  typeId: number;
  statusId: number;
  message: string;
  link?: string;
  audit: object; // Metadata
}
