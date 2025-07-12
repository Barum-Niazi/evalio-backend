import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsInt,
  IsNumber,
  IsBoolean,
  ValidateNested,
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
  @IsInt()
  duration_minutes?: number;

  @IsInt()
  attendee_id: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  agenda_items?: string[];

  @IsOptional()
  initial_note?: {
    content: string;
    visible_to_other?: boolean;
  };
}
export class AddNoteDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  visible_to_other?: boolean;

  @IsOptional()
  @IsInt()
  rating?: number;
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
  @IsInt()
  attendee_id?: number;
}

export class addAgendaDto {
  @IsString()
  agenda: string;
}

export class deleteAgendaDto {
  @IsString()
  content: string;
}

export class DeleteNoteDto {
  @IsString()
  content: string;
}
