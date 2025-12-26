import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';

const CACHE_PREFIX = 'geo:stats';
const CACHE_TTL = 3600; // 1 hour - stats are updated by triggers

export interface GeoStatsResult {
  entityType: string;
  entityId: string;
  companyCount: number;
  activeCompanyCount: number;
  featuredCompanyCount: number;
  verifiedCompanyCount: number;
  avgRating: number;
  totalReviews: number;
  lastUpdated: Date;
}

export interface GovernorateStatsResult extends GeoStatsResult {
  governorate: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface CityStatsResult extends GeoStatsResult {
  city: {
    id: string;
    slug: string;
    name: string;
  };
  governorate: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface DistrictStatsResult extends GeoStatsResult {
  district: {
    id: string;
    slug: string;
    name: string;
  };
  city: {
    id: string;
    slug: string;
    name: string;
  };
  governorate: {
    id: string;
    slug: string;
    name: string;
  };
}

/**
 * GeoStatsService
 * 
 * Provides read-optimized access to precomputed geographic statistics.
 * Stats are automatically updated via database triggers when businesses change.
 * 
 * Refresh Strategy:
 * - Real-time: Triggers update stats on business INSERT/UPDATE/DELETE
 * - Manual: Call refreshAllStats() for full refresh (admin endpoint)
 * - Scheduled: Optional pg_cron job for periodic integrity checks
 * 
 * Performance:
 * - No COUNT queries - reads from precomputed geo_stats table
 * - Redis caching for frequently accessed stats
 * - Indexed for fast sorting and filtering
 */
@Injectable()
export class GeoStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Get statistics for a specific governorate
   */
  async getGovernorateStats(
    governorateId: string,
    locale: string = 'ar',
  ): Promise<GovernorateStatsResult> {
    const cacheKey = `${CACHE_PREFIX}:governorate:${governorateId}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const stats = await this.prisma.geoStats.findUnique({
          where: {
            entityType_entityId: {
              entityType: 'governorate',
              entityId: governorateId,
            },
          },
        });

        if (!stats) {
          throw new NotFoundException(
            `Stats for governorate "${governorateId}" not found`,
          );
        }

        const governorate = await this.prisma.governorate.findUnique({
          where: { id: governorateId },
          include: { translations: true },
        });

        if (!governorate) {
          throw new NotFoundException(
            `Governorate "${governorateId}" not found`,
          );
        }

        return {
          entityType: stats.entityType,
          entityId: stats.entityId,
          companyCount: stats.companyCount,
          activeCompanyCount: stats.activeCompanyCount,
          featuredCompanyCount: stats.featuredCompanyCount,
          verifiedCompanyCount: stats.verifiedCompanyCount,
          avgRating: Number(stats.avgRating),
          totalReviews: stats.totalReviews,
          lastUpdated: stats.lastUpdated,
          governorate: {
            id: governorate.id,
            slug: governorate.slug,
            name: this.getTranslatedName(governorate.translations, locale),
          },
        };
      },
      CACHE_TTL,
    );
  }

  /**
   * Get statistics for a specific city
   */
  async getCityStats(
    cityId: string,
    locale: string = 'ar',
  ): Promise<CityStatsResult> {
    const cacheKey = `${CACHE_PREFIX}:city:${cityId}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const stats = await this.prisma.geoStats.findUnique({
          where: {
            entityType_entityId: {
              entityType: 'city',
              entityId: cityId,
            },
          },
        });

        if (!stats) {
          throw new NotFoundException(`Stats for city "${cityId}" not found`);
        }

        const city = await this.prisma.city.findUnique({
          where: { id: cityId },
          include: {
            translations: true,
            governorate: {
              include: { translations: true },
            },
          },
        });

        if (!city) {
          throw new NotFoundException(`City "${cityId}" not found`);
        }

        return {
          entityType: stats.entityType,
          entityId: stats.entityId,
          companyCount: stats.companyCount,
          activeCompanyCount: stats.activeCompanyCount,
          featuredCompanyCount: stats.featuredCompanyCount,
          verifiedCompanyCount: stats.verifiedCompanyCount,
          avgRating: Number(stats.avgRating),
          totalReviews: stats.totalReviews,
          lastUpdated: stats.lastUpdated,
          city: {
            id: city.id,
            slug: city.slug,
            name: this.getTranslatedName(city.translations, locale),
          },
          governorate: {
            id: city.governorate.id,
            slug: city.governorate.slug,
            name: this.getTranslatedName(city.governorate.translations, locale),
          },
        };
      },
      CACHE_TTL,
    );
  }

  /**
   * Get statistics for a specific district
   */
  async getDistrictStats(
    districtId: string,
    locale: string = 'ar',
  ): Promise<DistrictStatsResult> {
    const cacheKey = `${CACHE_PREFIX}:district:${districtId}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const stats = await this.prisma.geoStats.findUnique({
          where: {
            entityType_entityId: {
              entityType: 'district',
              entityId: districtId,
            },
          },
        });

        if (!stats) {
          throw new NotFoundException(
            `Stats for district "${districtId}" not found`,
          );
        }

        const district = await this.prisma.district.findUnique({
          where: { id: districtId },
          include: {
            translations: true,
            city: {
              include: {
                translations: true,
                governorate: {
                  include: { translations: true },
                },
              },
            },
          },
        });

        if (!district) {
          throw new NotFoundException(`District "${districtId}" not found`);
        }

        return {
          entityType: stats.entityType,
          entityId: stats.entityId,
          companyCount: stats.companyCount,
          activeCompanyCount: stats.activeCompanyCount,
          featuredCompanyCount: stats.featuredCompanyCount,
          verifiedCompanyCount: stats.verifiedCompanyCount,
          avgRating: Number(stats.avgRating),
          totalReviews: stats.totalReviews,
          lastUpdated: stats.lastUpdated,
          district: {
            id: district.id,
            slug: district.slug,
            name: this.getTranslatedName(district.translations, locale),
          },
          city: {
            id: district.city.id,
            slug: district.city.slug,
            name: this.getTranslatedName(district.city.translations, locale),
          },
          governorate: {
            id: district.city.governorate.id,
            slug: district.city.governorate.slug,
            name: this.getTranslatedName(
              district.city.governorate.translations,
              locale,
            ),
          },
        };
      },
      CACHE_TTL,
    );
  }

  /**
   * Get top governorates by active company count
   */
  async getTopGovernorates(
    limit: number = 10,
    locale: string = 'ar',
  ): Promise<GovernorateStatsResult[]> {
    const cacheKey = `${CACHE_PREFIX}:top:governorates:${limit}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const stats = await this.prisma.geoStats.findMany({
          where: { entityType: 'governorate' },
          orderBy: { activeCompanyCount: 'desc' },
          take: limit,
        });

        const governorateIds = stats.map((s: { entityId: string }) => s.entityId);
        const governorates = await this.prisma.governorate.findMany({
          where: { id: { in: governorateIds } },
          include: { translations: true },
        });

        const governorateMap = new Map(governorates.map((g: any) => [g.id, g]));

        return stats.map((s: any) => {
          const governorate = governorateMap.get(s.entityId)!;
          return {
            entityType: s.entityType,
            entityId: s.entityId,
            companyCount: s.companyCount,
            activeCompanyCount: s.activeCompanyCount,
            featuredCompanyCount: s.featuredCompanyCount,
            verifiedCompanyCount: s.verifiedCompanyCount,
            avgRating: Number(s.avgRating),
            totalReviews: s.totalReviews,
            lastUpdated: s.lastUpdated,
            governorate: {
              id: governorate.id,
              slug: governorate.slug,
              name: this.getTranslatedName(governorate.translations, locale),
            },
          };
        });
      },
      CACHE_TTL,
    );
  }

  /**
   * Get top cities by active company count
   */
  async getTopCities(
    limit: number = 10,
    locale: string = 'ar',
    governorateId?: string,
  ): Promise<CityStatsResult[]> {
    const cacheKey = `${CACHE_PREFIX}:top:cities:${limit}:${locale}:${governorateId ?? 'all'}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        let cityIds: string[];

        if (governorateId) {
          // Filter by governorate
          const cities = await this.prisma.city.findMany({
            where: { governorateId },
            select: { id: true },
          });
          cityIds = cities.map((c) => c.id);
        }

        const stats = await this.prisma.geoStats.findMany({
          where: {
            entityType: 'city',
            ...(governorateId && { entityId: { in: cityIds! } }),
          },
          orderBy: { activeCompanyCount: 'desc' },
          take: limit,
        });

        const statsCityIds = stats.map((s: any) => s.entityId);
        const cities = await this.prisma.city.findMany({
          where: { id: { in: statsCityIds } },
          include: {
            translations: true,
            governorate: {
              include: { translations: true },
            },
          },
        });

        const cityMap = new Map(cities.map((c: any) => [c.id, c]));

        return stats.map((s: any) => {
          const city = cityMap.get(s.entityId)!;
          return {
            entityType: s.entityType,
            entityId: s.entityId,
            companyCount: s.companyCount,
            activeCompanyCount: s.activeCompanyCount,
            featuredCompanyCount: s.featuredCompanyCount,
            verifiedCompanyCount: s.verifiedCompanyCount,
            avgRating: Number(s.avgRating),
            totalReviews: s.totalReviews,
            lastUpdated: s.lastUpdated,
            city: {
              id: city.id,
              slug: city.slug,
              name: this.getTranslatedName(city.translations, locale),
            },
            governorate: {
              id: city.governorate.id,
              slug: city.governorate.slug,
              name: this.getTranslatedName(
                city.governorate.translations,
                locale,
              ),
            },
          };
        });
      },
      CACHE_TTL,
    );
  }

  /**
   * Get top districts by active company count
   */
  async getTopDistricts(
    limit: number = 10,
    locale: string = 'ar',
    cityId?: string,
  ): Promise<DistrictStatsResult[]> {
    const cacheKey = `${CACHE_PREFIX}:top:districts:${limit}:${locale}:${cityId ?? 'all'}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        let districtIds: string[];

        if (cityId) {
          // Filter by city
          const districts = await this.prisma.district.findMany({
            where: { cityId },
            select: { id: true },
          });
          districtIds = districts.map((d) => d.id);
        }

        const stats = await this.prisma.geoStats.findMany({
          where: {
            entityType: 'district',
            ...(cityId && { entityId: { in: districtIds! } }),
          },
          orderBy: { activeCompanyCount: 'desc' },
          take: limit,
        });

        const statsDistrictIds = stats.map((s: any) => s.entityId);
        const districts = await this.prisma.district.findMany({
          where: { id: { in: statsDistrictIds } },
          include: {
            translations: true,
            city: {
              include: {
                translations: true,
                governorate: {
                  include: { translations: true },
                },
              },
            },
          },
        });

        const districtMap = new Map(districts.map((d: any) => [d.id, d]));

        return stats.map((s: any) => {
          const district = districtMap.get(s.entityId)!;
          return {
            entityType: s.entityType,
            entityId: s.entityId,
            companyCount: s.companyCount,
            activeCompanyCount: s.activeCompanyCount,
            featuredCompanyCount: s.featuredCompanyCount,
            verifiedCompanyCount: s.verifiedCompanyCount,
            avgRating: Number(s.avgRating),
            totalReviews: s.totalReviews,
            lastUpdated: s.lastUpdated,
            district: {
              id: district.id,
              slug: district.slug,
              name: this.getTranslatedName(district.translations, locale),
            },
            city: {
              id: district.city.id,
              slug: district.city.slug,
              name: this.getTranslatedName(district.city.translations, locale),
            },
            governorate: {
              id: district.city.governorate.id,
              slug: district.city.governorate.slug,
              name: this.getTranslatedName(
                district.city.governorate.translations,
                locale,
              ),
            },
          };
        });
      },
      CACHE_TTL,
    );
  }

  /**
   * Manually refresh all geographic statistics
   * Use this for initial population or periodic integrity checks
   * Normally, stats are updated automatically via triggers
   */
  async refreshAllStats(): Promise<{ message: string; timestamp: Date }> {
    await this.prisma.$executeRaw`SELECT refresh_all_geo_stats()`;

    // Clear all stats cache
    await this.cache.delPattern(`${CACHE_PREFIX}:*`);

    return {
      message: 'All geographic statistics refreshed successfully',
      timestamp: new Date(),
    };
  }

  /**
   * Refresh stats for a specific governorate
   */
  async refreshGovernorateStats(governorateId: string): Promise<void> {
    await this.prisma.$executeRaw`SELECT update_governorate_stats(${governorateId})`;
    await this.cache.delPattern(`${CACHE_PREFIX}:governorate:${governorateId}:*`);
    await this.cache.delPattern(`${CACHE_PREFIX}:top:*`);
  }

  /**
   * Refresh stats for a specific city
   */
  async refreshCityStats(cityId: string): Promise<void> {
    await this.prisma.$executeRaw`SELECT update_city_stats(${cityId})`;
    await this.cache.delPattern(`${CACHE_PREFIX}:city:${cityId}:*`);
    await this.cache.delPattern(`${CACHE_PREFIX}:top:*`);
  }

  /**
   * Refresh stats for a specific district
   */
  async refreshDistrictStats(districtId: string): Promise<void> {
    await this.prisma.$executeRaw`SELECT update_district_stats(${districtId})`;
    await this.cache.delPattern(`${CACHE_PREFIX}:district:${districtId}:*`);
    await this.cache.delPattern(`${CACHE_PREFIX}:top:*`);
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
}
