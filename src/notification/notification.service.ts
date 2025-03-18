import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepo: NotificationRepository) {}

  async create(userId: number, typeId: number, message: string, link?: string) {
    return this.notificationRepo.createNotification(
      userId,
      typeId,
      message,
      link,
    );
  }

  async getUserNotifications(userId: number) {
    return this.notificationRepo.getUserNotifications(userId);
  }

  async markAsRead(notificationId: number) {
    return this.notificationRepo.markAsRead(notificationId);
  }

  async delete(notificationId: number) {
    return this.notificationRepo.deleteNotification(notificationId);
  }
}
