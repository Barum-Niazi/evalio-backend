import { Type } from 'class-transformer';
import { IsArray, IsInt, ValidateNested } from 'class-validator';

class EmployeeDepartmentDto {
  @IsInt()
  departmentId: number;

  @IsArray()
  @IsInt({ each: true }) // corrected decorator for user IDs
  employeeIds: number[];
}

export class AddEmployeesToDepartmentsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeDepartmentDto)
  departments: EmployeeDepartmentDto[];
}
