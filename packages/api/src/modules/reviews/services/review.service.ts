import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RewardsService } from '../../rewards/services';
import {
  CreateReviewDto,
  UpdateReviewDto,
  GetReviewsDto,
  ModerateReviewDto,
  ReviewResponseDto,
  PaginatedReviewsDto,
  BusinessRatingDto,
  ReviewStatus,
  ReviewSortBy,
} from '../dto';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardsService: RewardsService,
  ) {}

  /**
   * Create a new review
   * Validates duplicate review prevention (same user, same business within 30 days)
   */
  async create(
    data: CreateReviewDto,
    userId: string,
  ): Promise<ReviewResponseDto> {
    // Check if business exists
    const business = await this.prisma.business.findUnique({
      where: { id: data.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Check for duplicate review within 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingReview = await this.prisma.review.findFirst({
      where: {
        businessId: data.businessId,
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'You have already reviewed this business within the last 30 days',
      );
    }

    // Create the review
    const review = await this.prisma.review.create({
      data: {
        businessId: data.businessId,
        userId,
        rating: data.rating,
        text: data.text,
        status: ReviewStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Award points for submitting review (including first review of day bonus if applicable)
    try {
      const pointsResult = await this.rewardsService.awardPointsForReview(
        userId,
        { reviewId: review.id, businessId: data.businessId },
      );
      
      if (pointsResult.reviewPoints) {
        this.logger.log(
          `Awarded ${pointsResult.reviewPoints.points} points to user ${userId} for review`,
        );
      }
      
      if (pointsResult.bonusPoints) {
        this.logger.log(
          `Awarded ${pointsResult.bonusPoints.points} bonus points to user ${userId} for first review of day`,
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to award points for review: ${errorMessage}`);
      // Don't fail the review creation if points award fails
    }

    // Update business rating cache (only count approved reviews)
    await this.updateBusinessRating(data.businessId);

    return this.mapToResponseDto(review);
  }

  /**
   * Get reviews for a business with pagination and sorting
   */
  async getForBusiness(
    query: GetReviewsDto,
  ): Promise<PaginatedReviewsDto> {
    const { businessId, sortBy = ReviewSortBy.NEWEST, page = 1, limit = 10 } = query;

    // Build order by clause
    let orderBy: any = { createdAt: 'desc' }; // Default: newest

    if (sortBy === ReviewSortBy.HIGHEST) {
      orderBy = { rating: 'desc' };
    } else if (sortBy === ReviewSortBy.LOWEST) {
      orderBy = { rating: 'asc' };
    }

    // Only show approved reviews to public
    const where = {
      businessId,
      status: ReviewStatus.APPROVED,
    };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map(this.mapToResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single review by ID
   */
  async findById(id: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.mapToResponseDto(review);
  }

  /**
   * Update a review (only by the author)
   */
  async update(
    id: string,
    data: UpdateReviewDto,
    userId: string,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        rating: data.rating,
        text: data.text,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Update business rating cache if rating changed
    if (data.rating !== undefined && review.status === ReviewStatus.APPROVED) {
      await this.updateBusinessRating(review.businessId);
    }

    return this.mapToResponseDto(updated);
  }

  /**
   * Delete a review (only by the author or admin)
   */
  async delete(id: string, userId: string, isAdmin: boolean): Promise<void> {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    const businessId = review.businessId;
    const wasApproved = review.status === ReviewStatus.APPROVED;

    await this.prisma.review.delete({
      where: { id },
    });

    // Update business rating cache if the deleted review was approved
    if (wasApproved) {
      await this.updateBusinessRating(businessId);
    }
  }

  /**
   * Moderate a review (approve, reject, or flag)
   */
  async moderate(
    id: string,
    data: ModerateReviewDto,
    adminId: string,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const previousStatus = review.status;

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        status: data.status,
        moderatedBy: adminId,
        moderatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Update business rating if status changed to/from APPROVED
    if (
      previousStatus !== data.status &&
      (previousStatus === ReviewStatus.APPROVED ||
        data.status === ReviewStatus.APPROVED)
    ) {
      await this.updateBusinessRating(review.businessId);
    }

    return this.mapToResponseDto(updated);
  }

  /**
   * Get all pending reviews for moderation
   */
  async getPendingReviews(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedReviewsDto> {
    const where = { status: ReviewStatus.PENDING };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },
          business: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map(this.mapToResponseDto),
      total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Calculate and update business average rating
   * Only counts APPROVED reviews
   */
  async updateBusinessRating(businessId: string): Promise<BusinessRatingDto> {
    const result = await this.prisma.review.aggregate({
      where: {
        businessId,
        status: ReviewStatus.APPROVED,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    const avgRating = result._avg.rating || 0;
    const reviewCount = result._count.id;

    // Update business record
    await this.prisma.business.update({
      where: { id: businessId },
      data: {
        avgRating,
        reviewCount,
      },
    });

    return {
      businessId,
      avgRating,
      reviewCount,
    };
  }

  /**
   * Get business rating statistics
   */
  async getBusinessRating(businessId: string): Promise<BusinessRatingDto> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        avgRating: true,
        reviewCount: true,
      },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return {
      businessId: business.id,
      avgRating: business.avgRating,
      reviewCount: business.reviewCount,
    };
  }

  /**
   * Map Prisma review to response DTO
   */
  private mapToResponseDto(review: any): ReviewResponseDto {
    return {
      id: review.id,
      businessId: review.businessId,
      userId: review.userId,
      rating: review.rating,
      text: review.text,
      status: review.status as ReviewStatus,
      moderatedBy: review.moderatedBy,
      moderatedAt: review.moderatedAt,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user,
    };
  }
}
