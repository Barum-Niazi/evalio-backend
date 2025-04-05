import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { feedback } from '@prisma/client';

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(
    feedbackText: string,
    senderId: number,
    receiverId: number,
    isAnonymous: boolean,
    visibilityId: number,
  ): Promise<feedback> {
    return this.prisma.feedback.create({
      data: {
        feedback_text: feedbackText,
        is_anonymous: isAnonymous,
        visibility_id: visibilityId,
        sender_id: senderId,
        receiver_id: receiverId,
        audit: {},
      },
    });
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

  /**
   * ✅ Delete feedback entry.
   */
  async deleteFeedback(feedbackId: number): Promise<void> {
    await this.prisma.feedback.delete({
      where: { id: feedbackId },
    });
  }
}
