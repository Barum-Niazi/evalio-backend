import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * ✅ Create OKR
 */
export class CreateOkrDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  userId: number; // OKR creator

  @IsInt()
  @IsOptional()
  companyId?: number;

  @IsInt()
  @IsOptional()
  parentOkrId?: number;
}

/**
 * ✅ Update OKR
 */
export class UpdateOkrDto {
  @IsInt()
  okrId: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * ✅ Get OKR by ID
 */
export class GetOkrDto {
  @IsInt()
  okrId: number;
}

/**
 * ✅ Delete OKR
 */
export class DeleteOkrDto {
  @IsInt()
  okrId: number;
}
