import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  PlanResponseDto,
  PlanListResponseDto,
  PlanFeatureKey,
} from '../dto';

const CACHE_PREFIX = 'plan';
const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class PlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreatePlanDto): Promise<PlanResponseDto> {
    // Check for duplicate slug
    const existing = await this.prisma.plan.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Plan with slug "${dto.slug}" already exists`,
      );
    }

    // If this plan is set as default, unset other default plans
    if (dto.isDefault) {
      await this.unsetOtherDefaultPlans();
    }

    const plan = await this.prisma.plan.create({
      data: {
        slug: dto.slug,
        price: dto.price,
        durationDays: dto.durationDays,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        translations: {
          create: dto.translations.map((t) => ({
            locale: t.locale,
            name: t.name,
            description: t.description,
          })),
        },
        features: dto.features
          ? {
              create: dto.features.map((f) => ({
                featureKey: f.featureKey,
                featureValue: f.featureValue,
              })),
            }
          : undefined,
      },
      include: {
        translations: true,
        features: true,
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapToResponse(plan, 'ar');
  }

  async findAll(
    locale: string = 'ar',
    isActive?: boolean,
  ): Promise<PlanListResponseDto[]> {
    const cacheKey = `${CACHE_PREFIX}:all:${locale}:${isActive ?? 'all'}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const plans = await this.prisma.plan.findMany({
          where: {
            ...(isActive !== undefined && { isActive }),
          },
          include: {
            translations: true,
            features: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
        });

        return plans.map((p) => this.mapToListResponse(p, locale));
      },
      CACHE_TTL,
    );
  }


  async findById(id: string, locale: string = 'ar'): Promise<PlanResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:${id}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const plan = await this.prisma.plan.findUnique({
          where: { id },
          include: {
            translations: true,
            features: true,
          },
        });

        if (!plan) {
          throw new NotFoundException(`Plan with ID "${id}" not found`);
        }

        return this.mapToResponse(plan, locale);
      },
      CACHE_TTL,
    );
  }

  async findBySlug(slug: string, locale: string = 'ar'): Promise<PlanResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:slug:${slug}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const plan = await this.prisma.plan.findUnique({
          where: { slug },
          include: {
            translations: true,
            features: true,
          },
        });

        if (!plan) {
          throw new NotFoundException(`Plan with slug "${slug}" not found`);
        }

        return this.mapToResponse(plan, locale);
      },
      CACHE_TTL,
    );
  }

  async getDefaultPlan(locale: string = 'ar'): Promise<PlanResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:default:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const plan = await this.prisma.plan.findFirst({
          where: { isDefault: true, isActive: true },
          include: {
            translations: true,
            features: true,
          },
        });

        if (!plan) {
          throw new NotFoundException('No default plan configured');
        }

        return this.mapToResponse(plan, locale);
      },
      CACHE_TTL,
    );
  }

  async getActivePlans(locale: string = 'ar'): Promise<PlanResponseDto[]> {
    const cacheKey = `${CACHE_PREFIX}:active:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const plans = await this.prisma.plan.findMany({
          where: { isActive: true },
          include: {
            translations: true,
            features: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
        });

        return plans.map((p) => this.mapToResponse(p, locale));
      },
      CACHE_TTL,
    );
  }

  async update(id: string, dto: UpdatePlanDto): Promise<PlanResponseDto> {
    // Check if plan exists
    const existing = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }

    // Check for duplicate slug if updating
    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.plan.findUnique({
        where: { slug: dto.slug },
      });
      if (slugExists) {
        throw new ConflictException(
          `Plan with slug "${dto.slug}" already exists`,
        );
      }
    }

    // If setting this plan as default, unset other default plans
    if (dto.isDefault === true && !existing.isDefault) {
      await this.unsetOtherDefaultPlans(id);
    }

    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        slug: dto.slug,
        price: dto.price,
        durationDays: dto.durationDays,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
        translations: dto.translations
          ? {
              deleteMany: {},
              create: dto.translations.map((t) => ({
                locale: t.locale,
                name: t.name,
                description: t.description,
              })),
            }
          : undefined,
        features: dto.features
          ? {
              deleteMany: {},
              create: dto.features.map((f) => ({
                featureKey: f.featureKey,
                featureValue: f.featureValue,
              })),
            }
          : undefined,
      },
      include: {
        translations: true,
        features: true,
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapToResponse(plan, 'ar');
  }


  async delete(id: string): Promise<void> {
    // Check if plan exists
    const existing = await this.prisma.plan.findUnique({
      where: { id },
      include: { subscriptions: { take: 1 } },
    });

    if (!existing) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }

    // Check for active subscriptions
    if (existing.subscriptions.length > 0) {
      throw new ConflictException(
        'Cannot delete plan with existing subscriptions. Deactivate the plan instead.',
      );
    }

    // Prevent deleting the default plan
    if (existing.isDefault) {
      throw new BadRequestException(
        'Cannot delete the default plan. Set another plan as default first.',
      );
    }

    await this.prisma.plan.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateCache();
  }

  async setAsDefault(id: string): Promise<PlanResponseDto> {
    // Check if plan exists
    const existing = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }

    if (!existing.isActive) {
      throw new BadRequestException(
        'Cannot set an inactive plan as default',
      );
    }

    // Unset other default plans and set this one
    await this.unsetOtherDefaultPlans(id);

    const plan = await this.prisma.plan.update({
      where: { id },
      data: { isDefault: true },
      include: {
        translations: true,
        features: true,
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapToResponse(plan, 'ar');
  }

  async getPlanFeatures(planId: string): Promise<Record<string, string | number | boolean>> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: { features: true },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID "${planId}" not found`);
    }

    return this.parseFeatures(plan.features);
  }

  private async unsetOtherDefaultPlans(excludeId?: string): Promise<void> {
    await this.prisma.plan.updateMany({
      where: {
        isDefault: true,
        ...(excludeId && { id: { not: excludeId } }),
      },
      data: { isDefault: false },
    });
  }

  private async invalidateCache(): Promise<void> {
    await this.cache.delPattern(`${CACHE_PREFIX}:*`);
  }

  private parseFeatures(
    features: { featureKey: string; featureValue: string }[],
  ): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};

    for (const feature of features) {
      const value = feature.featureValue;

      // Try to parse as boolean
      if (value === 'true' || value === 'false') {
        result[feature.featureKey] = value === 'true';
      }
      // Try to parse as number
      else if (!isNaN(Number(value))) {
        result[feature.featureKey] = Number(value);
      }
      // Keep as string
      else {
        result[feature.featureKey] = value;
      }
    }

    return result;
  }

  private mapToResponse(plan: any, locale: string): PlanResponseDto {
    return {
      id: plan.id,
      slug: plan.slug,
      price: Number(plan.price),
      durationDays: plan.durationDays,
      isDefault: plan.isDefault,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      name: this.getTranslatedName(plan.translations, locale),
      description: this.getTranslatedDescription(plan.translations, locale),
      translations: plan.translations.map(
        (t: { locale: string; name: string; description: string | null }) => ({
          locale: t.locale,
          name: t.name,
          description: t.description,
        }),
      ),
      features: plan.features.map(
        (f: { featureKey: string; featureValue: string }) => ({
          featureKey: f.featureKey,
          featureValue: f.featureValue,
        }),
      ),
    };
  }

  private mapToListResponse(plan: any, locale: string): PlanListResponseDto {
    return {
      id: plan.id,
      slug: plan.slug,
      price: Number(plan.price),
      durationDays: plan.durationDays,
      isDefault: plan.isDefault,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      name: this.getTranslatedName(plan.translations, locale),
      description: this.getTranslatedDescription(plan.translations, locale),
      featureCount: plan.features.length,
    };
  }

  private getTranslatedName(
    translations: { locale: string; name: string }[],
    locale: string,
  ): string {
    const translation = translations.find((t) => t.locale === locale);
    if (translation) return translation.name;

    // Fallback to Arabic
    const arabicTranslation = translations.find((t) => t.locale === 'ar');
    if (arabicTranslation) return arabicTranslation.name;

    // Fallback to first available
    return translations[0]?.name || '';
  }

  private getTranslatedDescription(
    translations: { locale: string; description: string | null }[],
    locale: string,
  ): string | null {
    const translation = translations.find((t) => t.locale === locale);
    if (translation) return translation.description;

    // Fallback to Arabic
    const arabicTranslation = translations.find((t) => t.locale === 'ar');
    if (arabicTranslation) return arabicTranslation.description;

    // Fallback to first available
    return translations[0]?.description || null;
  }
}
