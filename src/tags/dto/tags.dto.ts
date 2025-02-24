import {
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
} from 'class-validator';

export class CreateTagDto {
  @IsString()
  @MinLength(2, { message: 'Tag name must be at least 2 characters long' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class TagEntityDto {
  @IsInt()
  entityId: number;

  @IsString()
  entityType: string; // Example: "feedback", "meeting", "okr"

  @IsArray()
  @IsInt({ each: true }) // Ensures all tagIds are integers
  tagIds: number[];

  @IsString()
  entityName: string;

  @IsInt()
  @IsOptional()
  referenceId?: number; // Optional: Reference to another entity

  @IsString()
  @IsOptional()
  referenceType?: string; // Optional: Reference entity type
}

export class UntagEntityDto {
  @IsInt()
  entityId: number;

  @IsString()
  entityType: string;

  @IsArray()
  @IsInt({ each: true })
  tagIds: number[];
}
