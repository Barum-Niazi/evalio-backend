import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsInt,
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
