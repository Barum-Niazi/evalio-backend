import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @MinLength(5, { message: 'Feedback text must be at least 5 characters long' })
  feedbackText: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @IsInt()
  visibilityId: number;

  @IsInt()
  senderId: number;

  @IsInt()
  receiverId: number;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  tagIds?: number[];

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  feedbackTagIds?: number[];

  @IsArray()
  @IsOptional()
  taggedEntities?: { entityId: number; entityType: string }[];
}

export class UpdateFeedbackDto {
  @IsString()
  @IsOptional()
  @MinLength(5, { message: 'Feedback text must be at least 5 characters long' })
  feedbackText?: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @IsInt()
  @IsOptional()
  visibilityId?: number;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  tagIds?: number[];
}

export class GetFeedbackDto {
  @IsInt()
  @IsOptional()
  senderId?: number;

  @IsInt()
  @IsOptional()
  receiverId?: number;

  @IsInt()
  @IsOptional()
  visibilityId?: number;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  tagIds?: number[];
}
