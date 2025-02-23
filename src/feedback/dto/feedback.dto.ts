import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeedbackDto {
  @IsString()
  @MinLength(5, { message: 'Feedback text must be at least 5 characters long' })
  feedback_text: string;

  @IsBoolean()
  @IsOptional()
  is_anonymous?: boolean;

  @IsInt()
  visibility_id: number; // Refers to visibility settings in `lookup`

  @IsInt()
  sender_id: number;

  @IsInt()
  receiver_id: number;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  tag_ids?: number[]; // General tags for this feedback

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  feedback_tag_ids?: number[]; // IDs of other feedback to tag this feedback with

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TaggedEntityDto)
  tagged_entities?: TaggedEntityDto[]; // Tagging with other system entities
}

export class UpdateFeedbackDto {
  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'Feedback text must be at least 5 characters long' })
  feedback_text?: string;

  @IsBoolean()
  @IsOptional()
  is_anonymous?: boolean;

  @IsInt()
  @IsOptional()
  visibility_id?: number;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  tag_ids?: number[]; // Updated general tags

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  feedback_tag_ids?: number[]; // Updated feedback-to-feedback tagging

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TaggedEntityDto)
  tagged_entities?: TaggedEntityDto[]; // Updated tagged system entities
}

// DTO for tagging with other entities (OKRs, Meetings, etc.)
export class TaggedEntityDto {
  @IsInt()
  entity_id: number; // ID of the tagged entity

  @IsString()
  entity_type: string; // Type of the tagged entity (e.g., "okr", "meeting")
}
