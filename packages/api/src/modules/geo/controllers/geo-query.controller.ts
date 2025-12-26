import {
  Controller,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { GeoQueryService, BoundingBox, NearbyBusinessResult, GeoHierarchy } from '../services/geo-query.service';
import { Public } from '../../auth/decorators/public.decorator';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

class NearbyQueryDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng!: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(50000) // Max 50km
  @Type(() => Number)
  radius?: number = 5000; // Default 5km

  @IsOptional()
  @IsString()
  locale?: string = 'ar';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

class BoundingBoxQueryDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  north!: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  south!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  east!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  west!: number;

  @IsOptional()
  @IsString()
  locale?: string = 'ar';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 100;
}

class LocaleQueryDto {
  @IsOptional()
  @IsString()
  locale?: string = 'ar';
}

@Controller('geo')
export class GeoQueryController {
  constructor(private readonly geoQueryService: GeoQueryService) {}

  /**
   * Find businesses near a location
   * GET /geo/nearby?lat=31.5&lng=34.5&radius=5000&locale=ar
   */
  @Get('nearby')
  @Public()
  async findNearby(
    @Query() query: NearbyQueryDto,
  ): Promise<{ data: NearbyBusinessResult[]; total: number }> {
    if (!this.geoQueryService.validateCoordinates(query.lat, query.lng)) {
      throw new BadRequestException('Invalid coordinates');
    }

    const [data, total] = await Promise.all([
      this.geoQueryService.findNearestBusinesses(
        query.lat,
        query.lng,
        query.radius ?? 5000,
        query.locale,
        query.limit,
        query.offset,
      ),
      this.geoQueryService.countNearbyBusinesses(
        query.lat,
        query.lng,
        query.radius ?? 5000,
      ),
    ]);

    return { data, total };
  }

  /**
   * Find businesses within a bounding box (for map display)
   * GET /geo/bounds?north=32&south=31&east=35&west=34&locale=ar
   */
  @Get('bounds')
  @Public()
  async findWithinBounds(
    @Query() query: BoundingBoxQueryDto,
  ): Promise<NearbyBusinessResult[]> {
    // Validate bounding box
    if (query.north <= query.south) {
      throw new BadRequestException('North must be greater than south');
    }
    if (query.east <= query.west) {
      throw new BadRequestException('East must be greater than west');
    }

    const bounds: BoundingBox = {
      north: query.north,
      south: query.south,
      east: query.east,
      west: query.west,
    };

    return this.geoQueryService.findWithinBoundingBox(
      bounds,
      query.locale,
      query.limit,
    );
  }

  /**
   * Get full geographic hierarchy tree
   * GET /geo/hierarchy?locale=ar
   */
  @Get('hierarchy')
  @Public()
  async getHierarchy(@Query() query: LocaleQueryDto): Promise<GeoHierarchy> {
    return this.geoQueryService.getHierarchy(query.locale);
  }
}
