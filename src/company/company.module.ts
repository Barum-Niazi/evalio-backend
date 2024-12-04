import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyRepository } from 'src/repositories/company.repository';
import { EmployeeRepository } from 'src/repositories/employee.repository';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, CompanyRepository, EmployeeRepository],
  exports: [CompanyService],
})
export class CompanyModule {}
