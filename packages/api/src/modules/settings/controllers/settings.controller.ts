import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from '../services';
import {
  CreateFeatureToggleDto,
  UpdateFeatureToggleDto,
  CreateBlockDto,
  UpdateBlockDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';
import { RolesGuard } from '../../auth/guards';
import { UserRole, AppTarget, BlockType } from '@prisma/client';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ============================================
  // Feature Toggles
  // ============================================

  @Get('toggles')
  @Roles(UserRole.ADMIN)
  async getAllToggles() {
    return this.settingsService.getAllToggles();
  }

  @Get('toggles/:key')
  async getFeatureToggle(@Param('key') key: string) {
    const value = await this.settingsService.getFeatureToggle(key);
    return { key, value };
  }

  @Post('toggles')
  @Roles(UserRole.ADMIN)
  async createFeatureToggle(@Body() dto: CreateFeatureToggleDto) {
    return this.settingsService.createFeatureToggle(dto);
  }

  @Put('toggles/:key')
  @Roles(UserRole.ADMIN)
  async updateFeatureToggle(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureToggleDto,
  ) {
    return this.settingsService.updateFeatureToggle(key, dto);
  }

  @Delete('toggles/:key')
  @Roles(UserRole.ADMIN)
  async deleteFeatureToggle(@Param('key') key: string) {
    await this.settingsService.deleteFeatureToggle(key);
    return { message: 'Feature toggle deleted successfully' };
  }

  // ============================================
  // Blocks
  // ============================================

  @Get('blocks')
  @Roles(UserRole.ADMIN)
  async getAllBlocks() {
    return this.settingsService.getAllBlocks();
  }

  @Get('blocks/:type/:target')
  async getBlock(
    @Param('type') type: BlockType,
    @Param('target') target: AppTarget,
  ) {
    return this.settingsService.getBlock(type, target);
  }

  @Post('blocks')
  @Roles(UserRole.ADMIN)
  async createBlock(@Body() dto: CreateBlockDto) {
    return this.settingsService.createBlock(dto);
  }

  @Put('blocks/:id')
  @Roles(UserRole.ADMIN)
  async updateBlock(@Param('id') id: string, @Body() dto: UpdateBlockDto) {
    return this.settingsService.updateBlock(id, dto);
  }

  @Delete('blocks/:id')
  @Roles(UserRole.ADMIN)
  async deleteBlock(@Param('id') id: string) {
    await this.settingsService.deleteBlock(id);
    return { message: 'Block deleted successfully' };
  }
}
