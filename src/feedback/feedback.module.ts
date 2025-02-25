import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackRepository } from './feedback.repository';
import { TagsModule } from '../tags/tags.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [TagsModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackRepository, PrismaService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
