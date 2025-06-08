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
import { UserRepository } from 'src/user/user.repository';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly tagService: TagService,
    private readonly notificationService: NotificationService,
    private readonly sentimentAnalysisService: SentimentAnalysisService,
    private readonly tagRepository: TagRepository,
    private readonly userRepository: UserRepository,
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
  async getFeedbackByUser(
    userId: number,
    companyId: number,
    query?: ListAccessibleFeedbackDto,
  ) {
    // Step 1: Get all feedback for the user (either as sender or receiver)
    const feedbacks = await this.feedbackRepository.getFeedbackByUser(userId);
    console.log(feedbacks);
    console.log(companyId);

    // Step 2: Apply filters and format feedback (if needed)
    let visibleFeedbacks = filterAndFormatFeedbacks(feedbacks, {
      id: userId,
      companyId: companyId,
    });

    // Step 3: Filter by sentiment if provided
    if (query?.sentiment) {
      visibleFeedbacks = visibleFeedbacks.filter(
        (fb) => fb.sentiment === query.sentiment,
      );
    }

    // Step 4: Filter by team member if provided (this would use the `receiver_id` as team member in case of feedback directed towards them)
    if (query?.teamMemberId) {
      visibleFeedbacks = visibleFeedbacks.filter(
        (fb) => fb.receiver_id === query.teamMemberId,
      );
    }

    // Step 5: Get all the feedback IDs for later use with tags
    const feedbackIds = visibleFeedbacks.map((fb) => fb.id);

    // Step 6: Get tags for the feedbacks
    const taggedEntities = await this.tagRepository.getTagsForEntities(
      feedbackIds,
      'FEEDBACK',
    );

    // Step 7: Add tags to the feedbacks
    let feedbacksWithTags = visibleFeedbacks.map((fb) => {
      const tags = taggedEntities
        .filter((te) => te.entity_id === fb.id)
        .map((te) => te.tag);

      return {
        ...fb,
        tags,
      };
    });

    // Step 8: Filter by tags if provided
    if (query?.tags?.length) {
      feedbacksWithTags = feedbacksWithTags.filter((fb) =>
        query.tags.every((requestedTag) =>
          (fb.tags ?? []).some((tag) => tag.name === requestedTag),
        ),
      );
    }

    // Step 9: Collect all user IDs involved in feedback (sender/receiver)
    const userIds = Array.from(
      new Set([
        ...feedbacksWithTags.map((fb) => fb.sender_id),
        ...feedbacksWithTags.map((fb) => fb.receiver_id),
      ]),
    );

    // Step 10: Get profile blobs for the involved users (both sender and receiver)
    const userBlobs =
      await this.userRepository.getProfileBlobsForUserIds(userIds);

    // Step 11: Map user profile blobs to user IDs
    const profileBlobMap = new Map<number, any>();
    userBlobs.forEach((ub) => {
      if (ub.profile_blob) {
        profileBlobMap.set(ub.user_id, {
          id: ub.profile_blob.id,
          name: ub.profile_blob.name,
          mimeType: ub.profile_blob.mime_type,
          size: ub.profile_blob.size,
          url: `/blob/${ub.profile_blob.id}/view`,
        });
      }
    });

    // Step 12: Transform feedbacks to include profile images
    return feedbacksWithTags.map((fb) =>
      transformFeedback(fb, userId, {
        senderProfileImage: profileBlobMap.get(fb.sender_id) || null,
        receiverProfileImage: profileBlobMap.get(fb.receiver_id) || null,
      }),
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

    // Filter by tags
    if (query?.tags?.length) {
      feedbacksWithTags = feedbacksWithTags.filter((fb) =>
        query.tags.every((requestedTag) =>
          (fb.tags ?? []).some((tag) => tag.name === requestedTag),
        ),
      );
    }

    const userIds = Array.from(
      new Set([
        ...feedbacksWithTags.map((fb) => fb.sender_id),
        ...feedbacksWithTags.map((fb) => fb.receiver_id),
      ]),
    );

    const userBlobs =
      await this.userRepository.getProfileBlobsForUserIds(userIds);

    const profileBlobMap = new Map<number, any>();
    userBlobs.forEach((ub) => {
      if (ub.profile_blob) {
        profileBlobMap.set(ub.user_id, {
          id: ub.profile_blob.id,
          name: ub.profile_blob.name,
          mimeType: ub.profile_blob.mime_type,
          size: ub.profile_blob.size,
          url: `/blob/${ub.profile_blob.id}/view`,
        });
      }
    });

    return feedbacksWithTags.map((fb) =>
      transformFeedback(fb, currentUser.id, {
        senderProfileImage: profileBlobMap.get(fb.sender_id) || null,
        receiverProfileImage: profileBlobMap.get(fb.receiver_id) || null,
      }),
    );
  }

  async getFeedbackSummary(companyId: number) {
    const feedbacks =
      await this.feedbackRepository.getFeedbackByCompany(companyId);
    const feedbackIds = feedbacks.map((fb) => fb.id);

    const bySentiment = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
    let anonymousCount = 0;
    let dates: Date[] = [];

    feedbacks.forEach((fb) => {
      if (fb.is_anonymous) anonymousCount++;
      const sentiment = (fb.sentiment || 'NEUTRAL').toUpperCase();
      if (bySentiment[sentiment] !== undefined) {
        bySentiment[sentiment]++;
      }
      dates.push(new Date(fb.date));
    });

    const tagLinks = await this.tagRepository.getTopFeedbackTags(
      feedbackIds,
      'FEEDBACK',
    );
    const tagCountMap: Record<string, number> = {};
    tagLinks.forEach((te) => {
      if (!te.tag) return;
      const name = te.tag.name;
      tagCountMap[name] = (tagCountMap[name] || 0) + 1;
    });

    const mostUsedTags = Object.entries(tagCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalFeedback: feedbacks.length,
      sentiment: bySentiment,
      anonymous: {
        count: anonymousCount,
        percentage: +((anonymousCount / (feedbacks.length || 1)) * 100).toFixed(
          2,
        ),
      },
      tagged: {
        withTags: new Set(tagLinks.map((te) => te.entity_id)).size,
        withoutTags:
          feedbacks.length - new Set(tagLinks.map((te) => te.entity_id)).size,
      },
      mostUsedTags,
      recentFeedbackDates: {
        first: dates.length
          ? new Date(Math.min(...dates.map((d) => d.getTime())))
          : null,
        last: dates.length
          ? new Date(Math.max(...dates.map((d) => d.getTime())))
          : null,
      },
    };
  }

  async getVisibleFeedbackSummary(currentUser: {
    id: number;
    companyId: number;
  }) {
    const feedbacks =
      await this.feedbackRepository.getAllFeedbackWithVisibility();
    const visibleFeedbacks = filterAndFormatFeedbacks(feedbacks, currentUser);
    const visibleIds = visibleFeedbacks.map((fb) => fb.id);

    const bySentiment = { POSITIVE: 0, NEGATIVE: 0, NEUTRAL: 0 };
    let anonymousCount = 0;
    let dates: Date[] = [];

    visibleFeedbacks.forEach((fb) => {
      if (fb.is_anonymous) anonymousCount++;
      const sentiment = (fb.sentiment || 'NEUTRAL').toUpperCase();
      if (bySentiment[sentiment] !== undefined) {
        bySentiment[sentiment]++;
      }
      dates.push(new Date(fb.date));
    });

    const tagLinks = await this.tagRepository.getTopFeedbackTags(
      visibleIds,
      'FEEDBACK',
    );

    const tagCountMap: Record<string, number> = {};
    tagLinks.forEach((te) => {
      if (!te.tag) return;
      const name = te.tag.name;
      tagCountMap[name] = (tagCountMap[name] || 0) + 1;
    });

    const mostUsedTags = Object.entries(tagCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalFeedback: visibleFeedbacks.length,
      sentiment: bySentiment,
      anonymous: {
        count: anonymousCount,
        percentage: +((anonymousCount / visibleFeedbacks.length) * 100).toFixed(
          2,
        ),
      },
      tagged: {
        withTags: new Set(tagLinks.map((te) => te.entity_id)).size,
        withoutTags:
          visibleFeedbacks.length -
          new Set(tagLinks.map((te) => te.entity_id)).size,
      },
      mostUsedTags,
      recentFeedbackDates: {
        first: dates.length
          ? new Date(Math.min(...dates.map((d) => d.getTime())))
          : null,
        last: dates.length
          ? new Date(Math.max(...dates.map((d) => d.getTime())))
          : null,
      },
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

    const tagEntities = await this.tagRepository.getTopFeedbackTags(
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
