import { IsInt, IsArray } from 'class-validator';

export class AddEmployeeToDepartmentDto {
  @IsInt()
  departmentId: number;

  @IsArray()
  @IsInt({ each: true })
  employeeIds: number[];
}
