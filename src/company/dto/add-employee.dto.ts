import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
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
  managerId?: number;
}
