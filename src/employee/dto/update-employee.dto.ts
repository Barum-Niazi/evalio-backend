// src/employee/dto/update-employee.dto.ts
import { IsEmail, IsOptional, IsNumber, IsString } from 'class-validator';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  managerId?: number;

  @IsOptional()
  @IsNumber()
  departmentId?: number;

  @IsOptional()
  @IsString()
  designation?: string;
}
