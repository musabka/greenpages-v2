import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from '../services';
import {
  CreateNotificationDto,
  BroadcastNotificationDto,
  GetNotificationsDto,
  MarkAsReadDto,
  NotificationResponseDto,
  NotificationStatsDto,
} from '../dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get current user's notifications
   * GET /notifications
   */
  @Get()
  async getMyNotifications(
    @CurrentUser('id') userId: string,
    @Query() dto: GetNotificationsDto,
  ): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.notificationService.getForUser(userId, dto);
  }

  /**
   * Get notification statistics for current user
   * GET /notifications/stats
   */
  @Get('stats')
  async getMyStats(
    @CurrentUser('id') userId: string,
  ): Promise<NotificationStatsDto> {
    return this.notificationService.getStats(userId);
  }

  /**
   * Mark a notification as read
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  async markAllAsRead(
    @CurrentUser('id') userId: string,
  ): Promise<{ count: number }> {
    const count = await this.notificationService.markAllAsRead(userId);
    return { count };
  }

  /**
   * Delete a notification
   * DELETE /notifications/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') notificationId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.notificationService.delete(notificationId, userId);
    return { message: 'Notification deleted successfully' };
  }

  /**
   * Create a notification (Admin only)
   * POST /notifications
   */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.create(dto);
  }

  /**
   * Broadcast notifications to user segments (Admin only)
   * POST /notifications/broadcast
   */
  @Post('broadcast')
  @Roles(UserRole.ADMIN)
  async broadcast(
    @Body() dto: BroadcastNotificationDto,
  ): Promise<{ count: number; message: string }> {
    const count = await this.notificationService.broadcast(dto);
    return {
      count,
      message: `Notification sent to ${count} users`,
    };
  }
}
