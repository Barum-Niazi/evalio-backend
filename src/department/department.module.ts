import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { DepartmentRepository } from 'src/repositories/department.repository';
import { UserRepository } from 'src/repositories/user.repository';

@Module({
  controllers: [DepartmentController],
  providers: [DepartmentService, DepartmentRepository, UserRepository],
  exports: [DepartmentService],
})
export class DepartmentModule {}
