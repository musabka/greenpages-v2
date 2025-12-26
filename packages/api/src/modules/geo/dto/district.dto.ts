import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TranslationDto } from './common.dto';

export class CreateDistrictDto {
  @IsString()
  cityId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations!: TranslationDto[];
}

export class UpdateDistrictDto {
  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  slug?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];
}

export interface DistrictResponseDto {
  id: string;
  slug: string;
  cityId: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  name: string;
  translations: { locale: string; name: string }[];
  city?: {
    id: string;
    slug: string;
    name: string;
    governorate?: {
      id: string;
      slug: string;
      name: string;
    };
  };
}

export interface DistrictWithHierarchyDto extends DistrictResponseDto {
  hierarchy: {
    governorate: { id: string; slug: string; name: string };
    city: { id: string; slug: string; name: string };
    district: { id: string; slug: string; name: string };
  };
}
