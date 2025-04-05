import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackRepository } from './feedback.repository';
import { PrismaService } from '../prisma/prisma.service';
import { TagService } from 'src/tags/tag.service';

@Module({
  imports: [TagService],
  controllers: [FeedbackController],
  providers: [FeedbackService, FeedbackRepository, PrismaService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
