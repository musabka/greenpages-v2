import {
  Controller,
  Get,
  Post,
  Param,
  Query,
} from '@nestjs/common';
import {
  GeoStatsService,
  GovernorateStatsResult,
  CityStatsResult,
  DistrictStatsResult,
} from '../services/geo-stats.service';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class LocaleQueryDto {
  @IsOptional()
  @IsString()
  locale?: string = 'ar';
}

class TopQueryDto extends LocaleQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

class TopCitiesQueryDto extends TopQueryDto {
  @IsOptional()
  @IsString()
  governorateId?: string;
}

class TopDistrictsQueryDto extends TopQueryDto {
  @IsOptional()
  @IsString()
  cityId?: string;
}

@Controller('geo/stats')
export class GeoStatsController {
  constructor(private readonly geoStatsService: GeoStatsService) {}

  /**
   * Get statistics for a specific governorate
   * GET /geo/stats/governorates/:id
   */
  @Get('governorates/:id')
  @Public()
  async getGovernorateStats(
    @Param('id') id: string,
    @Query() query: LocaleQueryDto,
  ): Promise<GovernorateStatsResult> {
    return this.geoStatsService.getGovernorateStats(id, query.locale);
  }

  /**
   * Get statistics for a specific city
   * GET /geo/stats/cities/:id
   */
  @Get('cities/:id')
  @Public()
  async getCityStats(
    @Param('id') id: string,
    @Query() query: LocaleQueryDto,
  ): Promise<CityStatsResult> {
    return this.geoStatsService.getCityStats(id, query.locale);
  }

  /**
   * Get statistics for a specific district
   * GET /geo/stats/districts/:id
   */
  @Get('districts/:id')
  @Public()
  async getDistrictStats(
    @Param('id') id: string,
    @Query() query: LocaleQueryDto,
  ): Promise<DistrictStatsResult> {
    return this.geoStatsService.getDistrictStats(id, query.locale);
  }

  /**
   * Get top governorates by active company count
   * GET /geo/stats/top/governorates?limit=10&locale=ar
   */
  @Get('top/governorates')
  @Public()
  async getTopGovernorates(
    @Query() query: TopQueryDto,
  ): Promise<GovernorateStatsResult[]> {
    return this.geoStatsService.getTopGovernorates(query.limit, query.locale);
  }

  /**
   * Get top cities by active company count
   * GET /geo/stats/top/cities?limit=10&locale=ar&governorateId=xxx
   */
  @Get('top/cities')
  @Public()
  async getTopCities(
    @Query() query: TopCitiesQueryDto,
  ): Promise<CityStatsResult[]> {
    return this.geoStatsService.getTopCities(
      query.limit,
      query.locale,
      query.governorateId,
    );
  }

  /**
   * Get top districts by active company count
   * GET /geo/stats/top/districts?limit=10&locale=ar&cityId=xxx
   */
  @Get('top/districts')
  @Public()
  async getTopDistricts(
    @Query() query: TopDistrictsQueryDto,
  ): Promise<DistrictStatsResult[]> {
    return this.geoStatsService.getTopDistricts(
      query.limit,
      query.locale,
      query.cityId,
    );
  }

  /**
   * Manually refresh all geographic statistics (Admin only)
   * POST /geo/stats/refresh
   */
  @Post('refresh')
  @Roles('ADMIN')
  async refreshAllStats(): Promise<{ message: string; timestamp: Date }> {
    return this.geoStatsService.refreshAllStats();
  }

  /**
   * Refresh stats for a specific governorate (Admin only)
   * POST /geo/stats/governorates/:id/refresh
   */
  @Post('governorates/:id/refresh')
  @Roles('ADMIN')
  async refreshGovernorateStats(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.geoStatsService.refreshGovernorateStats(id);
    return { message: `Stats for governorate ${id} refreshed successfully` };
  }

  /**
   * Refresh stats for a specific city (Admin only)
   * POST /geo/stats/cities/:id/refresh
   */
  @Post('cities/:id/refresh')
  @Roles('ADMIN')
  async refreshCityStats(@Param('id') id: string): Promise<{ message: string }> {
    await this.geoStatsService.refreshCityStats(id);
    return { message: `Stats for city ${id} refreshed successfully` };
  }

  /**
   * Refresh stats for a specific district (Admin only)
   * POST /geo/stats/districts/:id/refresh
   */
  @Post('districts/:id/refresh')
  @Roles('ADMIN')
  async refreshDistrictStats(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.geoStatsService.refreshDistrictStats(id);
    return { message: `Stats for district ${id} refreshed successfully` };
  }
}
