import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  CreateGovernorateDto,
  UpdateGovernorateDto,
  GovernorateResponseDto,
  GovernorateWithCitiesDto,
} from '../dto';

const CACHE_PREFIX = 'geo:governorate';
const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class GovernorateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateGovernorateDto): Promise<GovernorateResponseDto> {
    // Check for duplicate slug
    const existing = await this.prisma.governorate.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Governorate with slug "${dto.slug}" already exists`);
    }

    const governorate = await this.prisma.governorate.create({
      data: {
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
      },
    });

    // Invalidate cache
    await this.cache.delPattern(`${CACHE_PREFIX}:*`);

    return this.mapToResponse(governorate, 'ar');
  }

  async findAll(
    locale: string = 'ar',
    isActive?: boolean,
  ): Promise<GovernorateResponseDto[]> {
    const cacheKey = `${CACHE_PREFIX}:all:${locale}:${isActive ?? 'all'}`;
    
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const governorates = await this.prisma.governorate.findMany({
          where: isActive !== undefined ? { isActive } : undefined,
          include: {
            translations: true,
          },
          orderBy: { slug: 'asc' },
        });

        return governorates.map((g: any) => this.mapToResponse(g, locale));
      },
      CACHE_TTL,
    );
  }

  async findById(
    id: string,
    locale: string = 'ar',
  ): Promise<GovernorateResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:${id}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const governorate = await this.prisma.governorate.findUnique({
          where: { id },
          include: {
            translations: true,
          },
        });

        if (!governorate) {
          throw new NotFoundException(`Governorate with ID "${id}" not found`);
        }

        return this.mapToResponse(governorate, locale);
      },
      CACHE_TTL,
    );
  }

  async findBySlug(
    slug: string,
    locale: string = 'ar',
  ): Promise<GovernorateResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:slug:${slug}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const governorate = await this.prisma.governorate.findUnique({
          where: { slug },
          include: {
            translations: true,
          },
        });

        if (!governorate) {
          throw new NotFoundException(`Governorate with slug "${slug}" not found`);
        }

        return this.mapToResponse(governorate, locale);
      },
      CACHE_TTL,
    );
  }

  async findWithCities(
    id: string,
    locale: string = 'ar',
  ): Promise<GovernorateWithCitiesDto> {
    const cacheKey = `${CACHE_PREFIX}:${id}:cities:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const governorate = await this.prisma.governorate.findUnique({
          where: { id },
          include: {
            translations: true,
            cities: {
              include: {
                translations: true,
              },
              orderBy: { slug: 'asc' },
            },
          },
        });

        if (!governorate) {
          throw new NotFoundException(`Governorate with ID "${id}" not found`);
        }

        const response = this.mapToResponse(governorate, locale) as GovernorateWithCitiesDto;
        response.cities = governorate.cities.map((city) => ({
          id: city.id,
          slug: city.slug,
          name: this.getTranslatedName(city.translations, locale),
          isActive: city.isActive,
        }));

        return response;
      },
      CACHE_TTL,
    );
  }

  async update(
    id: string,
    dto: UpdateGovernorateDto,
  ): Promise<GovernorateResponseDto> {
    // Check if governorate exists
    const existing = await this.prisma.governorate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Governorate with ID "${id}" not found`);
    }

    // Check for duplicate slug if updating
    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.governorate.findUnique({
        where: { slug: dto.slug },
      });
      if (slugExists) {
        throw new ConflictException(`Governorate with slug "${dto.slug}" already exists`);
      }
    }

    const governorate = await this.prisma.governorate.update({
      where: { id },
      data: {
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
      },
    });

    // Invalidate cache
    await this.cache.delPattern(`${CACHE_PREFIX}:*`);

    return this.mapToResponse(governorate, 'ar');
  }

  async delete(id: string): Promise<void> {
    // Check if governorate exists
    const existing = await this.prisma.governorate.findUnique({
      where: { id },
      include: { cities: true },
    });

    if (!existing) {
      throw new NotFoundException(`Governorate with ID "${id}" not found`);
    }

    // Check for children
    if (existing.cities.length > 0) {
      throw new ConflictException(
        `Cannot delete governorate with ${existing.cities.length} cities. Delete cities first.`,
      );
    }

    await this.prisma.governorate.delete({
      where: { id },
    });

    // Invalidate cache
    await this.cache.delPattern(`${CACHE_PREFIX}:*`);
  }

  private mapToResponse(
    governorate: any,
    locale: string,
  ): GovernorateResponseDto {
    return {
      id: governorate.id,
      slug: governorate.slug,
      lat: governorate.lat,
      lng: governorate.lng,
      isActive: governorate.isActive,
      name: this.getTranslatedName(governorate.translations, locale),
      translations: governorate.translations.map((t: { locale: string; name: string }) => ({
        locale: t.locale,
        name: t.name,
      })),
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
