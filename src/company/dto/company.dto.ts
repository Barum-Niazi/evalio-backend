import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateCompanyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() description?: string;

  @IsOptional()
  @IsObject()
  metadata?: {
    website?: string;
    email?: string;
    phoneNumber?: string;
    timeZone?: string;
  };
}

export class UpdateCompanySettingsDto {
  @IsOptional() @IsBoolean() allow_anonymous_feedback?: boolean;
  @IsOptional() @IsBoolean() enable_okrs?: boolean;
  @IsOptional() @IsBoolean() enable_1on1s?: boolean;
  @IsOptional() @IsBoolean() enable_note_to_self?: boolean;
  @IsOptional() @IsBoolean() enable_feedback_requests?: boolean;
}
