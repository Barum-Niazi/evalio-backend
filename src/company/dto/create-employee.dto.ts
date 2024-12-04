import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddEmployeeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  designation: string;

  @IsOptional()
  managerId?: number;
}
