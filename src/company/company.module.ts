import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';

@Module({
  providers: [CompanyController, CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
