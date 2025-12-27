import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { RewardAction } from '@prisma/client';
import { Type } from 'class-transformer';

export class AwardPointsDto {
  @IsEnum(RewardAction)
  action!: RewardAction;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class GetPointHistoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class UpdateRewardConfigDto {
  @IsInt()
  @Min(0)
  points!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class PointTransactionResponseDto {
  id!: string;
  userId!: string;
  action!: RewardAction;
  points!: number;
  metadata?: any;
  createdAt!: Date;
}

export class UserLevelResponseDto {
  level!: number;
  badge!: string;
  totalPoints!: number;
  nextLevelPoints!: number;
}

export class RewardConfigResponseDto {
  id!: string;
  action!: RewardAction;
  points!: number;
  description?: string;
  isActive!: boolean;
  updatedAt!: Date;
}
