import {
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  MinLength,
  IsArray,
} from 'class-validator';

export class CreateFeedbackRequestDto {
  @IsInt()
  requesterId: number; // this will be from the jwt in the req body in the controller

  @IsInt()
  recipientId: number;

  @IsInt()
  targetUserId: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsString()
  statusType: string; // e.g., "PENDING"
}

export class UpdateFeedbackRequestDto {
  @IsInt()
  requestId: number;

  @IsString()
  statusType: string;

  @IsOptional()
  @IsString()
  response?: string;
}

export class GetFeedbackRequestsDto {
  @IsOptional()
  asRequester?: boolean;
}

export class RespondToFeedbackRequestDto {
  @IsInt()
  requestId: number;

  @IsString()
  feedbackTitle: string;

  @IsString()
  @MinLength(5, { message: 'Feedback must be at least 5 characters long' })
  feedbackText: string;

  @IsBoolean()
  isAnonymous: boolean;

  @IsString()
  visibilityType: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class DeclineFeedbackRequestDto {
  @IsInt()
  requestId: number;

  @IsOptional()
  @IsString()
  response?: string;
}
