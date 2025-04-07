import {
  IsInt,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @MinLength(5, { message: 'Feedback must be at least 5 characters long' })
  feedbackText: string;

  @IsBoolean()
  isAnonymous: boolean;

  @IsString()
  visibilityType: string; // Foreign key to lookup visibility

  @IsInt()
  senderId: number; // User ID of the sender

  @IsInt()
  receiverId: number; // User ID of the receiver
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

/**
 * ✅ DTO for listing multiple feedback entries with optional filters
 */
export class ListFeedbackDto {
  @IsInt()
  @IsOptional()
  senderId?: number; // Filter by sender

  @IsInt()
  @IsOptional()
  receiverId?: number; // Filter by receiver
}
