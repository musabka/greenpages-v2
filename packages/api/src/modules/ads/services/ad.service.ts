import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  CreateAdCampaignDto,
  UpdateAdCampaignDto,
  CreateAdDto,
  UpdateAdDto,
  AdContextDto,
  AdCampaignResponseDto,
  AdResponseDto,
  AdPerformanceReportDto,
  AdPlacement,
} from '../dto';

const CACHE_PREFIX = 'ad';
const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class AdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async createCampaign(dto: CreateAdCampaignDto): Promise<AdCampaignResponseDto> {
    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate business exists
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID "${dto.businessId}" not found`);
    }

    // Create campaign with ads
    const campaign = await this.prisma.adCampaign.create({
      data: {
        businessId: dto.businessId,
        budget: dto.budget,
        startDate,
        endDate,
        isActive: dto.isActive ?? true,
        ads: {
          create: dto.ads.map((ad) => ({
            placement: ad.placement,
            governorateId: ad.governorateId,
            cityId: ad.cityId,
            districtId: ad.districtId,
            categoryId: ad.categoryId,
            activeHoursStart: ad.activeHoursStart,
            activeHoursEnd: ad.activeHoursEnd,
            isActive: ad.isActive ?? true,
          })),
        },
      },
      include: {
        ads: true,
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapCampaignToResponse(campaign);
  }

  async getAllCampaigns(): Promise<AdCampaignResponseDto[]> {
    const campaigns = await this.prisma.adCampaign.findMany({
      include: {
        ads: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((c) => this.mapCampaignToResponse(c));
  }

  async getCampaignById(id: string): Promise<AdCampaignResponseDto> {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id },
      include: {
        ads: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID "${id}" not found`);
    }

    return this.mapCampaignToResponse(campaign);
  }

  async getCampaignsByBusiness(businessId: string): Promise<AdCampaignResponseDto[]> {
    const campaigns = await this.prisma.adCampaign.findMany({
      where: { businessId },
      include: {
        ads: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((c) => this.mapCampaignToResponse(c));
  }

  async updateCampaign(
    id: string,
    dto: UpdateAdCampaignDto,
  ): Promise<AdCampaignResponseDto> {
    // Check if campaign exists
    const existing = await this.prisma.adCampaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Campaign with ID "${id}" not found`);
    }

    // Validate dates if provided
    if (dto.startDate || dto.endDate) {
      const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
      const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

      if (endDate <= startDate) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    const campaign = await this.prisma.adCampaign.update({
      where: { id },
      data: {
        budget: dto.budget,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
      },
      include: {
        ads: true,
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapCampaignToResponse(campaign);
  }

  async deleteCampaign(id: string): Promise<void> {
    // Check if campaign exists
    const existing = await this.prisma.adCampaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Campaign with ID "${id}" not found`);
    }

    await this.prisma.adCampaign.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateCache();
  }

  async createAd(campaignId: string, dto: CreateAdDto): Promise<AdResponseDto> {
    // Check if campaign exists
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID "${campaignId}" not found`);
    }

    const ad = await this.prisma.ad.create({
      data: {
        campaignId,
        placement: dto.placement,
        governorateId: dto.governorateId,
        cityId: dto.cityId,
        districtId: dto.districtId,
        categoryId: dto.categoryId,
        activeHoursStart: dto.activeHoursStart,
        activeHoursEnd: dto.activeHoursEnd,
        isActive: dto.isActive ?? true,
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapAdToResponse(ad);
  }

  async updateAd(id: string, dto: UpdateAdDto): Promise<AdResponseDto> {
    // Check if ad exists
    const existing = await this.prisma.ad.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Ad with ID "${id}" not found`);
    }

    const ad = await this.prisma.ad.update({
      where: { id },
      data: {
        placement: dto.placement,
        governorateId: dto.governorateId,
        cityId: dto.cityId,
        districtId: dto.districtId,
        categoryId: dto.categoryId,
        activeHoursStart: dto.activeHoursStart,
        activeHoursEnd: dto.activeHoursEnd,
        isActive: dto.isActive,
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapAdToResponse(ad);
  }

  async deleteAd(id: string): Promise<void> {
    // Check if ad exists
    const existing = await this.prisma.ad.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Ad with ID "${id}" not found`);
    }

    await this.prisma.ad.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateCache();
  }

  async getAdsForPlacement(
    placement: AdPlacement,
    context: AdContextDto,
  ): Promise<AdResponseDto[]> {
    const cacheKey = `${CACHE_PREFIX}:placement:${placement}:${context.governorateId || 'any'}:${context.cityId || 'any'}:${context.districtId || 'any'}:${context.categoryId || 'any'}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const currentHour = now.getHours();

        // Build where clause for targeting
        const ads = await this.prisma.ad.findMany({
          where: {
            placement,
            isActive: true,
            campaign: {
              isActive: true,
              startDate: { lte: now },
              endDate: { gte: now },
            },
            // Geographic targeting (null means no targeting)
            OR: [
              { governorateId: null },
              { governorateId: context.governorateId },
            ],
            AND: [
              {
                OR: [
                  { cityId: null },
                  { cityId: context.cityId },
                ],
              },
              {
                OR: [
                  { districtId: null },
                  { districtId: context.districtId },
                ],
              },
              {
                OR: [
                  { categoryId: null },
                  { categoryId: context.categoryId },
                ],
              },
              // Time targeting
              {
                OR: [
                  { activeHoursStart: null },
                  {
                    AND: [
                      { activeHoursStart: { lte: currentHour } },
                      { activeHoursEnd: { gte: currentHour } },
                    ],
                  },
                ],
              },
            ],
          },
          include: {
            campaign: {
              include: {
                business: true,
              },
            },
          },
        });

        // Shuffle for rotation
        return this.shuffleArray(ads).map((ad) => this.mapAdToResponse(ad));
      },
      CACHE_TTL,
    );
  }

  async recordImpression(adId: string): Promise<void> {
    await this.prisma.ad.update({
      where: { id: adId },
      data: {
        impressions: { increment: 1 },
      },
    });

    // Invalidate cache for this ad's placement
    await this.invalidateCache();
  }

  async recordClick(adId: string): Promise<void> {
    await this.prisma.ad.update({
      where: { id: adId },
      data: {
        clicks: { increment: 1 },
      },
    });

    // Invalidate cache for this ad's placement
    await this.invalidateCache();
  }

  async getPerformanceReport(campaignId: string): Promise<AdPerformanceReportDto> {
    const campaign = await this.prisma.adCampaign.findUnique({
      where: { id: campaignId },
      include: {
        ads: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID "${campaignId}" not found`);
    }

    const totalImpressions = campaign.ads.reduce(
      (sum, ad) => sum + ad.impressions,
      0,
    );
    const totalClicks = campaign.ads.reduce((sum, ad) => sum + ad.clicks, 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      campaignId: campaign.id,
      businessId: campaign.businessId,
      totalImpressions,
      totalClicks,
      ctr: Number(ctr.toFixed(2)),
      budget: Number(campaign.budget),
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      adPerformance: campaign.ads.map((ad) => ({
        adId: ad.id,
        placement: ad.placement as AdPlacement,
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr:
          ad.impressions > 0
            ? Number(((ad.clicks / ad.impressions) * 100).toFixed(2))
            : 0,
      })),
    };
  }

  private async invalidateCache(): Promise<void> {
    await this.cache.delPattern(`${CACHE_PREFIX}:*`);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private mapCampaignToResponse(campaign: any): AdCampaignResponseDto {
    return {
      id: campaign.id,
      businessId: campaign.businessId,
      budget: Number(campaign.budget),
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      isActive: campaign.isActive,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
      ads: campaign.ads.map((ad: any) => this.mapAdToResponse(ad)),
    };
  }

  private mapAdToResponse(ad: any): AdResponseDto {
    return {
      id: ad.id,
      campaignId: ad.campaignId,
      placement: ad.placement,
      governorateId: ad.governorateId,
      cityId: ad.cityId,
      districtId: ad.districtId,
      categoryId: ad.categoryId,
      activeHoursStart: ad.activeHoursStart,
      activeHoursEnd: ad.activeHoursEnd,
      impressions: ad.impressions,
      clicks: ad.clicks,
      isActive: ad.isActive,
    };
  }
}
