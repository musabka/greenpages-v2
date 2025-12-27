import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AdService } from '../services/ad.service';
import {
  CreateAdCampaignDto,
  UpdateAdCampaignDto,
  CreateAdDto,
  UpdateAdDto,
  AdContextDto,
  AdCampaignResponseDto,
  AdResponseDto,
  AdPerformanceReportDto,
  AdPlacement,
} from '../dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';
import { IsEnum } from 'class-validator';

class PlacementQueryDto {
  @IsEnum(AdPlacement)
  placement!: AdPlacement;
}

@Controller('ads')
export class AdController {
  constructor(private readonly adService: AdService) {}

  // Campaign endpoints
  @Post('campaigns')
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'CREATE', entityType: 'AdCampaign' })
  async createCampaign(
    @Body() dto: CreateAdCampaignDto,
  ): Promise<AdCampaignResponseDto> {
    return this.adService.createCampaign(dto);
  }

  @Get('campaigns')
  @Roles('ADMIN', 'AGENT')
  async getAllCampaigns(): Promise<AdCampaignResponseDto[]> {
    return this.adService.getAllCampaigns();
  }

  @Get('campaigns/:id')
  @Roles('ADMIN', 'AGENT')
  async getCampaignById(@Param('id') id: string): Promise<AdCampaignResponseDto> {
    return this.adService.getCampaignById(id);
  }

  @Get('campaigns/business/:businessId')
  @Roles('ADMIN', 'AGENT')
  async getCampaignsByBusiness(
    @Param('businessId') businessId: string,
  ): Promise<AdCampaignResponseDto[]> {
    return this.adService.getCampaignsByBusiness(businessId);
  }

  @Put('campaigns/:id')
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'UPDATE', entityType: 'AdCampaign', entityIdParam: 'id' })
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateAdCampaignDto,
  ): Promise<AdCampaignResponseDto> {
    return this.adService.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  @Roles('ADMIN')
  @Audit({ action: 'DELETE', entityType: 'AdCampaign', entityIdParam: 'id' })
  async deleteCampaign(@Param('id') id: string): Promise<void> {
    return this.adService.deleteCampaign(id);
  }

  @Get('campaigns/:id/performance')
  @Roles('ADMIN', 'AGENT')
  async getPerformanceReport(
    @Param('id') id: string,
  ): Promise<AdPerformanceReportDto> {
    return this.adService.getPerformanceReport(id);
  }

  // Ad endpoints
  @Post('campaigns/:campaignId/ads')
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'CREATE', entityType: 'Ad' })
  async createAd(
    @Param('campaignId') campaignId: string,
    @Body() dto: CreateAdDto,
  ): Promise<AdResponseDto> {
    return this.adService.createAd(campaignId, dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'UPDATE', entityType: 'Ad', entityIdParam: 'id' })
  async updateAd(
    @Param('id') id: string,
    @Body() dto: UpdateAdDto,
  ): Promise<AdResponseDto> {
    return this.adService.updateAd(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Audit({ action: 'DELETE', entityType: 'Ad', entityIdParam: 'id' })
  async deleteAd(@Param('id') id: string): Promise<void> {
    return this.adService.deleteAd(id);
  }

  // Public endpoints for serving ads
  @Get('placement')
  @Public()
  async getAdsForPlacement(
    @Query() placementQuery: PlacementQueryDto,
    @Query() context: AdContextDto,
  ): Promise<AdResponseDto[]> {
    return this.adService.getAdsForPlacement(placementQuery.placement, context);
  }

  @Post(':id/impression')
  @Public()
  async recordImpression(@Param('id') id: string): Promise<void> {
    return this.adService.recordImpression(id);
  }

  @Post(':id/click')
  @Public()
  async recordClick(@Param('id') id: string): Promise<void> {
    return this.adService.recordClick(id);
  }
}
