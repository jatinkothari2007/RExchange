import { notificationRepo } from '../../data/repository';
import { Notification } from '../../types';

export class NotificationService {
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return notificationRepo.findByUser(userId);
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    return notificationRepo.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    return notificationRepo.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
