import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateFeedbackRequestDto,
  UpdateFeedbackRequestDto,
} from './dto/feedback-request.dto';

@Injectable()
export class FeedbackRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  createRequest(data: {
    requesterId: number;
    recipientId: number;
    targetUserId: number;
    message: string;
    statusId: number;
  }) {
    return this.prisma.feedback_requests.create({
      data: {
        requester_id: data.requesterId,
        recipient_id: data.recipientId,
        target_user_id: data.targetUserId,
        message: data.message,
        status_id: data.statusId,
        audit: {
          createdAt: new Date().toISOString(),
        }, // default empty if not set by client
      },
    });
  }

  async getById(requestId: number) {
    return this.prisma.feedback_requests.findUnique({
      where: { id: requestId },
    });
  }

  async updateRequest(data: {
    requestId: number;
    statusType: string;
    response: string;
    feedbackId: number;
  }) {
    const status = await this.prisma.lookup.findFirst({
      where: {
        code: data.statusType,
        category: {
          code: 'FEEDBACK_REQUEST_STATUS',
        },
      },
    });

    if (!status) {
      throw new NotFoundException(
        `Status type '${data.statusType}' not found.`,
      );
    }

    return this.prisma.feedback_requests.update({
      where: { id: data.requestId },
      data: {
        status_id: status.id,
        response: data.response,
        feedback_id: data.feedbackId,
      },
    });
  }

  getRequestsByUser(userId: number, asRequester: boolean) {
    return this.prisma.feedback_requests.findMany({
      where: asRequester ? { requester_id: userId } : { recipient_id: userId },
      include: {
        requester: true,
        recipient: true,
        target_user: true,
        status: true,
      },
    });
  }

  async getStatusId(statusType: string): Promise<number> {
    const status = await this.prisma.lookup.findFirst({
      where: {
        code: statusType,
        category: {
          code: 'FEEDBACK_REQUEST_STATUS',
        },
      },
    });

    return status.id;
  }
}
