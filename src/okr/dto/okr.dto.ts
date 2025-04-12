import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * ✅ Create OKR
 */
export class CreateOkrDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  companyId?: number;

  @IsInt()
  @IsOptional()
  userId?: number;

  @IsInt()
  @IsOptional()
  parentOkrId?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  assignedTo?: number[]; // userIds for userOkrs relation
}

/**
 * ✅ Update OKR
 */
export class UpdateOkrDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  parentOkrId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  assignedTo?: number[]; // replaces all current assignments
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
