import { Injectable, NotFoundException } from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository';
import { TagService } from '../tags/tag.service';
import { NotificationService } from '../notification/notification.service';
import {
  CreateFeedbackDto,
  UpdateFeedbackDto,
  GetFeedbackDto,
  DeleteFeedbackDto,
  ListFeedbackDto,
} from './dto/feedback.dto';
import { SentimentAnalysisService } from 'src/services/sentiment-analysis.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly tagService: TagService,
    private readonly notificationService: NotificationService,
    private readonly sentimentAnalysisService: SentimentAnalysisService,
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
   * ✅ Retrieve all feedback with optional filters (sender, receiver)
   */
  async listFeedback(listFeedbackDto: ListFeedbackDto) {
    return this.feedbackRepository.getAllFeedback(
      listFeedbackDto.senderId,
      listFeedbackDto.receiverId,
    );
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

  getFeedbackbyEmployee(employeeId: number) {
    return this.feedbackRepository.getFeedbackByEmployeeId(employeeId);
  }
}
