import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewService } from '../services';
import {
  CreateReviewDto,
  UpdateReviewDto,
  GetReviewsDto,
  ModerateReviewDto,
  ReviewResponseDto,
  PaginatedReviewsDto,
  BusinessRatingDto,
} from '../dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * Create a new review
   * Requires authentication
   */
  @Post()
  @Roles(UserRole.USER, UserRole.ADMIN)
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: any,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.create(createReviewDto, req.user.userId);
  }

  /**
   * Get reviews for a business (public endpoint)
   */
  @Get('business')
  @Public()
  async getForBusiness(
    @Query() query: GetReviewsDto,
  ): Promise<PaginatedReviewsDto> {
    return this.reviewService.getForBusiness(query);
  }

  /**
   * Get business rating statistics (public endpoint)
   */
  @Get('business/:businessId/rating')
  @Public()
  async getBusinessRating(
    @Param('businessId') businessId: string,
  ): Promise<BusinessRatingDto> {
    return this.reviewService.getBusinessRating(businessId);
  }

  /**
   * Get a single review by ID (public endpoint)
   */
  @Get(':id')
  @Public()
  async findById(@Param('id') id: string): Promise<ReviewResponseDto> {
    return this.reviewService.findById(id);
  }

  /**
   * Update a review (only by author)
   */
  @Put(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req: any,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.update(id, updateReviewDto, req.user.userId);
  }

  /**
   * Delete a review (by author or admin)
   */
  @Delete(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  async delete(@Param('id') id: string, @Request() req: any): Promise<void> {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.reviewService.delete(id, req.user.userId, isAdmin);
  }

  /**
   * Moderate a review (admin only)
   */
  @Put(':id/moderate')
  @Roles(UserRole.ADMIN)
  async moderate(
    @Param('id') id: string,
    @Body() moderateReviewDto: ModerateReviewDto,
    @Request() req: any,
  ): Promise<ReviewResponseDto> {
    return this.reviewService.moderate(id, moderateReviewDto, req.user.userId);
  }

  /**
   * Get pending reviews for moderation (admin only)
   */
  @Get('admin/pending')
  @Roles(UserRole.ADMIN)
  async getPendingReviews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedReviewsDto> {
    return this.reviewService.getPendingReviews(page, limit);
  }
}
