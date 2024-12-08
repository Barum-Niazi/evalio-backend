import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyRepository } from 'src/repositories/company.repository';
import { EmployeeRepository } from 'src/repositories/employee.repository';
import { EmailService } from 'src/services/email.service';
import { DepartmentRepository } from 'src/repositories/department.repository';

@Module({
  controllers: [CompanyController],
  providers: [
    CompanyService,
    CompanyRepository,
    EmployeeRepository,
    EmailService,
    DepartmentRepository,
  ],
  exports: [CompanyService],
})
export class CompanyModule {}
