import { Injectable, NotFoundException } from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository';
import { TagService } from '../tags/tag.service';
import { NotificationService } from '../notification/notification.service';
import {
  CreateFeedbackDto,
  UpdateFeedbackDto,
  GetFeedbackDto,
  DeleteFeedbackDto,
  ListAccessibleFeedbackDto,
} from './dto/feedback.dto';
import { SentimentAnalysisService } from 'src/services/sentiment-analysis.service';
import { filterAndFormatFeedbacks, transformFeedback } from './feedback.utils';
import { TagRepository } from 'src/tags/tag.repository';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly tagService: TagService,
    private readonly notificationService: NotificationService,
    private readonly sentimentAnalysisService: SentimentAnalysisService,
    private readonly tagRepository: TagRepository,
  ) {}

  /**
   * ✅ Create new feedback
   * - Saves feedback to the DB
   * - Auto-creates a tag from the feedback text
   * - Sends a notification to the recipient
   */
  async createFeedback(createFeedbackDto: CreateFeedbackDto) {
    const {
      feedbackTitle,
      feedbackText,
      senderId,
      receiverId,
      isAnonymous,
      visibilityType,
      tags,
    } = createFeedbackDto;

    const sentiment =
      await this.sentimentAnalysisService.analyzeSentiment(feedbackText);
    console.log('Sentiment Analysis Result:', sentiment); // Log the sentiment result

    const feedback = await this.feedbackRepository.createFeedback(
      feedbackTitle,
      feedbackText,
      senderId,
      receiverId,
      isAnonymous,
      visibilityType,
      sentiment,
    );

    if (tags && tags.length > 0) {
      await this.tagService.tagEntity(
        tags, // Array of tag titles
        feedback.id, // Entity ID (feedback.id)
        'FEEDBACK', // Entity Type
        feedback.id, // Reference ID (feedback.id)
        'FEEDBACK', // Reference Type
      );
    }
    // Auto-create a tag for the feedback text
    await this.tagService.createTagforEntities(
      feedback.title,
      feedback.feedback_text,
      feedback.id,
      'FEEDBACK',
    );

    // Send notification to the receiver
    await this.notificationService.create(
      receiverId,
      1, // this is the notification type id
      `You have received new feedback.`,
      `/feedback/${feedback.id}`,
    );

    return feedback;
  }

  async getFeedback(getFeedbackDto: GetFeedbackDto) {
    const feedback = await this.feedbackRepository.getFeedbackById(
      getFeedbackDto.feedbackId,
    );

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return feedback;
  }

  /**
   * ✅ Update feedback entry
   */
  async updateFeedback(updateFeedbackDto: UpdateFeedbackDto) {
    const { feedbackId, feedbackText, isAnonymous, visibilityId } =
      updateFeedbackDto;

    // Ensure feedback exists before updating
    const existingFeedback =
      await this.feedbackRepository.getFeedbackById(feedbackId);
    if (!existingFeedback) {
      throw new NotFoundException('Feedback not found');
    }

    return this.feedbackRepository.updateFeedback(
      feedbackId,
      feedbackText,
      isAnonymous,
      visibilityId,
    );
  }

  /**
   * ✅ Delete feedback entry
   */
  async deleteFeedback(deleteFeedbackDto: DeleteFeedbackDto) {
    const { feedbackId } = deleteFeedbackDto;

    // Ensure feedback exists before deleting
    const existingFeedback =
      await this.feedbackRepository.getFeedbackById(feedbackId);
    if (!existingFeedback) {
      throw new NotFoundException('Feedback not found');
    }

    return this.feedbackRepository.deleteFeedback(feedbackId);
  }

  async getFeedbackbyEmployee(
    currentUser: { id: number; companyId: number },
    query?: ListAccessibleFeedbackDto,
  ) {
    const feedbacks =
      await this.feedbackRepository.getAllFeedbackWithVisibility();
    let visibleFeedbacks = filterAndFormatFeedbacks(feedbacks, currentUser);

    if (query?.sentiment) {
      visibleFeedbacks = visibleFeedbacks.filter(
        (fb) => fb.sentiment === query.sentiment,
      );
    }

    if (query?.teamMemberId) {
      visibleFeedbacks = visibleFeedbacks.filter(
        (fb) => fb.receiver_id === query.teamMemberId,
      );
    }

    const feedbackIds = visibleFeedbacks.map((fb) => fb.id);

    const taggedEntities = await this.tagRepository.getTagsForEntities(
      feedbackIds,
      'FEEDBACK',
    );

    let feedbacksWithTags = visibleFeedbacks.map((fb) => {
      const tags = taggedEntities
        .filter((te) => te.entity_id === fb.id)
        .map((te) => te.tag);

      return {
        ...fb,
        tags,
      };
    });

    // AND logic for tags
    if (query?.tags?.length) {
      feedbacksWithTags = feedbacksWithTags.filter((fb) =>
        query.tags.every((requestedTag) =>
          fb.tags.some((tag) => tag.name === requestedTag),
        ),
      );
    }

    return feedbacksWithTags.map((fb) => transformFeedback(fb, currentUser.id));
  }

  async getFeedbackSummary(companyId: number) {
    const feedbacks =
      await this.feedbackRepository.getFeedbackByCompany(companyId);

    const total = feedbacks.length;
    const bySentiment = {
      POSITIVE: 0,
      NEGATIVE: 0,
      NEUTRAL: 0,
    };

    let anonymousCount = 0;

    feedbacks.forEach((fb) => {
      if (fb.is_anonymous) anonymousCount++;
      const sentiment = (fb.sentiment || 'NEUTRAL').toUpperCase();
      if (bySentiment[sentiment] !== undefined) {
        bySentiment[sentiment]++;
      }
    });

    return {
      totalFeedback: total,
      ...bySentiment,
      anonymousCount,
    };
  }

  async getTopTagsVisibleToUser(currentUser: {
    id: number;
    companyId: number;
  }) {
    const feedbacks =
      await this.feedbackRepository.getAllFeedbackWithVisibility();
    const visibleFeedbacks = filterAndFormatFeedbacks(feedbacks, currentUser);
    const feedbackIds = visibleFeedbacks.map((fb) => fb.id);

    const tagEntities = await this.tagRepository.getTagsByEntityIds(
      feedbackIds,
      'FEEDBACK',
    );

    return this.countTags(tagEntities);
  }
  async getTopTagsForCompany(companyId: number) {
    const feedbacks =
      await this.feedbackRepository.getFeedbackByCompany(companyId);
    const feedbackIds = feedbacks.map((fb) => fb.id);

    const tagEntities = await this.tagRepository.getTopFeedbackTags(
      feedbackIds,
      'FEEDBACK',
    );

    return this.countTags(tagEntities);
  }

  private countTags(tagEntities: any[]) {
    const tagCountMap: Record<string, number> = {};

    tagEntities.forEach((te) => {
      const tagName = te.tag.name;
      tagCountMap[tagName] = (tagCountMap[tagName] || 0) + 1;
    });

    return Object.entries(tagCountMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }
}
