import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  SearchBusinessDto,
  BusinessSortBy,
  BusinessCardDto,
  PaginatedBusinessResult,
} from '../dto';

// Cache key prefixes
const CACHE_KEYS = {
  SEARCH: 'business:search',
  FEATURED: 'business:featured',
  BY_CATEGORY: 'business:category',
  BY_LOCATION: 'business:location',
} as const;

const CACHE_TTL = 300; // 5 minutes for search results

/**
 * Search Strategy Interface
 * Allows swapping search implementation without changing API
 */
interface SearchStrategy {
  search(params: SearchParams): Promise<SearchResult>;
}

interface SearchParams {
  query?: string;
  categoryId?: string;
  governorateId?: string;
  cityId?: string;
  districtId?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sortBy: BusinessSortBy;
  locale: string;
  limit: number;
  offset: number;
}

interface SearchResult {
  data: BusinessCardDto[];
  total: number;
}

@Injectable()
export class BusinessSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Search businesses with filters, sorting, and pagination
   */
  async search(dto: SearchBusinessDto): Promise<PaginatedBusinessResult> {
    const {
      query,
      categoryId,
      governorateId,
      cityId,
      districtId,
      lat,
      lng,
      radius,
      sortBy = BusinessSortBy.NEWEST,
      page = 1,
      limit = 20,
      locale = 'ar',
    } = dto;

    // Generate cache key
    const cacheKey = this.generateCacheKey(dto);

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const offset = (page - 1) * limit;

        // Build the search query based on sort type
        if (sortBy === BusinessSortBy.NEAREST && lat && lng) {
          return this.searchNearest(
            query,
            categoryId,
            governorateId,
            cityId,
            districtId,
            lat,
            lng,
            radius,
            locale,
            limit,
            offset,
            page,
          );
        }

        return this.searchStandard(
          query,
          categoryId,
          governorateId,
          cityId,
          districtId,
          sortBy,
          locale,
          limit,
          offset,
          page,
        );
      },
      CACHE_TTL,
    );
  }

  /**
   * Search with nearest sorting using PostGIS
   * Uses trigram for fuzzy text matching
   */
  private async searchNearest(
    query: string | undefined,
    categoryId: string | undefined,
    governorateId: string | undefined,
    cityId: string | undefined,
    districtId: string | undefined,
    lat: number,
    lng: number,
    radius: number | undefined,
    locale: string,
    limit: number,
    offset: number,
    page: number,
  ): Promise<PaginatedBusinessResult> {
    const radiusMeters = radius || 10000; // Default 10km

    // Build WHERE conditions dynamically
    let whereClause = `
      b."isActive" = true
      AND b."deletedAt" IS NULL
      AND b.location IS NOT NULL
      AND ST_DWithin(
        b.location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
    `;
    const params: any[] = [lng, lat, radiusMeters, locale];
    let paramIndex = 5;

    // Add text search condition using trigram similarity
    if (query && query.trim()) {
      const searchTerm = query.trim();
      // Use trigram similarity for fuzzy matching
      whereClause += ` AND (
        bt.name ILIKE $${paramIndex} OR
        bt.address ILIKE $${paramIndex} OR
        ct.name ILIKE $${paramIndex} OR
        b.phone ILIKE $${paramIndex} OR
        b.phone2 ILIKE $${paramIndex} OR
        b."phoneNormalized" LIKE $${paramIndex + 1}
      )`;
      params.push(`%${searchTerm}%`);
      params.push(`%${searchTerm.replace(/\D/g, '')}%`); // Normalized phone search
      paramIndex += 2;
    }

    // Add category filter
    if (categoryId) {
      whereClause += ` AND b."categoryId" = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    // Add geographic filters
    if (districtId) {
      whereClause += ` AND b."districtId" = $${paramIndex}`;
      params.push(districtId);
      paramIndex++;
    } else if (cityId) {
      whereClause += ` AND d."cityId" = $${paramIndex}`;
      params.push(cityId);
      paramIndex++;
    } else if (governorateId) {
      whereClause += ` AND ci."governorateId" = $${paramIndex}`;
      params.push(governorateId);
      paramIndex++;
    }

    // Execute search query
    const results = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        b.id,
        b.slug,
        COALESCE(bt.name, bt_ar.name, '') as name,
        COALESCE(bt.address, bt_ar.address, '') as address,
        b.lat,
        b.lng,
        b.phone,
        b.whatsapp,
        b."avgRating",
        b."reviewCount",
        b."isFeatured",
        b."isVerified",
        COALESCE(ct.name, ct_ar.name, '') as "categoryName",
        COALESCE(dt.name, dt_ar.name, '') as "districtName",
        COALESCE(cit.name, cit_ar.name, '') as "cityName",
        COALESCE(gt.name, gt_ar.name, '') as "governorateName",
        (
          SELECT bi."objectKey" FROM business_images bi 
          WHERE bi."businessId" = b.id AND bi."isPrimary" = true 
          LIMIT 1
        ) as "primaryImage",
        ST_Distance(b.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM businesses b
      LEFT JOIN business_translations bt ON bt."businessId" = b.id AND bt.locale = $4
      LEFT JOIN business_translations bt_ar ON bt_ar."businessId" = b.id AND bt_ar.locale = 'ar'
      LEFT JOIN categories c ON c.id = b."categoryId"
      LEFT JOIN category_translations ct ON ct."categoryId" = c.id AND ct.locale = $4
      LEFT JOIN category_translations ct_ar ON ct_ar."categoryId" = c.id AND ct_ar.locale = 'ar'
      LEFT JOIN districts d ON d.id = b."districtId"
      LEFT JOIN district_translations dt ON dt."districtId" = d.id AND dt.locale = $4
      LEFT JOIN district_translations dt_ar ON dt_ar."districtId" = d.id AND dt_ar.locale = 'ar'
      LEFT JOIN cities ci ON ci.id = d."cityId"
      LEFT JOIN city_translations cit ON cit."cityId" = ci.id AND cit.locale = $4
      LEFT JOIN city_translations cit_ar ON cit_ar."cityId" = ci.id AND cit_ar.locale = 'ar'
      LEFT JOIN governorates g ON g.id = ci."governorateId"
      LEFT JOIN governorate_translations gt ON gt."governorateId" = g.id AND gt.locale = $4
      LEFT JOIN governorate_translations gt_ar ON gt_ar."governorateId" = g.id AND gt_ar.locale = 'ar'
      WHERE ${whereClause}
      ORDER BY distance ASC
      LIMIT $${paramIndex}
      OFFSET $${paramIndex + 1}
    `, ...params, limit, offset);

    // Get total count
    const countParams = params.slice(0); // Copy params without limit/offset
    const countResult = await this.prisma.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(*) as count
      FROM businesses b
      LEFT JOIN business_translations bt ON bt."businessId" = b.id AND bt.locale = $4
      LEFT JOIN business_translations bt_ar ON bt_ar."businessId" = b.id AND bt_ar.locale = 'ar'
      LEFT JOIN categories c ON c.id = b."categoryId"
      LEFT JOIN category_translations ct ON ct."categoryId" = c.id AND ct.locale = $4
      LEFT JOIN districts d ON d.id = b."districtId"
      LEFT JOIN cities ci ON ci.id = d."cityId"
      WHERE ${whereClause}
    `, ...countParams);

    const total = Number(countResult[0].count);

    return {
      data: results.map((r) => this.mapToCard(r)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  /**
   * Standard search without distance sorting
   * Uses Prisma for simpler queries with trigram support
   */
  private async searchStandard(
    query: string | undefined,
    categoryId: string | undefined,
    governorateId: string | undefined,
    cityId: string | undefined,
    districtId: string | undefined,
    sortBy: BusinessSortBy,
    locale: string,
    limit: number,
    offset: number,
    page: number,
  ): Promise<PaginatedBusinessResult> {
    // Build WHERE conditions for Prisma
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    // Text search with normalized phone support
    if (query && query.trim()) {
      const searchTerm = query.trim();
      const normalizedSearch = searchTerm.replace(/\D/g, '');
      
      where.OR = [
        { translations: { some: { name: { contains: searchTerm, mode: 'insensitive' } } } },
        { translations: { some: { address: { contains: searchTerm, mode: 'insensitive' } } } },
        { category: { translations: { some: { name: { contains: searchTerm, mode: 'insensitive' } } } } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { phone2: { contains: searchTerm, mode: 'insensitive' } },
      ];
      
      // Add normalized phone search if query contains digits
      if (normalizedSearch.length > 0) {
        where.OR.push({ phoneNormalized: { contains: normalizedSearch } });
      }
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Geographic filters
    if (districtId) {
      where.districtId = districtId;
    } else if (cityId) {
      where.district = { cityId };
    } else if (governorateId) {
      where.district = { city: { governorateId } };
    }

    // Build ORDER BY
    let orderBy: any;
    switch (sortBy) {
      case BusinessSortBy.FEATURED:
        orderBy = [{ isFeatured: 'desc' }, { avgRating: 'desc' }, { createdAt: 'desc' }];
        break;
      case BusinessSortBy.RATING:
        orderBy = [{ avgRating: 'desc' }, { reviewCount: 'desc' }];
        break;
      case BusinessSortBy.NEWEST:
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute queries
    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        include: {
          translations: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          category: {
            include: { translations: true },
          },
          district: {
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
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      this.prisma.business.count({ where }),
    ]);

    return {
      data: businesses.map((b) => this.mapBusinessToCard(b, locale)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get featured businesses
   */
  async getFeatured(
    locale: string = 'ar',
    limit: number = 10,
  ): Promise<BusinessCardDto[]> {
    const cacheKey = `${CACHE_KEYS.FEATURED}:${locale}:${limit}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const businesses = await this.prisma.business.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            isFeatured: true,
          },
          include: {
            translations: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
            category: {
              include: { translations: true },
            },
            district: {
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
            },
          },
          orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
          take: limit,
        });

        return businesses.map((b) => this.mapBusinessToCard(b, locale));
      },
      CACHE_TTL,
    );
  }

  /**
   * Get businesses by category
   */
  async getByCategory(
    categoryId: string,
    locale: string = 'ar',
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedBusinessResult> {
    return this.search({
      categoryId,
      locale,
      page,
      limit,
      sortBy: BusinessSortBy.FEATURED,
    });
  }

  /**
   * Get businesses by location
   */
  async getByLocation(
    governorateId?: string,
    cityId?: string,
    districtId?: string,
    locale: string = 'ar',
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedBusinessResult> {
    return this.search({
      governorateId,
      cityId,
      districtId,
      locale,
      page,
      limit,
      sortBy: BusinessSortBy.FEATURED,
    });
  }


  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private generateCacheKey(dto: SearchBusinessDto): string {
    // Create a hash-like key for search parameters
    const parts = [
      CACHE_KEYS.SEARCH,
      dto.query?.substring(0, 20) || '_', // Truncate long queries
      dto.categoryId || '_',
      dto.governorateId || '_',
      dto.cityId || '_',
      dto.districtId || '_',
      dto.lat?.toFixed(4) || '_',
      dto.lng?.toFixed(4) || '_',
      dto.radius?.toString() || '_',
      dto.sortBy || 'newest',
      dto.page?.toString() || '1',
      dto.limit?.toString() || '20',
      dto.locale || 'ar',
    ];
    return parts.join(':');
  }

  private mapToCard(row: any): BusinessCardDto {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name || '',
      address: row.address || null,
      lat: row.lat,
      lng: row.lng,
      phone: row.phone,
      whatsapp: row.whatsapp,
      avgRating: Number(row.avgRating),
      reviewCount: row.reviewCount,
      isFeatured: row.isFeatured,
      isVerified: row.isVerified,
      categoryName: row.categoryName || '',
      districtName: row.districtName || '',
      cityName: row.cityName || '',
      governorateName: row.governorateName || '',
      primaryImage: row.primaryImage || undefined,
      distance: row.distance ? Number(row.distance) : undefined,
    };
  }

  private mapBusinessToCard(business: any, locale: string): BusinessCardDto {
    const translation = this.getTranslation(business.translations, locale);
    const categoryTranslation = business.category
      ? this.getTranslation(business.category.translations, locale)
      : null;
    const districtTranslation = business.district
      ? this.getTranslation(business.district.translations, locale)
      : null;
    const cityTranslation = business.district?.city
      ? this.getTranslation(business.district.city.translations, locale)
      : null;
    const governorateTranslation = business.district?.city?.governorate
      ? this.getTranslation(business.district.city.governorate.translations, locale)
      : null;

    return {
      id: business.id,
      slug: business.slug,
      name: translation?.name || '',
      address: translation?.address || null,
      lat: business.lat,
      lng: business.lng,
      phone: business.phone,
      whatsapp: business.whatsapp,
      avgRating: Number(business.avgRating),
      reviewCount: business.reviewCount,
      isFeatured: business.isFeatured,
      isVerified: business.isVerified,
      categoryName: categoryTranslation?.name || '',
      districtName: districtTranslation?.name || '',
      cityName: cityTranslation?.name || '',
      governorateName: governorateTranslation?.name || '',
      primaryImage: business.images?.[0]?.objectKey || undefined,
    };
  }

  private getTranslation(
    translations: { locale: string; name: string; address?: string | null }[],
    locale: string,
  ): { name: string; address?: string | null } | null {
    if (!translations) return null;

    const translation = translations.find((t) => t.locale === locale);
    if (translation) return translation;

    // Fallback to Arabic
    const arabicTranslation = translations.find((t) => t.locale === 'ar');
    if (arabicTranslation) return arabicTranslation;

    // Fallback to first available
    return translations[0] || null;
  }
}
