import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyRepository } from 'src/company/company.repository';
import { EmployeeRepository } from 'src/employee/employee.repository';
import { EmailService } from 'src/services/email.service';
import { DepartmentRepository } from 'src/department/department.repository';
import { BlobModule } from 'src/blob/blob.module';
import { BlobService } from 'src/blob/blob.service';

@Module({
  imports: [BlobModule],
  controllers: [CompanyController],
  providers: [
    CompanyService,
    CompanyRepository,
    EmployeeRepository,
    EmailService,
    BlobService,
    DepartmentRepository,
  ],
  exports: [CompanyService],
})
export class CompanyModule {}
