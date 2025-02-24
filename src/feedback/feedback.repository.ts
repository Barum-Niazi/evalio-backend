import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto, UpdateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(dto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: {
        feedback_text: dto.feedbackText,
        is_anonymous: dto.isAnonymous,
        visibility_id: dto.visibilityId,
        sender_id: dto.senderId,
        receiver_id: dto.receiverId,
      },
    });
  }

  async updateFeedback(id: number, dto: UpdateFeedbackDto) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');

    return this.prisma.feedback.update({
      where: { id },
      data: {
        feedback_text: dto.feedbackText,
        is_anonymous: dto.isAnonymous,
        visibility_id: dto.visibilityId,
      },
    });
  }

  async getFeedbackById(id: number) {
    return this.prisma.feedback.findUnique({
      where: { id },
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async getUserFeedback(userId: number, type: 'sent' | 'received') {
    const condition =
      type === 'sent' ? { sender_id: userId } : { receiver_id: userId };
    return this.prisma.feedback.findMany({
      where: condition,
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async getAllFeedback() {
    return this.prisma.feedback.findMany({
      include: {
        sender: true,
        receiver: true,
      },
    });
  }

  async deleteFeedback(id: number) {
    return this.prisma.feedback.delete({ where: { id } });
  }
}
