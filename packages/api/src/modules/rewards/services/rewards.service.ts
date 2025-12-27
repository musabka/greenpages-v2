import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RewardAction } from '@prisma/client';
import {
  PointTransactionResponseDto,
  UserLevelResponseDto,
  UpdateRewardConfigDto,
  RewardConfigResponseDto,
} from '../dto';
import { NotificationService } from '../../notifications/services';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Award points to a user for a specific action
   */
  async awardPoints(
    userId: string,
    action: RewardAction,
    metadata?: Record<string, any>,
  ): Promise<PointTransactionResponseDto | null> {
    // Get the configured points for this action
    const config = await this.prisma.rewardConfig.findUnique({
      where: { action },
    });

    if (!config || !config.isActive) {
      this.logger.warn(
        `No active reward config found for action: ${action}. Skipping points award.`,
      );
      return null;
    }

    // Check for duplicate "first review of day" award
    if (action === RewardAction.FIRST_REVIEW_OF_DAY) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingAward = await this.prisma.pointTransaction.findFirst({
        where: {
          userId,
          action: RewardAction.FIRST_REVIEW_OF_DAY,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (existingAward) {
        this.logger.debug(
          `User ${userId} already received first review of day award`,
        );
        return null;
      }
    }

    // Create point transaction
    const transaction = await this.prisma.pointTransaction.create({
      data: {
        userId,
        action,
        points: config.points,
        metadata: metadata || {},
      },
    });

    // Update user's total points
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: config.points,
        },
      },
    });

    this.logger.log(
      `Awarded ${config.points} points to user ${userId} for action ${action}`,
    );

    // Send notification about points earned
    try {
      const actionDescriptions: Record<RewardAction, string> = {
        [RewardAction.SUBMIT_REVIEW]: 'تقييم نشاط',
        [RewardAction.REPORT_WRONG_PHONE]: 'الإبلاغ عن رقم خاطئ',
        [RewardAction.REPORT_CLOSED_BUSINESS]: 'الإبلاغ عن نشاط مغلق',
        [RewardAction.FIRST_REVIEW_OF_DAY]: 'أول تقييم اليوم',
        [RewardAction.VERIFIED_REPORT]: 'بلاغ موثق',
      };

      await this.notificationService.notifyPointsEarned(
        userId,
        config.points,
        actionDescriptions[action] || action,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notification for points earned: ${error}`,
      );
      // Don't fail the points award if notification fails
    }

    return transaction;
  }

  /**
   * Get user's current points balance
   */
  async getBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.points;
  }

  /**
   * Get user's point transaction history
   */
  async getHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: PointTransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.pointTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pointTransaction.count({
        where: { userId },
      }),
    ]);

    return {
      data: transactions,
      total,
      page,
      limit,
    };
  }

  /**
   * Calculate user level and badge based on total points
   */
  async getUserLevel(userId: string): Promise<UserLevelResponseDto> {
    const totalPoints = await this.getBalance(userId);

    // Level calculation: every 100 points = 1 level
    const level = Math.floor(totalPoints / 100) + 1;
    const nextLevelPoints = level * 100;

    // Badge calculation based on level
    let badge: string;
    if (level >= 50) {
      badge = 'Diamond';
    } else if (level >= 30) {
      badge = 'Platinum';
    } else if (level >= 20) {
      badge = 'Gold';
    } else if (level >= 10) {
      badge = 'Silver';
    } else {
      badge = 'Bronze';
    }

    return {
      level,
      badge,
      totalPoints,
      nextLevelPoints,
    };
  }

  /**
   * Get all reward configurations (admin)
   */
  async getAllConfigs(): Promise<RewardConfigResponseDto[]> {
    const configs = await this.prisma.rewardConfig.findMany({
      orderBy: { action: 'asc' },
    });
    
    return configs.map(config => ({
      ...config,
      description: config.description ?? undefined,
    }));
  }

  /**
   * Update reward configuration (admin)
   */
  async updateConfig(
    action: RewardAction,
    data: UpdateRewardConfigDto,
  ): Promise<RewardConfigResponseDto> {
    const config = await this.prisma.rewardConfig.upsert({
      where: { action },
      update: {
        points: data.points,
        description: data.description,
      },
      create: {
        action,
        points: data.points,
        description: data.description,
        isActive: true,
      },
    });

    this.logger.log(`Updated reward config for action ${action}: ${data.points} points`);

    return {
      ...config,
      description: config.description ?? undefined,
    };
  }

  /**
   * Toggle reward configuration active status (admin)
   */
  async toggleConfig(action: RewardAction, isActive: boolean): Promise<RewardConfigResponseDto> {
    const config = await this.prisma.rewardConfig.update({
      where: { action },
      data: { isActive },
    });

    this.logger.log(`Toggled reward config for action ${action} to ${isActive}`);

    return {
      ...config,
      description: config.description ?? undefined,
    };
  }

  /**
   * Award points for a verified report (called by admin when resolving reports)
   */
  async awardPointsForVerifiedReport(
    userId: string,
    reportMetadata?: Record<string, any>,
  ): Promise<PointTransactionResponseDto | null> {
    return this.awardPoints(
      userId,
      RewardAction.VERIFIED_REPORT,
      reportMetadata,
    );
  }

  /**
   * Check if user should receive first review of day bonus
   */
  async shouldAwardFirstReviewOfDay(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAward = await this.prisma.pointTransaction.findFirst({
      where: {
        userId,
        action: RewardAction.FIRST_REVIEW_OF_DAY,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return !existingAward;
  }

  /**
   * Award points for submitting a review (with optional first review of day bonus)
   */
  async awardPointsForReview(
    userId: string,
    reviewMetadata?: Record<string, any>,
  ): Promise<{
    reviewPoints: PointTransactionResponseDto | null;
    bonusPoints: PointTransactionResponseDto | null;
  }> {
    // Award regular review points
    const reviewPoints = await this.awardPoints(
      userId,
      RewardAction.SUBMIT_REVIEW,
      reviewMetadata,
    );

    // Check and award first review of day bonus
    let bonusPoints: PointTransactionResponseDto | null = null;
    const shouldAwardBonus = await this.shouldAwardFirstReviewOfDay(userId);
    if (shouldAwardBonus) {
      bonusPoints = await this.awardPoints(
        userId,
        RewardAction.FIRST_REVIEW_OF_DAY,
        reviewMetadata,
      );
    }

    return { reviewPoints, bonusPoints };
  }

  /**
   * Initialize default reward configurations if they don't exist
   */
  async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs = [
      { action: RewardAction.SUBMIT_REVIEW, points: 10, description: 'Points for submitting a review' },
      { action: RewardAction.REPORT_WRONG_PHONE, points: 5, description: 'Points for reporting wrong phone number' },
      { action: RewardAction.REPORT_CLOSED_BUSINESS, points: 5, description: 'Points for reporting closed business' },
      { action: RewardAction.FIRST_REVIEW_OF_DAY, points: 20, description: 'Bonus points for first review of the day' },
      { action: RewardAction.VERIFIED_REPORT, points: 15, description: 'Points awarded after admin verifies report' },
    ];

    for (const config of defaultConfigs) {
      await this.prisma.rewardConfig.upsert({
        where: { action: config.action },
        update: {},
        create: config,
      });
    }

    this.logger.log('Initialized default reward configurations');
  }
}
