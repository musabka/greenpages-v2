import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';

const CACHE_PREFIX = 'geo:query';
const CACHE_TTL = 300; // 5 minutes for query results

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface NearbyBusinessResult {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  distance: number; // in meters
  categoryId: string;
  categoryName: string;
  districtId: string;
  districtName: string;
  cityName: string;
  governorateName: string;
  avgRating: number;
  reviewCount: number;
  phone: string | null;
  whatsapp: string | null;
}

export interface GeoHierarchy {
  governorates: {
    id: string;
    slug: string;
    name: string;
    lat: number | null;
    lng: number | null;
    cities: {
      id: string;
      slug: string;
      name: string;
      lat: number | null;
      lng: number | null;
      districts: {
        id: string;
        slug: string;
        name: string;
        lat: number | null;
        lng: number | null;
      }[];
    }[];
  }[];
}

@Injectable()
export class GeoQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Find businesses within a radius from a point
   * Uses PostGIS ST_DWithin for efficient spatial queries
   */
  async findNearestBusinesses(
    lat: number,
    lng: number,
    radiusMeters: number,
    locale: string = 'ar',
    limit: number = 50,
    offset: number = 0,
  ): Promise<NearbyBusinessResult[]> {
    const cacheKey = `${CACHE_PREFIX}:nearest:${lat}:${lng}:${radiusMeters}:${locale}:${limit}:${offset}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const results = await this.prisma.$queryRaw<NearbyBusinessResult[]>`
          SELECT 
            b.id,
            b.slug,
            COALESCE(bt.name, bt_ar.name, '') as name,
            b.lat,
            b.lng,
            ST_Distance(b.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) as distance,
            b."categoryId",
            COALESCE(ct.name, ct_ar.name, '') as "categoryName",
            b."districtId",
            COALESCE(dt.name, dt_ar.name, '') as "districtName",
            COALESCE(cit.name, cit_ar.name, '') as "cityName",
            COALESCE(gt.name, gt_ar.name, '') as "governorateName",
            b."avgRating",
            b."reviewCount",
            b.phone,
            b.whatsapp
          FROM businesses b
          LEFT JOIN business_translations bt ON bt."businessId" = b.id AND bt.locale = ${locale}
          LEFT JOIN business_translations bt_ar ON bt_ar."businessId" = b.id AND bt_ar.locale = 'ar'
          LEFT JOIN categories c ON c.id = b."categoryId"
          LEFT JOIN category_translations ct ON ct."categoryId" = c.id AND ct.locale = ${locale}
          LEFT JOIN category_translations ct_ar ON ct_ar."categoryId" = c.id AND ct_ar.locale = 'ar'
          LEFT JOIN districts d ON d.id = b."districtId"
          LEFT JOIN district_translations dt ON dt."districtId" = d.id AND dt.locale = ${locale}
          LEFT JOIN district_translations dt_ar ON dt_ar."districtId" = d.id AND dt_ar.locale = 'ar'
          LEFT JOIN cities ci ON ci.id = d."cityId"
          LEFT JOIN city_translations cit ON cit."cityId" = ci.id AND cit.locale = ${locale}
          LEFT JOIN city_translations cit_ar ON cit_ar."cityId" = ci.id AND cit_ar.locale = 'ar'
          LEFT JOIN governorates g ON g.id = ci."governorateId"
          LEFT JOIN governorate_translations gt ON gt."governorateId" = g.id AND gt.locale = ${locale}
          LEFT JOIN governorate_translations gt_ar ON gt_ar."governorateId" = g.id AND gt_ar.locale = 'ar'
          WHERE b."isActive" = true
            AND b."deletedAt" IS NULL
            AND b.location IS NOT NULL
            AND ST_DWithin(
              b.location,
              ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
              ${radiusMeters}
            )
          ORDER BY distance ASC
          LIMIT ${limit}
          OFFSET ${offset}
        `;

        return results.map((r) => ({
          ...r,
          distance: Number(r.distance),
          avgRating: Number(r.avgRating),
        }));
      },
      CACHE_TTL,
    );
  }

  /**
   * Find businesses within a bounding box (for map display)
   * Uses PostGIS ST_Within for efficient spatial queries
   */
  async findWithinBoundingBox(
    bounds: BoundingBox,
    locale: string = 'ar',
    limit: number = 100,
  ): Promise<NearbyBusinessResult[]> {
    const cacheKey = `${CACHE_PREFIX}:bbox:${bounds.north}:${bounds.south}:${bounds.east}:${bounds.west}:${locale}:${limit}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const results = await this.prisma.$queryRaw<NearbyBusinessResult[]>`
          SELECT 
            b.id,
            b.slug,
            COALESCE(bt.name, bt_ar.name, '') as name,
            b.lat,
            b.lng,
            0 as distance,
            b."categoryId",
            COALESCE(ct.name, ct_ar.name, '') as "categoryName",
            b."districtId",
            COALESCE(dt.name, dt_ar.name, '') as "districtName",
            COALESCE(cit.name, cit_ar.name, '') as "cityName",
            COALESCE(gt.name, gt_ar.name, '') as "governorateName",
            b."avgRating",
            b."reviewCount",
            b.phone,
            b.whatsapp
          FROM businesses b
          LEFT JOIN business_translations bt ON bt."businessId" = b.id AND bt.locale = ${locale}
          LEFT JOIN business_translations bt_ar ON bt_ar."businessId" = b.id AND bt_ar.locale = 'ar'
          LEFT JOIN categories c ON c.id = b."categoryId"
          LEFT JOIN category_translations ct ON ct."categoryId" = c.id AND ct.locale = ${locale}
          LEFT JOIN category_translations ct_ar ON ct_ar."categoryId" = c.id AND ct_ar.locale = 'ar'
          LEFT JOIN districts d ON d.id = b."districtId"
          LEFT JOIN district_translations dt ON dt."districtId" = d.id AND dt.locale = ${locale}
          LEFT JOIN district_translations dt_ar ON dt_ar."districtId" = d.id AND dt_ar.locale = 'ar'
          LEFT JOIN cities ci ON ci.id = d."cityId"
          LEFT JOIN city_translations cit ON cit."cityId" = ci.id AND cit.locale = ${locale}
          LEFT JOIN city_translations cit_ar ON cit_ar."cityId" = ci.id AND cit_ar.locale = 'ar'
          LEFT JOIN governorates g ON g.id = ci."governorateId"
          LEFT JOIN governorate_translations gt ON gt."governorateId" = g.id AND gt.locale = ${locale}
          LEFT JOIN governorate_translations gt_ar ON gt_ar."governorateId" = g.id AND gt_ar.locale = 'ar'
          WHERE b."isActive" = true
            AND b."deletedAt" IS NULL
            AND b.lat >= ${bounds.south}
            AND b.lat <= ${bounds.north}
            AND b.lng >= ${bounds.west}
            AND b.lng <= ${bounds.east}
          LIMIT ${limit}
        `;

        return results.map((r) => ({
          ...r,
          distance: 0,
          avgRating: Number(r.avgRating),
        }));
      },
      CACHE_TTL,
    );
  }

  /**
   * Get full geographic hierarchy tree
   */
  async getHierarchy(locale: string = 'ar'): Promise<GeoHierarchy> {
    const cacheKey = `${CACHE_PREFIX}:hierarchy:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const governorates = await this.prisma.governorate.findMany({
          where: { isActive: true },
          include: {
            translations: true,
            cities: {
              where: { isActive: true },
              include: {
                translations: true,
                districts: {
                  where: { isActive: true },
                  include: {
                    translations: true,
                  },
                  orderBy: { slug: 'asc' },
                },
              },
              orderBy: { slug: 'asc' },
            },
          },
          orderBy: { slug: 'asc' },
        });

        return {
          governorates: governorates.map((g) => ({
            id: g.id,
            slug: g.slug,
            name: this.getTranslatedName(g.translations, locale),
            lat: g.lat,
            lng: g.lng,
            cities: g.cities.map((c) => ({
              id: c.id,
              slug: c.slug,
              name: this.getTranslatedName(c.translations, locale),
              lat: c.lat,
              lng: c.lng,
              districts: c.districts.map((d) => ({
                id: d.id,
                slug: d.slug,
                name: this.getTranslatedName(d.translations, locale),
                lat: d.lat,
                lng: d.lng,
              })),
            })),
          })),
        };
      },
      CACHE_TTL * 12, // Cache hierarchy for 1 hour
    );
  }

  /**
   * Get hierarchy path for a district (district -> city -> governorate)
   */
  async getHierarchyPath(
    districtId: string,
    locale: string = 'ar',
  ): Promise<{
    governorate: { id: string; slug: string; name: string };
    city: { id: string; slug: string; name: string };
    district: { id: string; slug: string; name: string };
  } | null> {
    const cacheKey = `${CACHE_PREFIX}:path:${districtId}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const district = await this.prisma.district.findUnique({
          where: { id: districtId },
          include: {
            translations: true,
            city: {
              include: {
                translations: true,
                governorate: {
                  include: {
                    translations: true,
                  },
                },
              },
            },
          },
        });

        if (!district) return null;

        return {
          governorate: {
            id: district.city.governorate.id,
            slug: district.city.governorate.slug,
            name: this.getTranslatedName(
              district.city.governorate.translations,
              locale,
            ),
          },
          city: {
            id: district.city.id,
            slug: district.city.slug,
            name: this.getTranslatedName(district.city.translations, locale),
          },
          district: {
            id: district.id,
            slug: district.slug,
            name: this.getTranslatedName(district.translations, locale),
          },
        };
      },
      CACHE_TTL * 12,
    );
  }

  /**
   * Validate coordinates are within valid range
   */
  validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Count businesses within a radius
   */
  async countNearbyBusinesses(
    lat: number,
    lng: number,
    radiusMeters: number,
  ): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM businesses b
      WHERE b."isActive" = true
        AND b."deletedAt" IS NULL
        AND b.location IS NOT NULL
        AND ST_DWithin(
          b.location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
    `;

    return Number(result[0].count);
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
