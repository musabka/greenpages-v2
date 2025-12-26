import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { StorageService } from '../../storage/services/storage.service';
import {
  CreateBusinessDto,
  UpdateBusinessDto,
  BusinessResponseDto,
  BusinessImageResponseDto,
} from '../dto';

// Cache key prefixes for organized cache management
const CACHE_KEYS = {
  BUSINESS: 'business',
  BUSINESS_CARD: 'business:card',
  BUSINESS_SLUG: 'business:slug',
  SEARCH: 'business:search',
  FEATURED: 'business:featured',
  BY_OWNER: 'business:owner',
  BY_CATEGORY: 'business:category',
  BY_LOCATION: 'business:location',
} as const;

const CACHE_TTL = 1800; // 30 minutes

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Create a new business with transaction
   */
  async create(dto: CreateBusinessDto): Promise<BusinessResponseDto> {
    // Validate all references first
    await this.validateBusinessReferences(dto);

    // Validate coordinates
    if (!this.validateCoordinates(dto.lat, dto.lng)) {
      throw new BadRequestException('Invalid coordinates');
    }

    // Normalize phone for search
    const phoneNormalized = this.normalizePhone(dto.phone);

    // Use transaction for atomic operation
    const business = await this.prisma.$transaction(async (tx) => {
      // Check slug uniqueness within transaction
      const existingSlug = await tx.business.findUnique({
        where: { slug: dto.slug },
      });

      if (existingSlug) {
        throw new ConflictException(`Business with slug "${dto.slug}" already exists`);
      }

      // Create business
      const created = await tx.business.create({
        data: {
          slug: dto.slug,
          categoryId: dto.categoryId,
          districtId: dto.districtId,
          agentId: dto.agentId,
          ownerId: dto.ownerId,
          lat: dto.lat,
          lng: dto.lng,
          phone: dto.phone,
          phone2: dto.phone2,
          whatsapp: dto.whatsapp,
          email: dto.email,
          website: dto.website,
          workingHours: dto.workingHours as any,
          isFeatured: dto.isFeatured ?? false,
          isVerified: dto.isVerified ?? false,
          isActive: dto.isActive ?? true,
          metaTitle: dto.metaTitle,
          metaDescription: dto.metaDescription,
          translations: {
            create: dto.translations.map((t) => ({
              locale: t.locale,
              name: t.name,
              description: t.description,
              address: t.address,
            })),
          },
        },
        include: this.getBusinessInclude(),
      });

      return created;
    });

    // Update PostGIS location column (outside transaction - raw SQL)
    await this.updateLocationColumn(business.id, dto.lat, dto.lng);
    
    // Update normalized phone via raw SQL (will be automatic after migration)
    if (phoneNormalized) {
      await this.prisma.$executeRaw`
        UPDATE businesses SET phone_normalized = ${phoneNormalized} WHERE id = ${business.id}
      `;
    }

    // Invalidate relevant caches
    await this.invalidateCaches({
      categoryId: dto.categoryId,
      districtId: dto.districtId,
      ownerId: dto.ownerId,
    });

    return this.mapToResponse(business, 'ar');
  }

  /**
   * Find business by ID
   */
  async findById(id: string, locale: string = 'ar'): Promise<BusinessResponseDto> {
    const cacheKey = `${CACHE_KEYS.BUSINESS}:${id}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const business = await this.prisma.business.findUnique({
          where: { id },
          include: this.getBusinessInclude(),
        });

        if (!business || business.deletedAt) {
          throw new NotFoundException(`Business with ID "${id}" not found`);
        }

        return this.mapToResponse(business, locale);
      },
      CACHE_TTL,
    );
  }

  /**
   * Find business by slug
   */
  async findBySlug(slug: string, locale: string = 'ar'): Promise<BusinessResponseDto> {
    const cacheKey = `${CACHE_KEYS.BUSINESS_SLUG}:${slug}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const business = await this.prisma.business.findUnique({
          where: { slug },
          include: this.getBusinessInclude(),
        });

        if (!business || business.deletedAt) {
          throw new NotFoundException(`Business with slug "${slug}" not found`);
        }

        return this.mapToResponse(business, locale);
      },
      CACHE_TTL,
    );
  }

  /**
   * Update business with transaction
   */
  async update(id: string, dto: UpdateBusinessDto): Promise<BusinessResponseDto> {
    // Get existing business
    const existing = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Business with ID "${id}" not found`);
    }

    // Validate references if updating
    if (dto.categoryId || dto.districtId) {
      await this.validateBusinessReferences({
        categoryId: dto.categoryId || existing.categoryId,
        districtId: dto.districtId || existing.districtId,
      } as any);
    }

    // Validate coordinates if updating
    const newLat = dto.lat ?? existing.lat;
    const newLng = dto.lng ?? existing.lng;
    if (!this.validateCoordinates(newLat, newLng)) {
      throw new BadRequestException('Invalid coordinates');
    }

    // Normalize phone if updating
    const phoneNormalized = dto.phone !== undefined 
      ? this.normalizePhone(dto.phone) 
      : undefined;

    // Use transaction for atomic operation
    const business = await this.prisma.$transaction(async (tx) => {
      // Validate slug uniqueness if updating
      if (dto.slug && dto.slug !== existing.slug) {
        const slugExists = await tx.business.findUnique({
          where: { slug: dto.slug },
        });

        if (slugExists) {
          throw new ConflictException(`Business with slug "${dto.slug}" already exists`);
        }
      }

      // Update business
      const updated = await tx.business.update({
        where: { id },
        data: {
          slug: dto.slug,
          categoryId: dto.categoryId,
          districtId: dto.districtId,
          ownerId: dto.ownerId,
          lat: dto.lat,
          lng: dto.lng,
          phone: dto.phone,
          phone2: dto.phone2,
          whatsapp: dto.whatsapp,
          email: dto.email,
          website: dto.website,
          workingHours: dto.workingHours as any,
          isFeatured: dto.isFeatured,
          isVerified: dto.isVerified,
          isActive: dto.isActive,
          metaTitle: dto.metaTitle,
          metaDescription: dto.metaDescription,
          translations: dto.translations
            ? {
                deleteMany: {},
                create: dto.translations.map((t) => ({
                  locale: t.locale,
                  name: t.name,
                  description: t.description,
                  address: t.address,
                })),
              }
            : undefined,
        },
        include: this.getBusinessInclude(),
      });

      return updated;
    });

    // Update PostGIS location if coordinates changed
    if (dto.lat !== undefined || dto.lng !== undefined) {
      await this.updateLocationColumn(business.id, newLat, newLng);
    }
    
    // Update normalized phone via raw SQL (will be automatic after migration)
    if (phoneNormalized !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE businesses SET phone_normalized = ${phoneNormalized} WHERE id = ${id}
      `;
    }

    // Invalidate caches
    await this.invalidateCaches({
      businessId: id,
      slug: existing.slug,
      newSlug: dto.slug,
      categoryId: dto.categoryId || existing.categoryId,
      districtId: dto.districtId || existing.districtId,
      ownerId: dto.ownerId || existing.ownerId,
    });

    return this.mapToResponse(business, 'ar');
  }


  /**
   * Soft delete business
   */
  async softDelete(id: string): Promise<void> {
    const existing = await this.prisma.business.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Business with ID "${id}" not found`);
    }

    if (existing.deletedAt) {
      throw new BadRequestException('Business is already deleted');
    }

    await this.prisma.business.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Invalidate caches
    await this.invalidateCaches({
      businessId: id,
      slug: existing.slug,
      categoryId: existing.categoryId,
      districtId: existing.districtId,
      ownerId: existing.ownerId,
    });
  }

  /**
   * Restore soft-deleted business
   */
  async restore(id: string): Promise<BusinessResponseDto> {
    const existing = await this.prisma.business.findUnique({
      where: { id },
      include: this.getBusinessInclude(),
    });

    if (!existing) {
      throw new NotFoundException(`Business with ID "${id}" not found`);
    }

    if (!existing.deletedAt) {
      throw new BadRequestException('Business is not deleted');
    }

    const business = await this.prisma.business.update({
      where: { id },
      data: {
        deletedAt: null,
        isActive: true,
      },
      include: this.getBusinessInclude(),
    });

    // Invalidate caches
    await this.invalidateCaches({
      businessId: id,
      slug: existing.slug,
      categoryId: existing.categoryId,
      districtId: existing.districtId,
      ownerId: existing.ownerId,
    });

    return this.mapToResponse(business, 'ar');
  }

  /**
   * Hard delete business with transaction (admin only)
   */
  async hardDelete(id: string): Promise<void> {
    const existing = await this.prisma.business.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      throw new NotFoundException(`Business with ID "${id}" not found`);
    }

    // Use transaction for atomic deletion
    await this.prisma.$transaction(async (tx) => {
      // Delete business (cascades to translations, images, etc.)
      await tx.business.delete({
        where: { id },
      });
    });

    // Delete images from storage (outside transaction)
    for (const image of existing.images) {
      try {
        await this.storage.hardDelete(image.objectKey);
      } catch (error) {
        this.logger.warn(`Failed to delete image ${image.objectKey}:`, error);
      }
    }

    // Invalidate caches
    await this.invalidateCaches({
      businessId: id,
      slug: existing.slug,
      categoryId: existing.categoryId,
      districtId: existing.districtId,
      ownerId: existing.ownerId,
    });
  }

  /**
   * Add image to business with transaction
   */
  async addImage(
    businessId: string,
    file: Buffer,
    filename: string,
    contentType: string,
    isPrimary: boolean = false,
  ): Promise<BusinessImageResponseDto> {
    // Validate business exists
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { images: true },
    });

    if (!business || business.deletedAt) {
      throw new NotFoundException(`Business with ID "${businessId}" not found`);
    }

    // Upload to storage first
    const result = await this.storage.upload(
      file,
      filename,
      contentType,
      `businesses/${businessId}`,
    );

    // Use transaction for image record creation
    const image = await this.prisma.$transaction(async (tx) => {
      // If setting as primary, unset other primary images
      if (isPrimary || business.images.length === 0) {
        await tx.businessImage.updateMany({
          where: { businessId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      // Get next sort order
      const maxSortOrder = business.images.reduce(
        (max, img) => Math.max(max, img.sortOrder),
        -1,
      );

      // Create image record
      return tx.businessImage.create({
        data: {
          businessId,
          storageProvider: result.provider,
          bucket: result.bucket,
          objectKey: result.objectKey,
          mimeType: result.mimeType,
          size: result.size,
          checksum: result.checksum,
          sortOrder: maxSortOrder + 1,
          isPrimary: isPrimary || business.images.length === 0,
        },
      });
    });

    // Invalidate cache
    await this.invalidateCaches({ businessId, slug: business.slug });

    return {
      id: image.id,
      objectKey: image.objectKey,
      mimeType: image.mimeType,
      size: image.size,
      sortOrder: image.sortOrder,
      isPrimary: image.isPrimary,
    };
  }

  /**
   * Remove image from business with transaction
   */
  async removeImage(businessId: string, imageId: string): Promise<void> {
    const image = await this.prisma.businessImage.findFirst({
      where: { id: imageId, businessId },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID "${imageId}" not found`);
    }

    // Use transaction for atomic operation
    await this.prisma.$transaction(async (tx) => {
      // Delete record
      await tx.businessImage.delete({
        where: { id: imageId },
      });

      // If deleted image was primary, set another as primary
      if (image.isPrimary) {
        const nextImage = await tx.businessImage.findFirst({
          where: { businessId, id: { not: imageId } },
          orderBy: { sortOrder: 'asc' },
        });

        if (nextImage) {
          await tx.businessImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    // Delete from storage (outside transaction)
    try {
      await this.storage.softDelete(image.objectKey);
    } catch (error) {
      this.logger.warn(`Failed to delete image from storage:`, error);
    }

    // Get business slug for cache invalidation
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { slug: true },
    });

    await this.invalidateCaches({ businessId, slug: business?.slug });
  }

  /**
   * Set primary image with transaction (ensures only one primary)
   */
  async setPrimaryImage(businessId: string, imageId: string): Promise<void> {
    const image = await this.prisma.businessImage.findFirst({
      where: { id: imageId, businessId },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID "${imageId}" not found`);
    }

    // Use transaction to ensure only one primary
    await this.prisma.$transaction(async (tx) => {
      // Unset all primary images for this business
      await tx.businessImage.updateMany({
        where: { businessId, isPrimary: true },
        data: { isPrimary: false },
      });

      // Set new primary
      await tx.businessImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });

    // Get business slug for cache invalidation
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { slug: true },
    });

    await this.invalidateCaches({ businessId, slug: business?.slug });
  }

  /**
   * Reorder images with transaction
   */
  async reorderImages(businessId: string, imageIds: string[]): Promise<void> {
    // Validate all images belong to business
    const images = await this.prisma.businessImage.findMany({
      where: { businessId },
    });

    const existingIds = new Set(images.map((img) => img.id));
    for (const id of imageIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Image with ID "${id}" not found`);
      }
    }

    // Use transaction for atomic reorder
    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        imageIds.map((id, index) =>
          tx.businessImage.update({
            where: { id },
            data: { sortOrder: index },
          }),
        ),
      );
    });

    // Get business slug for cache invalidation
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { slug: true },
    });

    await this.invalidateCaches({ businessId, slug: business?.slug });
  }


  /**
   * Increment view count (fire and forget)
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.business.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Get businesses by owner (includes both ownerId and BusinessOwner relation)
   */
  async findByOwner(ownerId: string, locale: string = 'ar'): Promise<BusinessResponseDto[]> {
    const cacheKey = `${CACHE_KEYS.BY_OWNER}:${ownerId}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Get businesses where user is primary owner OR in BusinessOwner table
        const businesses = await this.prisma.business.findMany({
          where: {
            deletedAt: null,
            OR: [
              { ownerId },
              { additionalOwners: { some: { userId: ownerId } } },
            ],
          },
          include: this.getBusinessInclude(),
          orderBy: { createdAt: 'desc' },
        });

        return businesses.map((b) => this.mapToResponse(b, locale));
      },
      CACHE_TTL,
    );
  }

  /**
   * Check if user can manage business (owner or staff)
   */
  async canUserManageBusiness(userId: string, businessId: string): Promise<boolean> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        additionalOwners: {
          where: { userId },
        },
      },
    });

    if (!business) return false;

    // Check if primary owner
    if (business.ownerId === userId) return true;

    // Check if in additional owners
    return business.additionalOwners.length > 0;
  }

  /**
   * Get user's role for a business
   */
  async getUserBusinessRole(userId: string, businessId: string): Promise<string | null> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        additionalOwners: {
          where: { userId },
        },
      },
    });

    if (!business) return null;

    // Primary owner has OWNER role
    if (business.ownerId === userId) return 'OWNER';

    // Check additional owners
    const additionalOwner = business.additionalOwners[0];
    return additionalOwner?.role || null;
  }

  /**
   * Get deleted businesses (admin) with pagination
   */
  async findDeleted(
    page: number = 1,
    limit: number = 20,
    locale: string = 'ar',
  ): Promise<{ data: BusinessResponseDto[]; total: number }> {
    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      this.prisma.business.findMany({
        where: { deletedAt: { not: null } },
        include: this.getBusinessInclude(),
        orderBy: { deletedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.business.count({
        where: { deletedAt: { not: null } },
      }),
    ]);

    return {
      data: businesses.map((b) => this.mapToResponse(b, locale)),
      total,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private getBusinessInclude() {
    return {
      translations: true,
      images: {
        orderBy: { sortOrder: 'asc' as const },
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
      additionalOwners: {
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      },
    };
  }

  private async validateBusinessReferences(dto: {
    categoryId: string;
    districtId: string;
    agentId?: string;
    ownerId?: string;
  }): Promise<void> {
    // Validate category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException(`Category with ID "${dto.categoryId}" not found`);
    }

    // Validate district exists
    const district = await this.prisma.district.findUnique({
      where: { id: dto.districtId },
    });

    if (!district) {
      throw new BadRequestException(`District with ID "${dto.districtId}" not found`);
    }

    // Validate agent if provided
    if (dto.agentId) {
      const agent = await this.prisma.agent.findUnique({
        where: { id: dto.agentId },
      });

      if (!agent) {
        throw new BadRequestException(`Agent with ID "${dto.agentId}" not found`);
      }
    }

    // Validate owner if provided
    if (dto.ownerId) {
      const owner = await this.prisma.user.findUnique({
        where: { id: dto.ownerId },
      });

      if (!owner) {
        throw new BadRequestException(`User with ID "${dto.ownerId}" not found`);
      }
    }
  }

  private async updateLocationColumn(id: string, lat: number, lng: number): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE businesses 
      SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${id}
    `;
  }

  private validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Normalize phone number for search (digits only)
   */
  private normalizePhone(phone: string | undefined | null): string | null {
    if (!phone) return null;
    return phone.replace(/\D/g, '');
  }

  /**
   * Invalidate caches with specific keys strategy
   */
  private async invalidateCaches(params: {
    businessId?: string;
    slug?: string;
    newSlug?: string;
    categoryId?: string | null;
    districtId?: string | null;
    ownerId?: string | null;
  }): Promise<void> {
    const { businessId, slug, newSlug, categoryId, districtId, ownerId } = params;

    const patterns: string[] = [];

    // Business-specific caches
    if (businessId) {
      patterns.push(`${CACHE_KEYS.BUSINESS}:${businessId}:*`);
      patterns.push(`${CACHE_KEYS.BUSINESS_CARD}:${businessId}:*`);
    }

    // Slug-based caches
    if (slug) {
      patterns.push(`${CACHE_KEYS.BUSINESS_SLUG}:${slug}:*`);
    }
    if (newSlug && newSlug !== slug) {
      patterns.push(`${CACHE_KEYS.BUSINESS_SLUG}:${newSlug}:*`);
    }

    // Category-based caches
    if (categoryId) {
      patterns.push(`${CACHE_KEYS.BY_CATEGORY}:${categoryId}:*`);
    }

    // Location-based caches (district affects city and governorate)
    if (districtId) {
      patterns.push(`${CACHE_KEYS.BY_LOCATION}:*`);
    }

    // Owner-based caches
    if (ownerId) {
      patterns.push(`${CACHE_KEYS.BY_OWNER}:${ownerId}:*`);
    }

    // Always invalidate search and featured caches
    patterns.push(`${CACHE_KEYS.SEARCH}:*`);
    patterns.push(`${CACHE_KEYS.FEATURED}:*`);

    // Delete all patterns
    await Promise.all(patterns.map((pattern) => this.cache.delPattern(pattern)));
  }


  private mapToResponse(business: any, locale: string): BusinessResponseDto {
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
      categoryId: business.categoryId,
      districtId: business.districtId,
      agentId: business.agentId,
      ownerId: business.ownerId,
      lat: business.lat,
      lng: business.lng,
      phone: business.phone,
      phone2: business.phone2,
      whatsapp: business.whatsapp,
      email: business.email,
      website: business.website,
      workingHours: business.workingHours,
      avgRating: Number(business.avgRating),
      reviewCount: business.reviewCount,
      viewCount: business.viewCount,
      isFeatured: business.isFeatured,
      isVerified: business.isVerified,
      isActive: business.isActive,
      metaTitle: business.metaTitle,
      metaDescription: business.metaDescription,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
      name: translation?.name || '',
      description: translation?.description || null,
      address: translation?.address || null,
      translations: business.translations.map((t: any) => ({
        locale: t.locale,
        name: t.name,
        description: t.description,
        address: t.address,
      })),
      category: business.category
        ? {
            id: business.category.id,
            slug: business.category.slug,
            name: categoryTranslation?.name || '',
          }
        : undefined,
      district: business.district
        ? {
            id: business.district.id,
            slug: business.district.slug,
            name: districtTranslation?.name || '',
          }
        : undefined,
      city: business.district?.city
        ? {
            id: business.district.city.id,
            slug: business.district.city.slug,
            name: cityTranslation?.name || '',
          }
        : undefined,
      governorate: business.district?.city?.governorate
        ? {
            id: business.district.city.governorate.id,
            slug: business.district.city.governorate.slug,
            name: governorateTranslation?.name || '',
          }
        : undefined,
      images: business.images?.map((img: any) => ({
        id: img.id,
        objectKey: img.objectKey,
        mimeType: img.mimeType,
        size: img.size,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })),
    };
  }

  private getTranslation(
    translations: { locale: string; name: string; description?: string | null; address?: string | null }[],
    locale: string,
  ): { name: string; description: string | null; address: string | null } | null {
    const translation = translations?.find((t) => t.locale === locale);
    if (translation) {
      return {
        name: translation.name,
        description: translation.description ?? null,
        address: translation.address ?? null,
      };
    }

    // Fallback to Arabic
    const arabicTranslation = translations?.find((t) => t.locale === 'ar');
    if (arabicTranslation) {
      return {
        name: arabicTranslation.name,
        description: arabicTranslation.description ?? null,
        address: arabicTranslation.address ?? null,
      };
    }

    // Fallback to first available
    const first = translations?.[0];
    if (first) {
      return {
        name: first.name,
        description: first.description ?? null,
        address: first.address ?? null,
      };
    }

    return null;
  }
}
