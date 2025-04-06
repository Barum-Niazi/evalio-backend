import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [NotificationService, NotificationRepository, PrismaService],
  exports: [NotificationService, NotificationRepository],
})
export class NotificationModule {}
