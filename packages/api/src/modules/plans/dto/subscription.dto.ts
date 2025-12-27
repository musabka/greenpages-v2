import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @IsString()
  businessId!: string;

  @IsString()
  planId!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class RenewSubscriptionDto {
  @IsString()
  planId!: string;
}

export interface SubscriptionResponseDto {
  id: string;
  businessId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  plan: {
    id: string;
    slug: string;
    name: string;
    price: number;
    durationDays: number;
  };
  business?: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface ActiveSubscriptionDto {
  id: string;
  planId: string;
  planSlug: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  daysRemaining: number;
  isExpired: boolean;
  features: Record<string, string | number | boolean>;
}

export class SubscriptionQueryDto {
  @IsOptional()
  @IsString()
  businessId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isExpired?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}

export interface PaginatedSubscriptionsDto {
  data: SubscriptionResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
