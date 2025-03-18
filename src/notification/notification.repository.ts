import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { notifications } from '@prisma/client';

@Injectable()
export class notificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createnotifications(
    userId: number,
    typeId: number,
    message: string,
    link?: string,
  ): Promise<notifications> {
    return this.prisma.notifications.create({
      data: {
        user_id: userId,
        type_id: typeId,
        status_id: 1, // Assuming 1 = 'unread' in lookup table
        message,
        link,
        audit: {},
      },
    });
  }

  async getUsernotificationss(userId: number): Promise<notifications[]> {
    return this.prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { id: 'desc' },
    });
  }

  async markAsRead(notificationsId: number): Promise<notifications> {
    return this.prisma.notifications.update({
      where: { id: notificationsId },
      data: { status_id: 2 }, // Assuming 2 = 'read' in lookup table
    });
  }

  async deletenotifications(notificationsId: number): Promise<void> {
    await this.prisma.notifications.delete({ where: { id: notificationsId } });
  }
}
