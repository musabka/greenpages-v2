import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  CreateDistrictDto,
  UpdateDistrictDto,
  DistrictResponseDto,
  DistrictWithHierarchyDto,
} from '../dto';

const CACHE_PREFIX = 'geo:district';
const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class DistrictService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateDistrictDto): Promise<DistrictResponseDto> {
    // Validate parent city exists
    const city = await this.prisma.city.findUnique({
      where: { id: dto.cityId },
      include: {
        governorate: true,
      },
    });

    if (!city) {
      throw new BadRequestException(`City with ID "${dto.cityId}" not found`);
    }

    // Check for duplicate slug
    const existing = await this.prisma.district.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`District with slug "${dto.slug}" already exists`);
    }

    const district = await this.prisma.district.create({
      data: {
        cityId: dto.cityId,
        slug: dto.slug,
        lat: dto.lat,
        lng: dto.lng,
        isActive: dto.isActive ?? true,
        translations: {
          create: dto.translations.map((t) => ({
            locale: t.locale,
            name: t.name,
          })),
        },
      },
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

    // Invalidate cache
    await this.invalidateCache();

    return this.mapToResponse(district, 'ar');
  }

  async findAll(
    locale: string = 'ar',
    cityId?: string,
    governorateId?: string,
    isActive?: boolean,
  ): Promise<DistrictResponseDto[]> {
    const cacheKey = `${CACHE_PREFIX}:all:${locale}:${cityId ?? 'all'}:${governorateId ?? 'all'}:${isActive ?? 'all'}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const districts = await this.prisma.district.findMany({
          where: {
            ...(cityId && { cityId }),
            ...(governorateId && { city: { governorateId } }),
            ...(isActive !== undefined && { isActive }),
          },
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
          orderBy: { slug: 'asc' },
        });

        return districts.map((d: any) => this.mapToResponse(d, locale));
      },
      CACHE_TTL,
    );
  }

  async findById(id: string, locale: string = 'ar'): Promise<DistrictResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:${id}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const district = await this.prisma.district.findUnique({
          where: { id },
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

        if (!district) {
          throw new NotFoundException(`District with ID "${id}" not found`);
        }

        return this.mapToResponse(district, locale);
      },
      CACHE_TTL,
    );
  }

  async findBySlug(slug: string, locale: string = 'ar'): Promise<DistrictResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:slug:${slug}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const district = await this.prisma.district.findUnique({
          where: { slug },
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

        if (!district) {
          throw new NotFoundException(`District with slug "${slug}" not found`);
        }

        return this.mapToResponse(district, locale);
      },
      CACHE_TTL,
    );
  }

  async findWithHierarchy(
    id: string,
    locale: string = 'ar',
  ): Promise<DistrictWithHierarchyDto> {
    const cacheKey = `${CACHE_PREFIX}:${id}:hierarchy:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const district = await this.prisma.district.findUnique({
          where: { id },
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

        if (!district) {
          throw new NotFoundException(`District with ID "${id}" not found`);
        }

        const response = this.mapToResponse(district, locale) as DistrictWithHierarchyDto;
        response.hierarchy = {
          governorate: {
            id: district.city.governorate.id,
            slug: district.city.governorate.slug,
            name: this.getTranslatedName(district.city.governorate.translations, locale),
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

        return response;
      },
      CACHE_TTL,
    );
  }

  async update(id: string, dto: UpdateDistrictDto): Promise<DistrictResponseDto> {
    // Check if district exists
    const existing = await this.prisma.district.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`District with ID "${id}" not found`);
    }

    // Validate parent city if updating
    if (dto.cityId && dto.cityId !== existing.cityId) {
      const city = await this.prisma.city.findUnique({
        where: { id: dto.cityId },
      });

      if (!city) {
        throw new BadRequestException(`City with ID "${dto.cityId}" not found`);
      }
    }

    // Check for duplicate slug if updating
    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.district.findUnique({
        where: { slug: dto.slug },
      });
      if (slugExists) {
        throw new ConflictException(`District with slug "${dto.slug}" already exists`);
      }
    }

    const district = await this.prisma.district.update({
      where: { id },
      data: {
        cityId: dto.cityId,
        slug: dto.slug,
        lat: dto.lat,
        lng: dto.lng,
        isActive: dto.isActive,
        translations: dto.translations
          ? {
              deleteMany: {},
              create: dto.translations.map((t) => ({
                locale: t.locale,
                name: t.name,
              })),
            }
          : undefined,
      },
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

    // Invalidate cache
    await this.invalidateCache();

    return this.mapToResponse(district, 'ar');
  }

  async delete(id: string): Promise<void> {
    // Check if district exists
    const existing = await this.prisma.district.findUnique({
      where: { id },
      include: { businesses: true },
    });

    if (!existing) {
      throw new NotFoundException(`District with ID "${id}" not found`);
    }

    // Check for businesses
    if (existing.businesses.length > 0) {
      throw new ConflictException(
        `Cannot delete district with ${existing.businesses.length} businesses. Reassign businesses first.`,
      );
    }

    await this.prisma.district.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateCache();
  }

  private async invalidateCache(): Promise<void> {
    await this.cache.delPattern(`${CACHE_PREFIX}:*`);
    await this.cache.delPattern('geo:city:*'); // Also invalidate city cache
    await this.cache.delPattern('geo:governorate:*'); // Also invalidate governorate cache
  }

  private mapToResponse(district: any, locale: string): DistrictResponseDto {
    return {
      id: district.id,
      slug: district.slug,
      cityId: district.cityId,
      lat: district.lat,
      lng: district.lng,
      isActive: district.isActive,
      name: this.getTranslatedName(district.translations, locale),
      translations: district.translations.map((t: { locale: string; name: string }) => ({
        locale: t.locale,
        name: t.name,
      })),
      city: district.city
        ? {
            id: district.city.id,
            slug: district.city.slug,
            name: this.getTranslatedName(district.city.translations, locale),
            governorate: district.city.governorate
              ? {
                  id: district.city.governorate.id,
                  slug: district.city.governorate.slug,
                  name: this.getTranslatedName(
                    district.city.governorate.translations,
                    locale,
                  ),
                }
              : undefined,
          }
        : undefined,
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
}
