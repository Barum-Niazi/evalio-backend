import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateKeyResultDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  okrId: number;

  @IsInt()
  @IsOptional()
  parentKeyResultId?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
}

export class UpdateKeyResultDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  parentKeyResultId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
}
