import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryWithChildrenDto,
  CategoryTreeDto,
} from '../dto';

const CACHE_PREFIX = 'category';
const CACHE_TTL = 3600; // 1 hour

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Validate parent category exists if parentId provided
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new BadRequestException(
          `Parent category with ID "${dto.parentId}" not found`,
        );
      }
    }

    // Check for duplicate slug
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(
        `Category with slug "${dto.slug}" already exists`,
      );
    }

    // Validate unique name within same parent
    await this.validateUniqueNameWithinParent(
      dto.translations,
      dto.parentId || null,
    );

    const category = await this.prisma.category.create({
      data: {
        parentId: dto.parentId,
        slug: dto.slug,
        icon: dto.icon,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        translations: {
          create: dto.translations.map((t) => ({
            locale: t.locale,
            name: t.name,
            description: t.description,
          })),
        },
      },
      include: {
        translations: true,
        parent: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapToResponse(category, 'ar');
  }

  async findAll(
    locale: string = 'ar',
    parentId?: string,
    isActive?: boolean,
  ): Promise<CategoryResponseDto[]> {
    const cacheKey = `${CACHE_PREFIX}:all:${locale}:${parentId ?? 'all'}:${isActive ?? 'all'}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const categories = await this.prisma.category.findMany({
          where: {
            ...(parentId !== undefined && { parentId }),
            ...(isActive !== undefined && { isActive }),
          },
          include: {
            translations: true,
            parent: {
              include: {
                translations: true,
              },
            },
          },
          orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
        });

        return categories.map((c: any) => this.mapToResponse(c, locale));
      },
      CACHE_TTL,
    );
  }

  async findById(
    id: string,
    locale: string = 'ar',
  ): Promise<CategoryResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:${id}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const category = await this.prisma.category.findUnique({
          where: { id },
          include: {
            translations: true,
            parent: {
              include: {
                translations: true,
              },
            },
          },
        });

        if (!category) {
          throw new NotFoundException(`Category with ID "${id}" not found`);
        }

        return this.mapToResponse(category, locale);
      },
      CACHE_TTL,
    );
  }

  async findBySlug(
    slug: string,
    locale: string = 'ar',
  ): Promise<CategoryResponseDto> {
    const cacheKey = `${CACHE_PREFIX}:slug:${slug}:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const category = await this.prisma.category.findUnique({
          where: { slug },
          include: {
            translations: true,
            parent: {
              include: {
                translations: true,
              },
            },
          },
        });

        if (!category) {
          throw new NotFoundException(`Category with slug "${slug}" not found`);
        }

        return this.mapToResponse(category, locale);
      },
      CACHE_TTL,
    );
  }

  async findWithChildren(
    id: string,
    locale: string = 'ar',
  ): Promise<CategoryWithChildrenDto> {
    const cacheKey = `${CACHE_PREFIX}:${id}:children:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const category = await this.prisma.category.findUnique({
          where: { id },
          include: {
            translations: true,
            parent: {
              include: {
                translations: true,
              },
            },
            children: {
              include: {
                translations: true,
              },
              orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
            },
          },
        });

        if (!category) {
          throw new NotFoundException(`Category with ID "${id}" not found`);
        }

        const response = this.mapToResponse(
          category,
          locale,
        ) as CategoryWithChildrenDto;
        response.children = category.children.map((child) =>
          this.mapToResponse(child, locale),
        );

        return response;
      },
      CACHE_TTL,
    );
  }

  async getTree(locale: string = 'ar'): Promise<CategoryTreeDto[]> {
    const cacheKey = `${CACHE_PREFIX}:tree:${locale}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // Get all categories
        const categories = await this.prisma.category.findMany({
          include: {
            translations: true,
          },
          orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
        });

        // Build tree structure
        const categoryMap = new Map<string, CategoryTreeDto>();
        const rootCategories: CategoryTreeDto[] = [];

        // First pass: create all nodes
        categories.forEach((cat) => {
          const node: CategoryTreeDto = {
            id: cat.id,
            slug: cat.slug,
            icon: cat.icon,
            sortOrder: cat.sortOrder,
            isActive: cat.isActive,
            name: this.getTranslatedName(cat.translations, locale),
            description: this.getTranslatedDescription(cat.translations, locale),
            children: [],
          };
          categoryMap.set(cat.id, node);
        });

        // Second pass: build hierarchy
        categories.forEach((cat) => {
          const node = categoryMap.get(cat.id)!;
          if (cat.parentId) {
            const parent = categoryMap.get(cat.parentId);
            if (parent) {
              parent.children.push(node);
            }
          } else {
            rootCategories.push(node);
          }
        });

        return rootCategories;
      },
      CACHE_TTL,
    );
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    // Check if category exists
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // Validate parent category if updating
    if (dto.parentId !== undefined) {
      if (dto.parentId) {
        // Check parent exists
        const parent = await this.prisma.category.findUnique({
          where: { id: dto.parentId },
        });

        if (!parent) {
          throw new BadRequestException(
            `Parent category with ID "${dto.parentId}" not found`,
          );
        }

        // Prevent circular reference (category cannot be its own parent or descendant)
        if (dto.parentId === id) {
          throw new BadRequestException(
            'Category cannot be its own parent',
          );
        }

        // Check if new parent is a descendant of this category
        const isDescendant = await this.isDescendant(id, dto.parentId);
        if (isDescendant) {
          throw new BadRequestException(
            'Cannot set a descendant category as parent (circular reference)',
          );
        }
      }
    }

    // Check for duplicate slug if updating
    if (dto.slug && dto.slug !== existing.slug) {
      const slugExists = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (slugExists) {
        throw new ConflictException(
          `Category with slug "${dto.slug}" already exists`,
        );
      }
    }

    // Validate unique name within same parent if translations are being updated
    if (dto.translations) {
      const newParentId =
        dto.parentId !== undefined ? dto.parentId : existing.parentId;
      await this.validateUniqueNameWithinParent(
        dto.translations,
        newParentId,
        id,
      );
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        parentId: dto.parentId,
        slug: dto.slug,
        icon: dto.icon,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
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
      },
      include: {
        translations: true,
        parent: {
          include: {
            translations: true,
          },
        },
      },
    });

    // Invalidate cache
    await this.invalidateCache();

    return this.mapToResponse(category, 'ar');
  }

  async delete(id: string, cascade: boolean = false): Promise<void> {
    // Check if category exists
    const existing = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, businesses: true },
    });

    if (!existing) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // Check for children
    if (existing.children.length > 0) {
      if (!cascade) {
        throw new ConflictException(
          `Cannot delete category with ${existing.children.length} child categories. Use cascade=true to delete all children, or delete children first.`,
        );
      }
      // Cascade delete children
      for (const child of existing.children) {
        await this.delete(child.id, true);
      }
    }

    // Check for businesses
    if (existing.businesses.length > 0) {
      throw new ConflictException(
        `Cannot delete category with ${existing.businesses.length} businesses. Reassign businesses first.`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    // Invalidate cache
    await this.invalidateCache();
  }

  private async validateUniqueNameWithinParent(
    translations: { locale: string; name: string }[],
    parentId: string | null,
    excludeId?: string,
  ): Promise<void> {
    for (const translation of translations) {
      const existing = await this.prisma.categoryTranslation.findFirst({
        where: {
          locale: translation.locale,
          name: translation.name,
          category: {
            parentId: parentId,
            ...(excludeId && { id: { not: excludeId } }),
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Category with name "${translation.name}" (${translation.locale}) already exists under the same parent`,
        );
      }
    }
  }

  private async isDescendant(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    let currentId: string | null = descendantId;

    while (currentId) {
      if (currentId === ancestorId) {
        return true;
      }

      const category: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      currentId = category?.parentId || null;
    }

    return false;
  }

  private async invalidateCache(): Promise<void> {
    await this.cache.delPattern(`${CACHE_PREFIX}:*`);
  }

  private mapToResponse(category: any, locale: string): CategoryResponseDto {
    return {
      id: category.id,
      slug: category.slug,
      parentId: category.parentId,
      icon: category.icon,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      name: this.getTranslatedName(category.translations, locale),
      description: this.getTranslatedDescription(category.translations, locale),
      translations: category.translations.map(
        (t: { locale: string; name: string; description: string | null }) => ({
          locale: t.locale,
          name: t.name,
          description: t.description,
        }),
      ),
      parent: category.parent
        ? {
            id: category.parent.id,
            slug: category.parent.slug,
            name: this.getTranslatedName(category.parent.translations, locale),
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
