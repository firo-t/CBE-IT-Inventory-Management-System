import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueryDto } from './dto/notification.dto';

export interface CreateNotificationParams {
  user_id: string;
  title: string;
  message: string;
  type?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Intended for internal use by other services inside transactions
  async createNotification(tx: any, params: CreateNotificationParams) {
    const db = tx || this.prisma;
    return db.notification.create({
      data: {
        user_id: params.user_id,
        title: params.title,
        message: params.message,
        type: params.type,
      },
    });
  }

  async findAllForUser(userId: string, query: NotificationQueryDto) {
    const where: any = { user_id: userId };

    if (query.unread === 'true') {
      where.is_read = false;
    }
    if (query.type) {
      where.type = query.type;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { notification_id: id },
    });

    if (!notification || notification.user_id !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { notification_id: id },
      data: { is_read: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: { is_read: true },
    });

    return { message: 'All notifications marked as read' };
  }
}
