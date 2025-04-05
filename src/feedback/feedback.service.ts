import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly tagService: TagService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * ✅ Create new feedback
   * - Saves feedback to the DB
   * - Auto-creates a tag from the feedback text
   * - Sends a notification to the recipient
   */
  async createFeedback(createFeedbackDto: CreateFeedbackDto) {
    const { feedbackText, senderId, receiverId, isAnonymous, visibilityId } =
      createFeedbackDto;

    // Save feedback
    const feedback = await this.feedbackRepository.createFeedback(
      feedbackText,
      senderId,
      receiverId,
      isAnonymous,
      visibilityId,
    );

    // Auto-create a tag for the feedback text
    await this.tagService.autoCreateTagForEntity({});

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
}
