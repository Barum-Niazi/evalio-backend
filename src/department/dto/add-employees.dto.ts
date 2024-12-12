import { IsInt, IsArray, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class EmployeeDepartmentDto {
  @IsInt()
  departmentId: number;

  @IsArray()
  @IsEmail({}, { each: true }) // Validate that each entry is an email
  employeeEmails: string[];
}

export class AddEmployeesToDepartmentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeDepartmentDto)
  departments: EmployeeDepartmentDto[];
}
