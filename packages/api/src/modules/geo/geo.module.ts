import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { 
  GovernorateService, 
  CityService, 
  DistrictService, 
  GeoQueryService,
  GeoStatsService 
} from './services';
import {
  GovernorateController,
  CityController,
  DistrictController,
  GeoQueryController,
  GeoStatsController,
} from './controllers';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [
    GovernorateController, 
    CityController, 
    DistrictController, 
    GeoQueryController,
    GeoStatsController,
  ],
  providers: [
    GovernorateService, 
    CityService, 
    DistrictService, 
    GeoQueryService,
    GeoStatsService,
  ],
  exports: [
    GovernorateService, 
    CityService, 
    DistrictService, 
    GeoQueryService,
    GeoStatsService,
  ],
})
export class GeoModule {}
