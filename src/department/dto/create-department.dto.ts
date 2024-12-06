import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  name: string;

  @IsInt()
  companyId: number;

  @IsInt()
  @IsOptional()
  headId?: number;
}
