import { Body, Controller, Post } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('add')
  async addEmployee(@Body() createEmployeeDto: CreateEmployeeDto) {
    const { name, email, companyId } = createEmployeeDto;
    return this.companyService.addEmployee(name, email, companyId);
  }
}
