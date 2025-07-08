import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsInt,
  IsNumber,
} from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  scheduled_at: string;

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsInt()
  duration_minutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  note_to_self?: string;

  @IsArray()
  @IsInt({ each: true })
  attendee_ids: number[];
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @IsOptional()
  @IsNumber()
  duration_minutes?: number;

  @IsOptional()
  @IsString()
  agenda?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  note_to_self?: string;

  @IsOptional()
  @IsArray()
  attendee_ids?: number[];
}
