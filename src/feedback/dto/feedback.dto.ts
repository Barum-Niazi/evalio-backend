import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  feedbackTitle: string; // Title of the feedback
  @IsString()
  @MinLength(5, { message: 'Feedback must be at least 5 characters long' })
  feedbackText: string;

  @IsBoolean()
  isAnonymous: boolean;

  @IsString()
  visibilityType: string; // Foreign key to lookup visibility

  @IsOptional()
  @IsInt()
  senderId: number; // User ID of the sender

  @IsInt()
  receiverId: number; // User ID of the receiver

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]; // Array of tag titles
}

export class UpdateFeedbackDto {
  @IsInt()
  feedbackId: number;

  @IsString()
  @MinLength(5, { message: 'Feedback must be at least 5 characters long' })
  @IsOptional()
  feedbackText?: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @IsInt()
  @IsOptional()
  visibilityId?: number;
}

/**
 * ✅ DTO for fetching a single feedback entry by ID
 */
export class GetFeedbackDto {
  @IsInt()
  feedbackId: number;
}

/**
 * ✅ DTO for deleting a feedback entry
 */
export class DeleteFeedbackDto {
  @IsInt()
  feedbackId: number;
}

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL',
}

export class ListAccessibleFeedbackDto {
  @IsOptional()
  @IsEnum(Sentiment)
  sentiment?: Sentiment;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teamMemberId?: number;
}
