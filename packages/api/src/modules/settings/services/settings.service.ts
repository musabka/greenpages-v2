import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { AppTarget, BlockType } from '@prisma/client';
import {
  CreateFeatureToggleDto,
  UpdateFeatureToggleDto,
  CreateBlockDto,
  UpdateBlockDto,
} from '../dto';

@Injectable()
export class SettingsService {
  private readonly TOGGLE_CACHE_PREFIX = 'feature_toggle:';
  private readonly BLOCK_CACHE_PREFIX = 'block:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // ============================================
  // Feature Toggles
  // ============================================

  async getFeatureToggle(key: string): Promise<boolean> {
    const cacheKey = `${this.TOGGLE_CACHE_PREFIX}${key}`;
    
    // Try cache first
    const cached = await this.cache.get<boolean>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch from database
    const toggle = await this.prisma.featureToggle.findUnique({
      where: { key },
    });

    if (!toggle) {
      // Default to false if toggle doesn't exist
      return false;
    }

    // Cache the result
    await this.cache.set(cacheKey, toggle.value, this.CACHE_TTL);

    return toggle.value;
  }

  async setFeatureToggle(key: string, value: boolean): Promise<void> {
    await this.prisma.featureToggle.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        target: AppTarget.ALL,
      },
    });

    // Invalidate cache immediately for instant effect
    const cacheKey = `${this.TOGGLE_CACHE_PREFIX}${key}`;
    await this.cache.del(cacheKey);
  }

  async getAllToggles() {
    return this.prisma.featureToggle.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async createFeatureToggle(dto: CreateFeatureToggleDto) {
    // Check if toggle already exists
    const existing = await this.prisma.featureToggle.findUnique({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(`Feature toggle with key '${dto.key}' already exists`);
    }

    const toggle = await this.prisma.featureToggle.create({
      data: dto,
    });

    // Cache the new toggle
    const cacheKey = `${this.TOGGLE_CACHE_PREFIX}${dto.key}`;
    await this.cache.set(cacheKey, toggle.value, this.CACHE_TTL);

    return toggle;
  }

  async updateFeatureToggle(key: string, dto: UpdateFeatureToggleDto) {
    const toggle = await this.prisma.featureToggle.findUnique({
      where: { key },
    });

    if (!toggle) {
      throw new NotFoundException(`Feature toggle with key '${key}' not found`);
    }

    const updated = await this.prisma.featureToggle.update({
      where: { key },
      data: dto,
    });

    // Invalidate cache for immediate effect
    const cacheKey = `${this.TOGGLE_CACHE_PREFIX}${key}`;
    await this.cache.del(cacheKey);

    return updated;
  }

  async deleteFeatureToggle(key: string): Promise<void> {
    const toggle = await this.prisma.featureToggle.findUnique({
      where: { key },
    });

    if (!toggle) {
      throw new NotFoundException(`Feature toggle with key '${key}' not found`);
    }

    await this.prisma.featureToggle.delete({
      where: { key },
    });

    // Invalidate cache
    const cacheKey = `${this.TOGGLE_CACHE_PREFIX}${key}`;
    await this.cache.del(cacheKey);
  }

  // ============================================
  // Blocks
  // ============================================

  async getBlock(type: BlockType, target: AppTarget) {
    const cacheKey = `${this.BLOCK_CACHE_PREFIX}${type}:${target}`;
    
    // Try cache first
    const cached = await this.cache.get<any>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Fetch from database
    const block = await this.prisma.block.findUnique({
      where: {
        type_target: {
          type,
          target,
        },
      },
    });

    if (!block) {
      return null;
    }

    // Cache the result
    await this.cache.set(cacheKey, block, this.CACHE_TTL);

    return block;
  }

  async getAllBlocks() {
    return this.prisma.block.findMany({
      orderBy: [{ type: 'asc' }, { target: 'asc' }],
    });
  }

  async createBlock(dto: CreateBlockDto) {
    // Check if block already exists
    const existing = await this.prisma.block.findUnique({
      where: {
        type_target: {
          type: dto.type,
          target: dto.target,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Block with type '${dto.type}' and target '${dto.target}' already exists`,
      );
    }

    const block = await this.prisma.block.create({
      data: {
        type: dto.type,
        target: dto.target,
        schemaVersion: dto.schemaVersion ?? 1,
        settingsJson: dto.settingsJson,
        isEnabled: dto.isEnabled ?? true,
      },
    });

    // Cache the new block
    const cacheKey = `${this.BLOCK_CACHE_PREFIX}${dto.type}:${dto.target}`;
    await this.cache.set(cacheKey, block, this.CACHE_TTL);

    return block;
  }

  async updateBlock(id: string, dto: UpdateBlockDto) {
    const block = await this.prisma.block.findUnique({
      where: { id },
    });

    if (!block) {
      throw new NotFoundException(`Block with id '${id}' not found`);
    }

    const updated = await this.prisma.block.update({
      where: { id },
      data: dto,
    });

    // Invalidate cache for immediate effect
    const cacheKey = `${this.BLOCK_CACHE_PREFIX}${block.type}:${block.target}`;
    await this.cache.del(cacheKey);

    return updated;
  }

  async deleteBlock(id: string): Promise<void> {
    const block = await this.prisma.block.findUnique({
      where: { id },
    });

    if (!block) {
      throw new NotFoundException(`Block with id '${id}' not found`);
    }

    await this.prisma.block.delete({
      where: { id },
    });

    // Invalidate cache
    const cacheKey = `${this.BLOCK_CACHE_PREFIX}${block.type}:${block.target}`;
    await this.cache.del(cacheKey);
  }
}
