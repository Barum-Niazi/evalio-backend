import { Module } from '@nestjs/common';
import { OkrController } from './okr.controller';
import { OkrService } from './okr.service';
import { OkrRepository } from './okr.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { TagModule } from 'src/tags/tag.module'; // 🔥 import TagModule
import { NotificationModule } from 'src/notification/notification.module';
import { DepartmentRepository } from 'src/department/department.repository';

@Module({
  imports: [TagModule, NotificationModule],
  controllers: [OkrController],
  providers: [OkrService, OkrRepository, PrismaService, DepartmentRepository],
  exports: [OkrService, OkrRepository],
})
export class OkrModule {}
