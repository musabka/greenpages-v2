import { Test, TestingModule } from '@nestjs/testing';
import { RewardsService } from './rewards.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notifications/services';
import { RewardAction } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('RewardsService', () => {
  let service: RewardsService;
  let prisma: PrismaService;
  let notificationService: NotificationService;

  const mockPrismaService = {
    rewardConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    pointTransaction: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationService = {
    notifyPointsEarned: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    prisma = module.get<PrismaService>(PrismaService);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('awardPoints', () => {
    it('should award points for a configured action', async () => {
      const userId = 'user-1';
      const action = RewardAction.SUBMIT_REVIEW;
      const config = {
        id: 'config-1',
        action,
        points: 10,
        description: 'Points for review',
        isActive: true,
        updatedAt: new Date(),
      };
      const transaction = {
        id: 'tx-1',
        userId,
        action,
        points: 10,
        metadata: {},
        createdAt: new Date(),
      };

      mockPrismaService.rewardConfig.findUnique.mockResolvedValue(config);
      mockPrismaService.pointTransaction.create.mockResolvedValue(transaction);
      mockPrismaService.user.update.mockResolvedValue({ id: userId, points: 10 });

      const result = await service.awardPoints(userId, action);

      expect(result).toEqual(transaction);
      expect(mockPrismaService.rewardConfig.findUnique).toHaveBeenCalledWith({
        where: { action },
      });
      expect(mockPrismaService.pointTransaction.create).toHaveBeenCalled();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { points: { increment: 10 } },
      });
    });

    it('should return null if action is not configured', async () => {
      const userId = 'user-1';
      const action = RewardAction.SUBMIT_REVIEW;

      mockPrismaService.rewardConfig.findUnique.mockResolvedValue(null);

      const result = await service.awardPoints(userId, action);

      expect(result).toBeNull();
      expect(mockPrismaService.pointTransaction.create).not.toHaveBeenCalled();
    });

    it('should return null if action is not active', async () => {
      const userId = 'user-1';
      const action = RewardAction.SUBMIT_REVIEW;
      const config = {
        id: 'config-1',
        action,
        points: 10,
        description: 'Points for review',
        isActive: false,
        updatedAt: new Date(),
      };

      mockPrismaService.rewardConfig.findUnique.mockResolvedValue(config);

      const result = await service.awardPoints(userId, action);

      expect(result).toBeNull();
      expect(mockPrismaService.pointTransaction.create).not.toHaveBeenCalled();
    });

    it('should prevent duplicate first review of day award', async () => {
      const userId = 'user-1';
      const action = RewardAction.FIRST_REVIEW_OF_DAY;
      const config = {
        id: 'config-1',
        action,
        points: 20,
        description: 'First review bonus',
        isActive: true,
        updatedAt: new Date(),
      };
      const existingTransaction = {
        id: 'tx-1',
        userId,
        action,
        points: 20,
        metadata: {},
        createdAt: new Date(),
      };

      mockPrismaService.rewardConfig.findUnique.mockResolvedValue(config);
      mockPrismaService.pointTransaction.findFirst.mockResolvedValue(existingTransaction);

      const result = await service.awardPoints(userId, action);

      expect(result).toBeNull();
      expect(mockPrismaService.pointTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe('getBalance', () => {
    it('should return user points balance', async () => {
      const userId = 'user-1';
      const user = { points: 150 };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.getBalance(userId);

      expect(result).toBe(150);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { points: true },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'user-1';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getBalance(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserLevel', () => {
    it('should calculate user level and badge correctly', async () => {
      const userId = 'user-1';
      const user = { points: 250 };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.getUserLevel(userId);

      expect(result).toEqual({
        level: 3,
        badge: 'Bronze',
        totalPoints: 250,
        nextLevelPoints: 300,
      });
    });

    it('should assign correct badge for high level users', async () => {
      const userId = 'user-1';
      const user = { points: 5000 };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.getUserLevel(userId);

      expect(result).toEqual({
        level: 51,
        badge: 'Diamond',
        totalPoints: 5000,
        nextLevelPoints: 5100,
      });
    });
  });

  describe('updateConfig', () => {
    it('should update existing reward config', async () => {
      const action = RewardAction.SUBMIT_REVIEW;
      const updateDto = { points: 15, description: 'Updated description' };
      const config = {
        id: 'config-1',
        action,
        points: 15,
        description: 'Updated description',
        isActive: true,
        updatedAt: new Date(),
      };

      mockPrismaService.rewardConfig.upsert.mockResolvedValue(config);

      const result = await service.updateConfig(action, updateDto);

      expect(result.description).toBe('Updated description');
      expect(result.points).toBe(15);
      expect(mockPrismaService.rewardConfig.upsert).toHaveBeenCalled();
    });
  });

  describe('awardPointsForReview', () => {
    it('should award review points and first review bonus', async () => {
      const userId = 'user-1';
      const reviewConfig = {
        id: 'config-1',
        action: RewardAction.SUBMIT_REVIEW,
        points: 10,
        description: 'Review points',
        isActive: true,
        updatedAt: new Date(),
      };
      const bonusConfig = {
        id: 'config-2',
        action: RewardAction.FIRST_REVIEW_OF_DAY,
        points: 20,
        description: 'First review bonus',
        isActive: true,
        updatedAt: new Date(),
      };
      const reviewTransaction = {
        id: 'tx-1',
        userId,
        action: RewardAction.SUBMIT_REVIEW,
        points: 10,
        metadata: {},
        createdAt: new Date(),
      };
      const bonusTransaction = {
        id: 'tx-2',
        userId,
        action: RewardAction.FIRST_REVIEW_OF_DAY,
        points: 20,
        metadata: {},
        createdAt: new Date(),
      };

      mockPrismaService.rewardConfig.findUnique
        .mockResolvedValueOnce(reviewConfig)
        .mockResolvedValueOnce(bonusConfig);
      mockPrismaService.pointTransaction.findFirst.mockResolvedValue(null);
      mockPrismaService.pointTransaction.create
        .mockResolvedValueOnce(reviewTransaction)
        .mockResolvedValueOnce(bonusTransaction);
      mockPrismaService.user.update.mockResolvedValue({ id: userId, points: 30 });

      const result = await service.awardPointsForReview(userId);

      expect(result.reviewPoints).toEqual(reviewTransaction);
      expect(result.bonusPoints).toEqual(bonusTransaction);
    });

    it('should only award review points if first review bonus already claimed', async () => {
      const userId = 'user-1';
      const reviewConfig = {
        id: 'config-1',
        action: RewardAction.SUBMIT_REVIEW,
        points: 10,
        description: 'Review points',
        isActive: true,
        updatedAt: new Date(),
      };
      const bonusConfig = {
        id: 'config-2',
        action: RewardAction.FIRST_REVIEW_OF_DAY,
        points: 20,
        description: 'First review bonus',
        isActive: true,
        updatedAt: new Date(),
      };
      const reviewTransaction = {
        id: 'tx-1',
        userId,
        action: RewardAction.SUBMIT_REVIEW,
        points: 10,
        metadata: {},
        createdAt: new Date(),
      };
      const existingBonus = {
        id: 'tx-old',
        userId,
        action: RewardAction.FIRST_REVIEW_OF_DAY,
        points: 20,
        metadata: {},
        createdAt: new Date(),
      };

      mockPrismaService.rewardConfig.findUnique
        .mockResolvedValueOnce(reviewConfig)
        .mockResolvedValueOnce(bonusConfig);
      mockPrismaService.pointTransaction.findFirst.mockResolvedValue(existingBonus);
      mockPrismaService.pointTransaction.create.mockResolvedValue(reviewTransaction);
      mockPrismaService.user.update.mockResolvedValue({ id: userId, points: 10 });

      const result = await service.awardPointsForReview(userId);

      expect(result.reviewPoints).toEqual(reviewTransaction);
      expect(result.bonusPoints).toBeNull();
    });
  });
});
