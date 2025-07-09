import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsString,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddEmployeeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleEmployeeDto)
  employees: SingleEmployeeDto[];
}

class SingleEmployeeDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  designation: string;

  @IsOptional()
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsInt()
  managerId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[]; // Optional: defaults to ['Employee'] in logic
}
