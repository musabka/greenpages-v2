import { IsString, IsBoolean, IsOptional, IsEnum, IsObject, IsInt } from 'class-validator';
import { AppTarget, BlockType } from '@prisma/client';

export class CreateBlockDto {
  @IsEnum(BlockType)
  type!: BlockType;

  @IsEnum(AppTarget)
  target!: AppTarget;

  @IsOptional()
  @IsInt()
  schemaVersion?: number;

  @IsObject()
  settingsJson!: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateBlockDto {
  @IsOptional()
  @IsInt()
  schemaVersion?: number;

  @IsOptional()
  @IsObject()
  settingsJson?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class BlockResponseDto {
  id!: string;
  type!: BlockType;
  target!: AppTarget;
  schemaVersion!: number;
  settingsJson!: Record<string, any>;
  isEnabled!: boolean;
  updatedAt!: Date;
}
