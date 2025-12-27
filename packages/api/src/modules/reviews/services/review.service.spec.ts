import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RewardsService } from '../../rewards/services';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReviewStatus } from '../dto';

describe('ReviewService', () => {
  let service: ReviewService;
  let prisma: PrismaService;
  let rewardsService: RewardsService;

  const mockPrismaService = {
    business: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockRewardsService = {
    awardPointsForReview: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RewardsService,
          useValue: mockRewardsService,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    prisma = module.get<PrismaService>(PrismaService);
    rewardsService = module.get<RewardsService>(RewardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a review successfully', async () => {
      const createDto = {
        businessId: 'business-1',
        rating: 5,
        text: 'Great service!',
      };
      const userId = 'user-1';

      mockPrismaService.business.findUnique.mockResolvedValue({
        id: 'business-1',
        name: 'Test Business',
      });

      mockPrismaService.review.findFirst.mockResolvedValue(null);

      const createdReview = {
        id: 'review-1',
        businessId: 'business-1',
        userId: 'user-1',
        rating: 5,
        text: 'Great service!',
        status: ReviewStatus.PENDING,
        moderatedBy: null,
        moderatedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
      };

      mockPrismaService.review.create.mockResolvedValue(createdReview);
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: { id: 1 },
      });
      mockPrismaService.business.update.mockResolvedValue({});
      mockRewardsService.awardPointsForReview.mockResolvedValue({
        reviewPoints: { id: 'tx-1', points: 10 },
        bonusPoints: null,
      });

      const result = await service.create(createDto, userId);

      expect(result.id).toBe('review-1');
      expect(mockRewardsService.awardPointsForReview).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ businessId: 'business-1' }),
      );
      expect(result.rating).toBe(5);
      expect(result.status).toBe(ReviewStatus.PENDING);
      expect(mockPrismaService.review.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if business does not exist', async () => {
      const createDto = {
        businessId: 'non-existent',
        rating: 5,
        text: 'Great service!',
      };
      const userId = 'user-1';

      mockPrismaService.business.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for duplicate review within 30 days', async () => {
      const createDto = {
        businessId: 'business-1',
        rating: 5,
        text: 'Great service!',
      };
      const userId = 'user-1';

      mockPrismaService.business.findUnique.mockResolvedValue({
        id: 'business-1',
      });

      mockPrismaService.review.findFirst.mockResolvedValue({
        id: 'existing-review',
        businessId: 'business-1',
        userId: 'user-1',
        createdAt: new Date(),
      });

      await expect(service.create(createDto, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateBusinessRating', () => {
    it('should calculate and update average rating correctly', async () => {
      const businessId = 'business-1';

      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { id: 10 },
      });

      mockPrismaService.business.update.mockResolvedValue({
        id: businessId,
        avgRating: 4.5,
        reviewCount: 10,
      });

      const result = await service.updateBusinessRating(businessId);

      expect(result.avgRating).toBe(4.5);
      expect(result.reviewCount).toBe(10);
      expect(mockPrismaService.business.update).toHaveBeenCalledWith({
        where: { id: businessId },
        data: {
          avgRating: 4.5,
          reviewCount: 10,
        },
      });
    });

    it('should handle business with no approved reviews', async () => {
      const businessId = 'business-1';

      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { id: 0 },
      });

      mockPrismaService.business.update.mockResolvedValue({
        id: businessId,
        avgRating: 0,
        reviewCount: 0,
      });

      const result = await service.updateBusinessRating(businessId);

      expect(result.avgRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });
  });

  describe('moderate', () => {
    it('should approve a review and update business rating', async () => {
      const reviewId = 'review-1';
      const adminId = 'admin-1';

      const existingReview = {
        id: reviewId,
        businessId: 'business-1',
        status: ReviewStatus.PENDING,
      };

      mockPrismaService.review.findUnique.mockResolvedValue(existingReview);

      const updatedReview = {
        ...existingReview,
        status: ReviewStatus.APPROVED,
        moderatedBy: adminId,
        moderatedAt: new Date(),
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
      };

      mockPrismaService.review.update.mockResolvedValue(updatedReview);
      mockPrismaService.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: { id: 5 },
      });
      mockPrismaService.business.update.mockResolvedValue({});

      const result = await service.moderate(
        reviewId,
        { status: ReviewStatus.APPROVED },
        adminId,
      );

      expect(result.status).toBe(ReviewStatus.APPROVED);
      expect(mockPrismaService.review.update).toHaveBeenCalled();
    });
  });
});
