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

    // Filter by sentiment
    if (query?.sentiment) {
      visibleFeedbacks = visibleFeedbacks.filter(
        (fb) => fb.sentiment === query.sentiment,
      );
    }

    // Filter by team member (if the current user is their manager)
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

    // Filter by tags (after tags are attached)
    if (query?.tags?.length) {
      feedbacksWithTags = feedbacksWithTags.filter((fb) =>
        fb.tags.some((tag) => query.tags.includes(tag.name)),
      );
    }

    return feedbacksWithTags.map((fb) => transformFeedback(fb, currentUser.id));
  }
}
