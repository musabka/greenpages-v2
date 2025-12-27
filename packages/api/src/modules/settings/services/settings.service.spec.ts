import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { AppTarget, BlockType } from '@prisma/client';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;
  let cache: CacheService;

  const mockPrismaService = {
    featureToggle: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    block: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);
    cache = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature Toggles', () => {
    describe('getFeatureToggle', () => {
      it('should return cached value if available', async () => {
        mockCacheService.get.mockResolvedValue(true);

        const result = await service.getFeatureToggle('test_feature');

        expect(result).toBe(true);
        expect(mockCacheService.get).toHaveBeenCalledWith('feature_toggle:test_feature');
        expect(mockPrismaService.featureToggle.findUnique).not.toHaveBeenCalled();
      });

      it('should fetch from database and cache if not in cache', async () => {
        const mockToggle = {
          id: 'toggle-1',
          key: 'test_feature',
          value: true,
          description: 'Test feature',
          target: AppTarget.ALL,
          updatedAt: new Date(),
        };

        mockCacheService.get.mockResolvedValue(null);
        mockPrismaService.featureToggle.findUnique.mockResolvedValue(mockToggle);

        const result = await service.getFeatureToggle('test_feature');

        expect(result).toBe(true);
        expect(mockPrismaService.featureToggle.findUnique).toHaveBeenCalledWith({
          where: { key: 'test_feature' },
        });
        expect(mockCacheService.set).toHaveBeenCalledWith(
          'feature_toggle:test_feature',
          true,
          3600,
        );
      });

      it('should return false if toggle does not exist', async () => {
        mockCacheService.get.mockResolvedValue(null);
        mockPrismaService.featureToggle.findUnique.mockResolvedValue(null);

        const result = await service.getFeatureToggle('nonexistent_feature');

        expect(result).toBe(false);
      });
    });

    describe('setFeatureToggle', () => {
      it('should upsert toggle and invalidate cache', async () => {
        const mockToggle = {
          id: 'toggle-1',
          key: 'test_feature',
          value: true,
          description: null,
          target: AppTarget.ALL,
          updatedAt: new Date(),
        };

        mockPrismaService.featureToggle.upsert.mockResolvedValue(mockToggle);

        await service.setFeatureToggle('test_feature', true);

        expect(mockPrismaService.featureToggle.upsert).toHaveBeenCalledWith({
          where: { key: 'test_feature' },
          update: { value: true },
          create: {
            key: 'test_feature',
            value: true,
            target: AppTarget.ALL,
          },
        });
        expect(mockCacheService.del).toHaveBeenCalledWith('feature_toggle:test_feature');
      });
    });

    describe('createFeatureToggle', () => {
      it('should create a new feature toggle', async () => {
        const dto = {
          key: 'new_feature',
          value: true,
          description: 'New feature',
          target: AppTarget.WEB_DIRECTORY,
        };

        const mockToggle = {
          id: 'toggle-1',
          ...dto,
          updatedAt: new Date(),
        };

        mockPrismaService.featureToggle.findUnique.mockResolvedValue(null);
        mockPrismaService.featureToggle.create.mockResolvedValue(mockToggle);

        const result = await service.createFeatureToggle(dto);

        expect(result).toEqual(mockToggle);
        expect(mockCacheService.set).toHaveBeenCalled();
      });

      it('should throw ConflictException if toggle already exists', async () => {
        const dto = {
          key: 'existing_feature',
          value: true,
          description: 'Existing feature',
          target: AppTarget.ALL,
        };

        mockPrismaService.featureToggle.findUnique.mockResolvedValue({
          id: 'toggle-1',
          ...dto,
          updatedAt: new Date(),
        });

        await expect(service.createFeatureToggle(dto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('updateFeatureToggle', () => {
      it('should update a feature toggle and invalidate cache', async () => {
        const mockToggle = {
          id: 'toggle-1',
          key: 'test_feature',
          value: false,
          description: 'Test feature',
          target: AppTarget.ALL,
          updatedAt: new Date(),
        };

        const updatedToggle = {
          ...mockToggle,
          value: true,
        };

        mockPrismaService.featureToggle.findUnique.mockResolvedValue(mockToggle);
        mockPrismaService.featureToggle.update.mockResolvedValue(updatedToggle);

        const result = await service.updateFeatureToggle('test_feature', {
          value: true,
        });

        expect(result.value).toBe(true);
        expect(mockCacheService.del).toHaveBeenCalledWith('feature_toggle:test_feature');
      });

      it('should throw NotFoundException if toggle does not exist', async () => {
        mockPrismaService.featureToggle.findUnique.mockResolvedValue(null);

        await expect(
          service.updateFeatureToggle('nonexistent', { value: true }),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('Blocks', () => {
    describe('getBlock', () => {
      it('should return cached block if available', async () => {
        const mockBlock = {
          id: 'block-1',
          type: BlockType.HEADER,
          target: AppTarget.WEB_DIRECTORY,
          schemaVersion: 1,
          settingsJson: { logo: 'logo.png' },
          isEnabled: true,
          updatedAt: new Date(),
        };

        mockCacheService.get.mockResolvedValue(mockBlock);

        const result = await service.getBlock(
          BlockType.HEADER,
          AppTarget.WEB_DIRECTORY,
        );

        expect(result).toEqual(mockBlock);
        expect(mockCacheService.get).toHaveBeenCalledWith(
          'block:HEADER:WEB_DIRECTORY',
        );
      });

      it('should fetch from database and cache if not in cache', async () => {
        const mockBlock = {
          id: 'block-1',
          type: BlockType.HEADER,
          target: AppTarget.WEB_DIRECTORY,
          schemaVersion: 1,
          settingsJson: { logo: 'logo.png' },
          isEnabled: true,
          updatedAt: new Date(),
        };

        mockCacheService.get.mockResolvedValue(null);
        mockPrismaService.block.findUnique.mockResolvedValue(mockBlock);

        const result = await service.getBlock(
          BlockType.HEADER,
          AppTarget.WEB_DIRECTORY,
        );

        expect(result).toEqual(mockBlock);
        expect(mockCacheService.set).toHaveBeenCalled();
      });

      it('should return null if block does not exist', async () => {
        mockCacheService.get.mockResolvedValue(null);
        mockPrismaService.block.findUnique.mockResolvedValue(null);

        const result = await service.getBlock(
          BlockType.HEADER,
          AppTarget.WEB_DIRECTORY,
        );

        expect(result).toBeNull();
      });
    });

    describe('createBlock', () => {
      it('should create a new block', async () => {
        const dto = {
          type: BlockType.HEADER,
          target: AppTarget.WEB_DIRECTORY,
          schemaVersion: 1,
          settingsJson: { logo: 'logo.png' },
          isEnabled: true,
        };

        const mockBlock = {
          id: 'block-1',
          ...dto,
          updatedAt: new Date(),
        };

        mockPrismaService.block.findUnique.mockResolvedValue(null);
        mockPrismaService.block.create.mockResolvedValue(mockBlock);

        const result = await service.createBlock(dto);

        expect(result).toEqual(mockBlock);
        expect(mockCacheService.set).toHaveBeenCalled();
      });

      it('should throw ConflictException if block already exists', async () => {
        const dto = {
          type: BlockType.HEADER,
          target: AppTarget.WEB_DIRECTORY,
          settingsJson: { logo: 'logo.png' },
        };

        mockPrismaService.block.findUnique.mockResolvedValue({
          id: 'block-1',
          type: BlockType.HEADER,
          target: AppTarget.WEB_DIRECTORY,
          schemaVersion: 1,
          settingsJson: { logo: 'logo.png' },
          isEnabled: true,
          updatedAt: new Date(),
        });

        await expect(service.createBlock(dto)).rejects.toThrow(ConflictException);
      });
    });

    describe('updateBlock', () => {
      it('should update a block and invalidate cache', async () => {
        const mockBlock = {
          id: 'block-1',
          type: BlockType.HEADER,
          target: AppTarget.WEB_DIRECTORY,
          schemaVersion: 1,
          settingsJson: { logo: 'old-logo.png' },
          isEnabled: true,
          updatedAt: new Date(),
        };

        const updatedBlock = {
          ...mockBlock,
          settingsJson: { logo: 'new-logo.png' },
        };

        mockPrismaService.block.findUnique.mockResolvedValue(mockBlock);
        mockPrismaService.block.update.mockResolvedValue(updatedBlock);

        const result = await service.updateBlock('block-1', {
          settingsJson: { logo: 'new-logo.png' },
        });

        expect(result.settingsJson).toEqual({ logo: 'new-logo.png' });
        expect(mockCacheService.del).toHaveBeenCalledWith(
          'block:HEADER:WEB_DIRECTORY',
        );
      });

      it('should throw NotFoundException if block does not exist', async () => {
        mockPrismaService.block.findUnique.mockResolvedValue(null);

        await expect(
          service.updateBlock('nonexistent', { isEnabled: false }),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
