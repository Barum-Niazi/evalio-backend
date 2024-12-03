import { IsString, IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsNumber()
  companyId: number;
}
