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
import { CityService } from '../services/city.service';
import {
  CreateCityDto,
  UpdateCityDto,
  CityResponseDto,
  CityWithDistrictsDto,
  LocaleQueryDto,
  ActiveFilterDto,
} from '../dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';

class CityFilterDto extends LocaleQueryDto {
  governorateId?: string;
}

@Controller('geo/cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post()
  @Roles('ADMIN')
  @Audit({ action: 'CREATE', entityType: 'City' })
  async create(@Body() dto: CreateCityDto): Promise<CityResponseDto> {
    return this.cityService.create(dto);
  }

  @Get()
  @Public()
  async findAll(
    @Query() filterDto: CityFilterDto,
    @Query() activeFilter: ActiveFilterDto,
  ): Promise<CityResponseDto[]> {
    return this.cityService.findAll(
      filterDto.locale,
      filterDto.governorateId,
      activeFilter.isActive,
    );
  }

  @Get(':id')
  @Public()
  async findById(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<CityResponseDto> {
    return this.cityService.findById(id, localeQuery.locale);
  }

  @Get('slug/:slug')
  @Public()
  async findBySlug(
    @Param('slug') slug: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<CityResponseDto> {
    return this.cityService.findBySlug(slug, localeQuery.locale);
  }

  @Get(':id/districts')
  @Public()
  async findWithDistricts(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<CityWithDistrictsDto> {
    return this.cityService.findWithDistricts(id, localeQuery.locale);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Audit({ action: 'UPDATE', entityType: 'City', entityIdParam: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCityDto,
  ): Promise<CityResponseDto> {
    return this.cityService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Audit({ action: 'DELETE', entityType: 'City', entityIdParam: 'id' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.cityService.delete(id);
  }
}
