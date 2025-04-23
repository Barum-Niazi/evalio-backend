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
    const feedback = await this.prisma.feedback.findMany({
      where: {
        OR: [{ sender_id: employeeId }, { receiver_id: employeeId }],
      },
      orderBy: { id: 'desc' },
      include: {
        visibility: true, // for visibilityType string
        sender: {
          select: {
            user_id: true,
            name: true,
          },
        },
        receiver: {
          select: {
            user_id: true,
            name: true,
            company_id: true,
          },
        },
      },
    });

    const feedbackIds = feedback.map((fb) => fb.id);

    const feedbackTags = await this.prisma.tagged_entities.findMany({
      where: {
        entity_id: { in: feedbackIds },
        entity_type: 'FEEDBACK',
      },
      include: {
        tag: true,
      },
    });

    return feedback.map((fb) => {
      const tags = feedbackTags
        .filter((tagEntity) => tagEntity.entity_id === fb.id)
        .map((tagEntity) => tagEntity.tag);

      return {
        ...fb,
        tags,
      };
    });
  }

  async getAllFeedbackWithVisibility(): Promise<any[]> {
    return this.prisma.feedback.findMany({
      orderBy: { id: 'desc' },
      include: {
        visibility: true,
        sender: {
          select: { user_id: true, name: true },
        },
        receiver: {
          select: {
            user_id: true,
            name: true,
            manager_id: true,
            company_id: true,
          },
        },
      },
    });
  }

  async deleteFeedback(feedbackId: number): Promise<void> {
    await this.prisma.feedback.delete({
      where: { id: feedbackId },
    });
  }

  async getFeedbackByCompany(companyId: number) {
    return this.prisma.feedback.findMany({
      where: {
        receiver: {
          company_id: companyId,
        },
      },
      select: {
        id: true,
        sentiment: true,
        is_anonymous: true,
      },
    });
  }
}
