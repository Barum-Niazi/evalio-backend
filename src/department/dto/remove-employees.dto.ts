import { IsArray, IsInt, Min } from 'class-validator';

export class RemoveEmployeesFromDepartmentsDto {
  @IsInt()
  @Min(1)
  departmentId: number;

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  employeeIds: number[];
}
