import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackRepository } from './feedback.repository';
import { PrismaService } from '../prisma/prisma.service';
import { TagModule } from 'src/tags/tag.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [TagModule, NotificationModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackRepository, PrismaService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
