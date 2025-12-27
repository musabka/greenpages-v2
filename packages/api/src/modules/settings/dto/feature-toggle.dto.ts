import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { AppTarget } from '@prisma/client';

export class CreateFeatureToggleDto {
  @IsString()
  key!: string;

  @IsBoolean()
  value!: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AppTarget)
  target!: AppTarget;
}

export class UpdateFeatureToggleDto {
  @IsOptional()
  @IsBoolean()
  value?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AppTarget)
  target?: AppTarget;
}

export class FeatureToggleResponseDto {
  id!: string;
  key!: string;
  value!: boolean;
  description?: string;
  target!: AppTarget;
  updatedAt!: Date;
}
