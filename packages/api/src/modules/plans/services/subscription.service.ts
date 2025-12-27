import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { PlanService } from './plan.service';
import {
  CreateSubscriptionDto,
  RenewSubscriptionDto,
  SubscriptionResponseDto,
  ActiveSubscriptionDto,
  SubscriptionQueryDto,
  PaginatedSubscriptionsDto,
} from '../dto';

const CACHE_PREFIX = 'subscription';
const CACHE_TTL = 300; // 5 minutes (shorter TTL for subscriptions)

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly planService: PlanService,
  ) {}

  async create(dto: CreateSubscriptionDto): Promise<SubscriptionResponseDto> {
    // Validate business exists
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
      include: {
        translations: true,
      },
    });

    if (!business) {
      throw new NotFoundException(
        `Business with ID "${dto.businessId}" not found`,
      );
    }

    // Validate plan exists and is active
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
      include: { translations: true },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID "${dto.planId}" not found`);
    }

    if (!plan.isActive) {
      throw new BadRequestException('Cannot subscribe to an inactive plan');
    }

    // Deactivate any existing active subscriptions for this business
    await this.prisma.subscription.updateMany({
      where: {
        businessId: dto.businessId,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Calculate dates
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscription = await this.prisma.subscription.create({
      data: {
        businessId: dto.businessId,
        planId: dto.planId,
        startDate,
        endDate,
        isActive: true,
      },
      include: {
        plan: {
          include: { translations: true },
        },
        business: {
          include: { translations: true },
        },
      },
    });

    // Invalidate cache
    await this.invalidateBusinessCache(dto.businessId);

    return this.mapToResponse(subscription, 'ar');
  }


  async findById(id: string, locale: string = 'ar'): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: {
          include: { translations: true },
        },
        business: {
          include: { translations: true },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }

    return this.mapToResponse(subscription, locale);
  }

  async findAll(
    query: SubscriptionQueryDto,
    locale: string = 'ar',
  ): Promise<PaginatedSubscriptionsDto> {
    const { businessId, isActive, isExpired, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {};

    if (businessId) {
      where.businessId = businessId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isExpired !== undefined) {
      if (isExpired) {
        where.endDate = { lt: now };
      } else {
        where.endDate = { gte: now };
      }
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        include: {
          plan: {
            include: { translations: true },
          },
          business: {
            include: { translations: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data: subscriptions.map((s) => this.mapToResponse(s, locale)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getActiveSubscription(
    businessId: string,
    locale: string = 'ar',
  ): Promise<ActiveSubscriptionDto | null> {
    const cacheKey = `${CACHE_PREFIX}:active:${businessId}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();

        // First try to find an active, non-expired subscription
        let subscription = await this.prisma.subscription.findFirst({
          where: {
            businessId,
            isActive: true,
            endDate: { gte: now },
          },
          include: {
            plan: {
              include: {
                translations: true,
                features: true,
              },
            },
          },
          orderBy: { endDate: 'desc' },
        });

        // If no active subscription, return default plan info
        if (!subscription) {
          const defaultPlan = await this.planService.getDefaultPlan(locale);
          const features = await this.planService.getPlanFeatures(defaultPlan.id);

          return {
            id: '',
            planId: defaultPlan.id,
            planSlug: defaultPlan.slug,
            planName: defaultPlan.name,
            startDate: now,
            endDate: now,
            daysRemaining: 0,
            isExpired: true,
            features,
          };
        }

        const daysRemaining = Math.max(
          0,
          Math.ceil(
            (subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );

        const features = this.parseFeatures(subscription.plan.features);

        return {
          id: subscription.id,
          planId: subscription.plan.id,
          planSlug: subscription.plan.slug,
          planName: this.getTranslatedName(subscription.plan.translations, locale),
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          daysRemaining,
          isExpired: false,
          features,
        };
      },
      CACHE_TTL,
    );
  }

  async renewSubscription(
    businessId: string,
    dto: RenewSubscriptionDto,
    locale: string = 'ar',
  ): Promise<SubscriptionResponseDto> {
    // Validate business exists
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException(
        `Business with ID "${businessId}" not found`,
      );
    }

    // Validate plan exists and is active
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
      include: { translations: true },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID "${dto.planId}" not found`);
    }

    if (!plan.isActive) {
      throw new BadRequestException('Cannot subscribe to an inactive plan');
    }

    // Get current active subscription to determine start date
    const currentSubscription = await this.prisma.subscription.findFirst({
      where: {
        businessId,
        isActive: true,
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: 'desc' },
    });

    // If there's an active subscription, start from its end date
    // Otherwise, start from now
    const startDate = currentSubscription
      ? currentSubscription.endDate
      : new Date();

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Deactivate current subscription if renewing with different plan
    if (currentSubscription && currentSubscription.planId !== dto.planId) {
      await this.prisma.subscription.update({
        where: { id: currentSubscription.id },
        data: { isActive: false },
      });
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        businessId,
        planId: dto.planId,
        startDate,
        endDate,
        isActive: true,
      },
      include: {
        plan: {
          include: { translations: true },
        },
        business: {
          include: { translations: true },
        },
      },
    });

    // Invalidate cache
    await this.invalidateBusinessCache(businessId);

    return this.mapToResponse(subscription, locale);
  }


  async cancelSubscription(id: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID "${id}" not found`);
    }

    await this.prisma.subscription.update({
      where: { id },
      data: { isActive: false },
    });

    // Invalidate cache
    await this.invalidateBusinessCache(subscription.businessId);
  }

  async hasFeatureAccess(
    businessId: string,
    featureKey: string,
  ): Promise<boolean> {
    const activeSubscription = await this.getActiveSubscription(businessId);

    if (!activeSubscription) {
      return false;
    }

    const featureValue = activeSubscription.features[featureKey];

    // If feature doesn't exist, no access
    if (featureValue === undefined) {
      return false;
    }

    // Boolean features
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }

    // Numeric features (e.g., max_images) - having a value > 0 means access
    if (typeof featureValue === 'number') {
      return featureValue > 0;
    }

    // String features - having any value means access
    return true;
  }

  async getFeatureValue(
    businessId: string,
    featureKey: string,
  ): Promise<string | number | boolean | null> {
    const activeSubscription = await this.getActiveSubscription(businessId);

    if (!activeSubscription) {
      return null;
    }

    return activeSubscription.features[featureKey] ?? null;
  }

  /**
   * Cron job to handle expired subscriptions
   * Runs every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredSubscriptions(): Promise<void> {
    this.logger.log('Running expired subscriptions check...');

    const now = new Date();

    // Find all expired but still active subscriptions
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        isActive: true,
        endDate: { lt: now },
      },
      include: {
        business: true,
      },
    });

    if (expiredSubscriptions.length === 0) {
      this.logger.log('No expired subscriptions found');
      return;
    }

    this.logger.log(
      `Found ${expiredSubscriptions.length} expired subscriptions`,
    );

    // Get default plan
    let defaultPlan;
    try {
      defaultPlan = await this.planService.getDefaultPlan();
    } catch (error) {
      this.logger.error('No default plan configured. Cannot process expired subscriptions.');
      return;
    }

    // Process each expired subscription
    for (const subscription of expiredSubscriptions) {
      try {
        // Deactivate the expired subscription
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { isActive: false },
        });

        // Create a new subscription with the default plan
        // Default plan subscriptions don't expire (set far future date)
        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 100);

        await this.prisma.subscription.create({
          data: {
            businessId: subscription.businessId,
            planId: defaultPlan.id,
            startDate: now,
            endDate: farFuture,
            isActive: true,
          },
        });

        // Invalidate cache for this business
        await this.invalidateBusinessCache(subscription.businessId);

        this.logger.log(
          `Assigned default plan to business ${subscription.businessId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process expired subscription ${subscription.id}: ${error}`,
        );
      }
    }

    this.logger.log('Expired subscriptions check completed');
  }

  /**
   * Manual trigger for expired subscriptions check
   * Can be called from admin panel
   */
  async processExpiredSubscriptions(): Promise<{ processed: number }> {
    const now = new Date();

    // Find all expired but still active subscriptions
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        isActive: true,
        endDate: { lt: now },
      },
    });

    if (expiredSubscriptions.length === 0) {
      return { processed: 0 };
    }

    // Get default plan
    const defaultPlan = await this.planService.getDefaultPlan();

    let processed = 0;

    for (const subscription of expiredSubscriptions) {
      try {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { isActive: false },
        });

        const farFuture = new Date();
        farFuture.setFullYear(farFuture.getFullYear() + 100);

        await this.prisma.subscription.create({
          data: {
            businessId: subscription.businessId,
            planId: defaultPlan.id,
            startDate: now,
            endDate: farFuture,
            isActive: true,
          },
        });

        await this.invalidateBusinessCache(subscription.businessId);
        processed++;
      } catch (error) {
        this.logger.error(
          `Failed to process expired subscription ${subscription.id}: ${error}`,
        );
      }
    }

    return { processed };
  }

  private async invalidateBusinessCache(businessId: string): Promise<void> {
    await this.cache.delPattern(`${CACHE_PREFIX}:*:${businessId}:*`);
    await this.cache.delPattern(`${CACHE_PREFIX}:active:${businessId}:*`);
  }

  private parseFeatures(
    features: { featureKey: string; featureValue: string }[],
  ): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};

    for (const feature of features) {
      const value = feature.featureValue;

      if (value === 'true' || value === 'false') {
        result[feature.featureKey] = value === 'true';
      } else if (!isNaN(Number(value))) {
        result[feature.featureKey] = Number(value);
      } else {
        result[feature.featureKey] = value;
      }
    }

    return result;
  }

  private getTranslatedName(
    translations: { locale: string; name: string }[],
    locale: string,
  ): string {
    const translation = translations.find((t) => t.locale === locale);
    if (translation) return translation.name;

    const arabicTranslation = translations.find((t) => t.locale === 'ar');
    if (arabicTranslation) return arabicTranslation.name;

    return translations[0]?.name || '';
  }

  private mapToResponse(subscription: any, locale: string): SubscriptionResponseDto {
    return {
      id: subscription.id,
      businessId: subscription.businessId,
      planId: subscription.planId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      isActive: subscription.isActive,
      createdAt: subscription.createdAt,
      plan: {
        id: subscription.plan.id,
        slug: subscription.plan.slug,
        name: this.getTranslatedName(subscription.plan.translations, locale),
        price: Number(subscription.plan.price),
        durationDays: subscription.plan.durationDays,
      },
      business: subscription.business
        ? {
            id: subscription.business.id,
            slug: subscription.business.slug,
            name: this.getBusinessName(subscription.business.translations, locale),
          }
        : undefined,
    };
  }

  private getBusinessName(
    translations: { locale: string; name: string }[],
    locale: string,
  ): string {
    const translation = translations.find((t) => t.locale === locale);
    if (translation) return translation.name;

    const arabicTranslation = translations.find((t) => t.locale === 'ar');
    if (arabicTranslation) return arabicTranslation.name;

    return translations[0]?.name || '';
  }
}
