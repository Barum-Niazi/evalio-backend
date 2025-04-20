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

  @IsOptional()
  @IsInt()
  departmentId?: number;
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

  @IsOptional()
  @IsInt()
  departmentId?: number; // Optional, if provided, will update the department
}

export class DeleteOkrDto {
  @IsInt()
  okrId: number;
}
