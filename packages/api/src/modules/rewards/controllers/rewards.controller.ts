import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RewardsService } from '../services';
import {
  AwardPointsDto,
  GetPointHistoryDto,
  UpdateRewardConfigDto,
  PointTransactionResponseDto,
  UserLevelResponseDto,
  RewardConfigResponseDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RewardAction } from '@prisma/client';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  /**
   * Get current user's points balance
   */
  @Get('balance')
  async getBalance(@CurrentUser('id') userId: string): Promise<{ balance: number }> {
    const balance = await this.rewardsService.getBalance(userId);
    return { balance };
  }

  /**
   * Get current user's point transaction history
   */
  @Get('history')
  async getHistory(
    @CurrentUser('id') userId: string,
    @Query() query: GetPointHistoryDto,
  ): Promise<{
    data: PointTransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.rewardsService.getHistory(userId, query.page, query.limit);
  }

  /**
   * Get current user's level and badge
   */
  @Get('level')
  async getUserLevel(@CurrentUser('id') userId: string): Promise<UserLevelResponseDto> {
    return this.rewardsService.getUserLevel(userId);
  }

  /**
   * Award points to current user (for testing/manual award by admin)
   */
  @Post('award')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async awardPoints(
    @CurrentUser('id') userId: string,
    @Body() dto: AwardPointsDto,
  ): Promise<PointTransactionResponseDto | { message: string }> {
    const result = await this.rewardsService.awardPoints(userId, dto.action, dto.metadata);
    if (!result) {
      return { message: 'Points not awarded - action not configured or already awarded today' };
    }
    return result;
  }

  /**
   * Get all reward configurations (admin only)
   */
  @Get('configs')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getAllConfigs(): Promise<RewardConfigResponseDto[]> {
    return this.rewardsService.getAllConfigs();
  }

  /**
   * Update reward configuration (admin only)
   */
  @Put('configs/:action')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateConfig(
    @Param('action') action: RewardAction,
    @Body() dto: UpdateRewardConfigDto,
  ): Promise<RewardConfigResponseDto> {
    return this.rewardsService.updateConfig(action, dto);
  }

  /**
   * Toggle reward configuration active status (admin only)
   */
  @Put('configs/:action/toggle')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async toggleConfig(
    @Param('action') action: RewardAction,
    @Query('isActive') isActive: string,
  ): Promise<RewardConfigResponseDto> {
    return this.rewardsService.toggleConfig(action, isActive === 'true');
  }

  /**
   * Initialize default reward configurations (admin only)
   */
  @Post('configs/initialize')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async initializeDefaultConfigs(): Promise<{ message: string }> {
    await this.rewardsService.initializeDefaultConfigs();
    return { message: 'Default reward configurations initialized' };
  }
}
