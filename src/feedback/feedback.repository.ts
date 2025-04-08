import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { feedback } from '@prisma/client';

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getVisibilityId(visibilityType: string): Promise<number> {
    const visibility = await this.prisma.lookup.findFirst({
      where: {
        code: visibilityType, // Match the code for visibility type (e.g., "PUBLIC")
        category: {
          code: 'FEEDBACK_VISIBILITY', // Ensure it belongs to the "Feedback Visibility" category
        },
      },
    });

    if (!visibility) {
      throw new Error(
        `Visibility type "${visibilityType}" not found in the "FEEDBACK_VISIBILITY" category.`,
      );
    }

    return visibility.id;
  }

  async createFeedback(
    feedbackTitle: string,
    feedbackText: string,
    senderId: number,
    receiverId: number,
    isAnonymous: boolean,
    visibilityType: string,
    sentiment: string,
  ): Promise<feedback> {
    const visibilityId = await this.getVisibilityId(visibilityType);
    const createdFeedback = this.prisma.feedback.create({
      data: {
        title: feedbackTitle,
        feedback_text: feedbackText,
        is_anonymous: isAnonymous,
        visibility_id: visibilityId,
        sender_id: senderId,
        receiver_id: receiverId,
        audit: {},
        sentiment: sentiment, // Save the sentiment analysis result
      },
    });

    return createdFeedback;
  }

  async getFeedbackById(feedbackId: number): Promise<feedback | null> {
    return this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
  }

  async getAllFeedback(
    senderId?: number,
    receiverId?: number,
  ): Promise<feedback[]> {
    return this.prisma.feedback.findMany({
      where: {
        sender_id: senderId ? senderId : undefined,
        receiver_id: receiverId ? receiverId : undefined,
      },
      orderBy: { id: 'desc' }, // Latest feedback first
    });
  }

  /**
   * ✅ Update feedback entry.
   */
  async updateFeedback(
    feedbackId: number,
    feedbackText?: string,
    isAnonymous?: boolean,
    visibilityId?: number,
  ): Promise<feedback> {
    return this.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        feedback_text: feedbackText,
        is_anonymous: isAnonymous,
        visibility_id: visibilityId,
      },
    });
  }

  async getFeedbackByEmployeeId(employeeId: number): Promise<any[]> {
    // Step 1: Get feedback data
    const feedback = await this.prisma.feedback.findMany({
      where: {
        OR: [{ sender_id: employeeId }, { receiver_id: employeeId }],
      },
      orderBy: { id: 'desc' }, // Latest feedback first
    });

    // Step 2: Get all the feedback IDs
    const feedbackIds = feedback.map((fb) => fb.id);

    // Step 3: Get associated tags for those feedback IDs
    const feedbackTags = await this.prisma.tagged_entities.findMany({
      where: {
        entity_id: { in: feedbackIds }, // Fetch tags related to these feedback IDs
        entity_type: 'FEEDBACK',
      },
      include: {
        tag: true, // Include the tag details
      },
    });

    // Step 4: Return feedback and tags as a combined object
    return feedback.map((fb) => {
      // Find all tags associated with the current feedback
      const tags = feedbackTags
        .filter((tagEntity) => tagEntity.entity_id === fb.id)
        .map((tagEntity) => tagEntity.tag); // Extract the tag data

      // Return an object with feedback and its associated tags
      return {
        ...fb, // Spread feedback data
        tags: tags, // Attach the tags to the feedback data
      };
    });
  }

  /**
   * ✅ Delete feedback entry.
   */
  async deleteFeedback(feedbackId: number): Promise<void> {
    await this.prisma.feedback.delete({
      where: { id: feedbackId },
    });
  }
}
