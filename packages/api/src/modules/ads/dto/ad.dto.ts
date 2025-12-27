import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AdPlacement {
  SEARCH_SPONSORED = 'SEARCH_SPONSORED',
  HOME_HERO = 'HOME_HERO',
  CATEGORY_BANNER = 'CATEGORY_BANNER',
  PROFILE_SIDEBAR = 'PROFILE_SIDEBAR',
  MAP_PIN_HIGHLIGHT = 'MAP_PIN_HIGHLIGHT',
  SEARCH_AUTOCOMPLETE = 'SEARCH_AUTOCOMPLETE',
}

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

export class CreateAdCampaignDto {
  @IsString()
  businessId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  budget!: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdDto)
  ads!: CreateAdDto[];
}

export class CreateAdDto {
  @IsEnum(AdPlacement)
  placement!: AdPlacement;

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
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  activeHoursStart?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  activeHoursEnd?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateAdCampaignDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  budget?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdDto {
  @IsOptional()
  @IsEnum(AdPlacement)
  placement?: AdPlacement;

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
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  activeHoursStart?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  activeHoursEnd?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdContextDto {
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
  @IsString()
  categoryId?: string;

  @IsEnum(DeviceType)
  deviceType!: DeviceType;
}

export interface AdResponseDto {
  id: string;
  campaignId: string;
  placement: AdPlacement;
  governorateId: string | null;
  cityId: string | null;
  districtId: string | null;
  categoryId: string | null;
  activeHoursStart: number | null;
  activeHoursEnd: number | null;
  impressions: number;
  clicks: number;
  isActive: boolean;
  business?: any; // Business data included for public ad serving
}

export interface AdCampaignResponseDto {
  id: string;
  businessId: string;
  budget: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ads: AdResponseDto[];
}

export interface AdPerformanceReportDto {
  campaignId: string;
  businessId: string;
  totalImpressions: number;
  totalClicks: number;
  ctr: number; // Click-through rate
  budget: number;
  startDate: string;
  endDate: string;
  adPerformance: {
    adId: string;
    placement: AdPlacement;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
}
