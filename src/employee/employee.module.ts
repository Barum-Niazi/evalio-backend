import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeRepository } from 'src/repositories/employee.repository';
import { EmailService } from 'src/services/email.service';
import { CompanyRepository } from 'src/repositories/company.repository';
import { CompanyService } from 'src/company/company.service';

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeRepository, EmailService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
