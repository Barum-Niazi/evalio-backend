import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateFeedbackRequestDto,
  DeclineFeedbackRequestDto,
  RespondToFeedbackRequestDto,
  UpdateFeedbackRequestDto,
} from './dto/feedback-request.dto';
import { SentimentAnalysisService } from 'src/services/sentiment-analysis.service';
import { FeedbackRequestRepository } from './feedback-request.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationService } from 'src/notification/notification.service';
import { FeedbackRepository } from './feedback.repository';
import { TagService } from 'src/tags/tag.service';

@Injectable()
export class FeedbackRequestService {
  constructor(
    private readonly feedbackRequestRepository: FeedbackRequestRepository,
    private readonly sentimentAnalysisService: SentimentAnalysisService,
    private readonly notificationService: NotificationService,
    private readonly feedbackRepository: FeedbackRepository,
    private readonly tagService: TagService,
  ) {}

  async createFeedbackRequest(dto: CreateFeedbackRequestDto) {
    const status = await this.feedbackRequestRepository.getStatusId(
      dto.statusType,
    );

    if (!status) {
      throw new NotFoundException(`Status type '${dto.statusType}' not found.`);
    }

    const request = await this.feedbackRequestRepository.createRequest({
      requesterId: dto.requesterId,
      recipientId: dto.recipientId,
      targetUserId: dto.targetUserId,
      message: dto.message,
      statusId: status,
    });

    await this.notificationService.create(
      dto.recipientId,
      2,
      `You received a feedback request.`,
      `/feedback-requests/${request.id}`,
    );

    return request;
  }

  async getFeedbackRequestsByUser(userId: number, asRequester: boolean) {
    return this.feedbackRequestRepository.getRequestsByUser(
      userId,
      asRequester,
    );
  }

  async respondToFeedbackRequest(
    employeeId: number,
    dto: RespondToFeedbackRequestDto,
  ) {
    const request = await this.feedbackRequestRepository.getById(dto.requestId);

    if (!request || request.recipient_id !== employeeId) {
      throw new ForbiddenException(
        'You cannot respond to this feedback request.',
      );
    }

    const sentiment = await this.sentimentAnalysisService.analyzeSentiment(
      dto.feedbackText,
    );

    const feedback = await this.feedbackRepository.createFeedback(
      dto.feedbackTitle,
      dto.feedbackText,
      employeeId,
      request.target_user_id,
      dto.isAnonymous,
      dto.visibilityType,
      sentiment,
    );

    if (dto.tags?.length) {
      await this.tagService.tagEntity(
        dto.tags,
        feedback.id,
        'FEEDBACK',
        feedback.id,
        'FEEDBACK',
      );
    }

    await this.tagService.createTagforEntities(
      feedback.title,
      feedback.feedback_text,
      feedback.id,
      'FEEDBACK',
    );

    await this.feedbackRequestRepository.updateRequest({
      requestId: dto.requestId,
      statusType: 'COMPLETED',
      response: 'Feedback submitted.',
      feedbackId: feedback.id,
    });

    await this.notificationService.create(
      request.requester_id,
      1,
      `Your feedback request has been fulfilled.`,
      `/feedback/${feedback.id}`,
    );

    return feedback;
  }

  async declineFeedbackRequest(
    employeeId: number,
    dto: DeclineFeedbackRequestDto,
  ) {
    const request = await this.feedbackRequestRepository.getById(dto.requestId);

    if (!request || request.recipient_id !== employeeId) {
      throw new ForbiddenException(
        'You are not authorized to decline this request.',
      );
    }

    return this.feedbackRequestRepository.updateRequest({
      requestId: dto.requestId,
      statusType: 'DECLINED',
      response: dto.response || 'Declined by user.',
      feedbackId: null,
    });
  }
}
