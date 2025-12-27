import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateNotificationDto,
  BroadcastNotificationDto,
  GetNotificationsDto,
  NotificationResponseDto,
  NotificationStatsDto,
} from '../dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a notification for a specific user
   */
  async create(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data || {},
      },
    });

    return this.mapToResponseDto(notification);
  }

  /**
   * Broadcast notifications to multiple users based on criteria
   */
  async broadcast(dto: BroadcastNotificationDto): Promise<number> {
    // Build user filter
    const userFilter: any = {
      isActive: true,
    };

    if (dto.targetRoles && dto.targetRoles.length > 0) {
      userFilter.role = { in: dto.targetRoles };
    }

    if (dto.targetUserIds && dto.targetUserIds.length > 0) {
      userFilter.id = { in: dto.targetUserIds };
    }

    // Get target users
    const users = await this.prisma.user.findMany({
      where: userFilter,
      select: { id: true },
    });

    if (users.length === 0) {
      return 0;
    }

    // Create notifications for all target users
    const notifications = users.map((user) => ({
      userId: user.id,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data || {},
    }));

    await this.prisma.notification.createMany({
      data: notifications,
    });

    return users.length;
  }

  /**
   * Get notifications for a user with pagination
   */
  async getForUser(
    userId: string,
    dto: GetNotificationsDto,
  ): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    if (dto.unreadOnly) {
      where.isRead = false;
    }

    if (dto.type) {
      where.type = dto.type;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map(this.mapToResponseDto),
      total,
      page,
      limit,
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Get notification statistics for a user
   */
  async getStats(userId: string): Promise<NotificationStatsDto> {
    const [total, unread] = await Promise.all([
      this.prisma.notification.count({
        where: { userId },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { total, unread };
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Helper: Create subscription expiry notification
   */
  async notifySubscriptionExpiry(
    userId: string,
    businessName: string,
    expiryDate: Date,
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type: NotificationType.SUBSCRIPTION_EXPIRY,
      title: 'انتهاء صلاحية الاشتراك',
      body: `اشتراكك في ${businessName} سينتهي في ${expiryDate.toLocaleDateString('ar-EG')}`,
      data: {
        businessName,
        expiryDate: expiryDate.toISOString(),
      },
    });
  }

  /**
   * Helper: Create review reply notification
   */
  async notifyReviewReply(
    userId: string,
    businessName: string,
    reviewId: string,
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type: NotificationType.REVIEW_REPLY,
      title: 'رد على تقييمك',
      body: `تلقيت رداً على تقييمك لـ ${businessName}`,
      data: {
        businessName,
        reviewId,
      },
    });
  }

  /**
   * Helper: Create report resolved notification
   */
  async notifyReportResolved(
    userId: string,
    businessName: string,
    reportType: string,
    resolution: string,
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type: NotificationType.REPORT_RESOLVED,
      title: 'تم حل البلاغ',
      body: `تم حل بلاغك عن ${businessName}`,
      data: {
        businessName,
        reportType,
        resolution,
      },
    });
  }

  /**
   * Helper: Create points earned notification
   */
  async notifyPointsEarned(
    userId: string,
    points: number,
    action: string,
  ): Promise<NotificationResponseDto> {
    return this.create({
      userId,
      type: NotificationType.POINTS_EARNED,
      title: 'حصلت على نقاط',
      body: `حصلت على ${points} نقطة من ${action}`,
      data: {
        points,
        action,
      },
    });
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, any>,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
}
