import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  CreateCityDto,
  UpdateCityDto,
  CityResponseDto,
  CityWithDistrictsDto,
} from '../dto';

const CACHE_PREFIX = 'geo:city';
const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class CityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateCityDto): Promise<CityResponseDto> {
    // Validate parent governorate exists
    const governorate = await this.prisma.governorate.findUnique({
      where: { id: dto.governorateId },
    });

    if (!governorate) {
      throw new BadRequestException(
        `Governorate with ID "${dto.governorateId}" not found`,
      );
    }

    // Check for duplicate slug
    const existing = await this.prisma.city.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`City with slug "${dto.slug}" already exists`);
    }

    const city = await this.prisma.city.create({
      data: {
        governorateId: dto.governorateId,
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
        governorate: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapToResponse(city, 'ar');
  }

  async findAll(
    locale: string = 'ar',
    governorateId?: string,
    isActive?: boolean,
  ): Promise<CityResponseDto[]> {
    const cacheKey = `${CACHE_PREFIX}:all:${locale}:${governorateId ?? 'all'}:${isActive ?? 'all'}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const cities = await this.prisma.city.findMany({
          where: {
            ...(governorateId && { governorateId }),
            ...(isActive !== undefined && { isActive }),
          },
          include: {
            translations: true,
            governorate: {
              include: {
                translations: true,
              },
            },
          },
          orderBy: { slug: 'asc' },
        });

        return cities.map((c: any) => this.mapToResponse(c, locale));
      },
      CACHE_TTL,
    );
  }

  async findById(id: string, locale: string = 'ar'): Promise<CityResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:${id}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const city = await this.prisma.city.findUnique({
          where: { id },
          include: {
            translations: true,
            governorate: {
              include: {
                translations: true,
              },
            },
          },
        });

        if (!city) {
          throw new NotFoundException(`City with ID "${id}" not found`);
        }

        return this.mapToResponse(city, locale);
      },
      CACHE_TTL,
    );
  }

  async findBySlug(slug: string, locale: string = 'ar'): Promise<CityResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:slug:${slug}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const city = await this.prisma.city.findUnique({
          where: { slug },
          include: {
            translations: true,
            governorate: {
              include: {
                translations: true,
              },
            },
          },
        });

        if (!city) {
          throw new NotFoundException(`City with slug "${slug}" not found`);
        }

        return this.mapToResponse(city, locale);
      },
      CACHE_TTL,
    );
  }

  async findWithDistricts(
    id: string,
    locale: string = 'ar',
  ): Promise<CityWithDistrictsDto> {
    const cacheKey = `${CACHE_PREFIX}:${id}:districts:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const city = await this.prisma.city.findUnique({
          where: { id },
          include: {
            translations: true,
            governorate: {
              include: {
                translations: true,
              },
            },
            districts: {
              include: {
                translations: true,
              },
              orderBy: { slug: 'asc' },
            },
          },
        });

        if (!city) {
          throw new NotFoundException(`City with ID "${id}" not found`);
        }

        const response = this.mapToResponse(city, locale) as CityWithDistrictsDto;
        response.districts = city.districts.map((district) => ({
          id: district.id,
          slug: district.slug,
          name: this.getTranslatedName(district.translations, locale),
          isActive: district.isActive,
        }));

        return response;
      },
      CACHE_TTL,
    );
  }

  async update(id: string, dto: UpdateCityDto): Promise<CityResponseDto> {
    // Check if city exists
    const existing = await this.prisma.city.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`City with ID "${id}" not found`);
    }

    // Validate parent governorate if updating
    if (dto.governorateId && dto.governorateId !== existing.governorateId) {
      const governorate = await this.prisma.governorate.findUnique({
        where: { id: dto.governorateId },
      });

      if (!governorate) {
        throw new BadRequestException(
          `Governorate with ID "${dto.governorateId}" not found`,
        );
      }
    }

    // Check for duplicate slug if updating
    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.city.findUnique({
        where: { slug: dto.slug },
      });
      if (slugExists) {
        throw new ConflictException(`City with slug "${dto.slug}" already exists`);
      }
    }

    const city = await this.prisma.city.update({
      where: { id },
      data: {
        governorateId: dto.governorateId,
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
        governorate: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapToResponse(city, 'ar');
  }

  async delete(id: string): Promise<void> {
    // Check if city exists
    const existing = await this.prisma.city.findUnique({
      where: { id },
      include: { districts: true },
    });

    if (!existing) {
      throw new NotFoundException(`City with ID "${id}" not found`);
    }

    // Check for children
    if (existing.districts.length > 0) {
      throw new ConflictException(
        `Cannot delete city with ${existing.districts.length} districts. Delete districts first.`,
      );
    }

    await this.prisma.city.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateCache();
  }

  private async invalidateCache(): Promise<void> {
    await this.cache.delPattern(`${CACHE_PREFIX}:*`);
    await this.cache.delPattern('geo:governorate:*'); // Also invalidate governorate cache
  }

  private mapToResponse(city: any, locale: string): CityResponseDto {
    return {
      id: city.id,
      slug: city.slug,
      governorateId: city.governorateId,
      lat: city.lat,
      lng: city.lng,
      isActive: city.isActive,
      name: this.getTranslatedName(city.translations, locale),
      translations: city.translations.map((t: { locale: string; name: string }) => ({
        locale: t.locale,
        name: t.name,
      })),
      governorate: city.governorate
        ? {
            id: city.governorate.id,
            slug: city.governorate.slug,
            name: this.getTranslatedName(city.governorate.translations, locale),
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
