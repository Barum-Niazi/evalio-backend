import {
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

/**
 * ✅ Create Key Result
 */
export class CreateKeyResultDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsInt()
  okrId: number;

  @IsInt()
  @IsOptional()
  parentKeyResultId?: number;
}

/**
 * ✅ Update Key Result
 */
export class UpdateKeyResultDto {
  @IsInt()
  id: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
}

/**
 * ✅ Get Key Result
 */
export class GetKeyResultDto {
  @IsInt()
  id: number;
}

/**
 * ✅ Delete Key Result
 */
export class DeleteKeyResultDto {
  @IsInt()
  id: number;
}
