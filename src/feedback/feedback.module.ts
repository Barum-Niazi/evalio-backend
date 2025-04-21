import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { FeedbackRepository } from './feedback.repository';
import { PrismaService } from '../prisma/prisma.service';
import { TagModule } from 'src/tags/tag.module';
import { NotificationModule } from 'src/notification/notification.module';
import { SentimentAnalysisService } from 'src/services/sentiment-analysis.service';
import { FeedbackRequestRepository } from './feedback-request.repository';
import { FeedbackRequestService } from './feedback-request.service';

@Module({
  imports: [TagModule, NotificationModule],
  controllers: [FeedbackController],
  providers: [
    FeedbackService,
    FeedbackRepository,
    PrismaService,
    SentimentAnalysisService,
    FeedbackRequestRepository,
    FeedbackRequestService,
  ],
  exports: [FeedbackService],
})
export class FeedbackModule {}
