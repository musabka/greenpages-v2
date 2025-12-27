import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ReviewSortBy {
  NEWEST = 'newest',
  HIGHEST = 'highest',
  LOWEST = 'lowest',
}

export class CreateReviewDto {
  @IsUUID()
  businessId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  text?: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  text?: string;
}

export class GetReviewsDto {
  @IsUUID()
  businessId!: string;

  @IsOptional()
  @IsEnum(ReviewSortBy)
  sortBy?: ReviewSortBy = ReviewSortBy.NEWEST;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class ModerateReviewDto {
  @IsEnum(ReviewStatus)
  status!: ReviewStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

export interface ReviewResponseDto {
  id: string;
  businessId: string;
  userId: string;
  rating: number;
  text?: string;
  status: ReviewStatus;
  moderatedBy?: string;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
  };
}

export interface PaginatedReviewsDto {
  data: ReviewResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BusinessRatingDto {
  businessId: string;
  avgRating: number;
  reviewCount: number;
}
