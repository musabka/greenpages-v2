import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsInt,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Plan Feature Keys - defines what features a plan can have
export enum PlanFeatureKey {
  MAX_IMAGES = 'max_images',
  SHOW_WHATSAPP = 'show_whatsapp',
  SHOW_WORKING_HOURS = 'show_working_hours',
  MAP_PIN_VISIBLE = 'map_pin_visible',
  SEARCH_PRIORITY = 'search_priority',
  PROFILE_HIGHLIGHT = 'profile_highlight',
  SHOW_WEBSITE = 'show_website',
  SHOW_EMAIL = 'show_email',
}

export class PlanTranslationDto {
  @IsString()
  locale!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class PlanFeatureDto {
  @IsString()
  @IsEnum(PlanFeatureKey)
  featureKey!: string;

  @IsString()
  featureValue!: string;
}

export class CreatePlanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationDays!: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number = 0;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanTranslationDto)
  translations!: PlanTranslationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureDto)
  features?: PlanFeatureDto[];
}


export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationDays?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanTranslationDto)
  translations?: PlanTranslationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanFeatureDto)
  features?: PlanFeatureDto[];
}

export interface PlanFeatureResponseDto {
  featureKey: string;
  featureValue: string;
}

export interface PlanResponseDto {
  id: string;
  slug: string;
  price: number;
  durationDays: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  name: string;
  description: string | null;
  translations: { locale: string; name: string; description: string | null }[];
  features: PlanFeatureResponseDto[];
}

export interface PlanListResponseDto {
  id: string;
  slug: string;
  price: number;
  durationDays: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  name: string;
  description: string | null;
  featureCount: number;
}
