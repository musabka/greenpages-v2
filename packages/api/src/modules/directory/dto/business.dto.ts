import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  MinLength,
  MaxLength,
  IsLatitude,
  IsLongitude,
  IsEmail,
  IsUrl,
  Min,
  Max,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================
// Translation DTOs
// ============================================

export class BusinessTranslationDto {
  @IsString()
  locale!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}

// ============================================
// Working Hours DTOs
// ============================================

export class DayHoursDto {
  @IsString()
  open!: string; // "09:00"

  @IsString()
  close!: string; // "17:00"
}

export class WorkingHoursDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  mon?: DayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  tue?: DayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  wed?: DayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  thu?: DayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  fri?: DayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  sat?: DayHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  sun?: DayHoursDto;
}

// ============================================
// Create/Update DTOs
// ============================================

export class CreateBusinessDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug!: string;

  @IsString()
  categoryId!: string;

  @IsString()
  districtId!: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsNumber()
  @IsLatitude()
  lat!: number;

  @IsNumber()
  @IsLongitude()
  lng!: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessTranslationDto)
  translations!: BusinessTranslationDto[];
}

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours?: WorkingHoursDto;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessTranslationDto)
  translations?: BusinessTranslationDto[];
}


// ============================================
// Search DTOs
// ============================================

export enum BusinessSortBy {
  NEAREST = 'nearest',
  NEWEST = 'newest',
  FEATURED = 'featured',
  RATING = 'rating',
}

export class SearchBusinessDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  governorateId?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  districtId?: string;

  @IsOptional()
  @IsNumber()
  @IsLatitude()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @IsLongitude()
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(50000)
  @Type(() => Number)
  radius?: number; // in meters

  @IsOptional()
  @IsEnum(BusinessSortBy)
  sortBy?: BusinessSortBy = BusinessSortBy.NEWEST;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  locale?: string = 'ar';
}

// ============================================
// Response DTOs
// ============================================

export interface BusinessImageResponseDto {
  id: string;
  objectKey: string;
  mimeType: string;
  size: number;
  sortOrder: number;
  isPrimary: boolean;
  url?: string;
}

export interface BusinessTranslationResponseDto {
  locale: string;
  name: string;
  description: string | null;
  address: string | null;
}

export interface BusinessResponseDto {
  id: string;
  slug: string;
  categoryId: string;
  districtId: string;
  agentId: string | null;
  ownerId: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  phone2: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  workingHours: WorkingHoursDto | null;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Translated fields
  name: string;
  description: string | null;
  address: string | null;
  translations: BusinessTranslationResponseDto[];
  // Relations
  category?: {
    id: string;
    slug: string;
    name: string;
  };
  district?: {
    id: string;
    slug: string;
    name: string;
  };
  city?: {
    id: string;
    slug: string;
    name: string;
  };
  governorate?: {
    id: string;
    slug: string;
    name: string;
  };
  images?: BusinessImageResponseDto[];
}

export interface BusinessCardDto {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  whatsapp: string | null;
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  categoryName: string;
  districtName: string;
  cityName: string;
  governorateName: string;
  primaryImage?: string;
  distance?: number; // in meters, only for nearest sort
}

export interface PaginatedBusinessResult {
  data: BusinessCardDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
