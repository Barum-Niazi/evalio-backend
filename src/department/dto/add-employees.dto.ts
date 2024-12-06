import { IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class EmployeeDepartmentDto {
  @IsInt()
  departmentId: number;

  @IsArray()
  @IsInt({ each: true })
  employeeIds: number[];
}

export class AddEmployeesToDepartmentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeDepartmentDto)
  departments: EmployeeDepartmentDto[];
}
