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
import { DistrictService } from '../services/district.service';
import {
  CreateDistrictDto,
  UpdateDistrictDto,
  DistrictResponseDto,
  DistrictWithHierarchyDto,
  LocaleQueryDto,
  ActiveFilterDto,
} from '../dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';

class DistrictFilterDto extends LocaleQueryDto {
  cityId?: string;
  governorateId?: string;
}

@Controller('geo/districts')
export class DistrictController {
  constructor(private readonly districtService: DistrictService) {}

  @Post()
  @Roles('ADMIN')
  @Audit({ action: 'CREATE', entityType: 'District' })
  async create(@Body() dto: CreateDistrictDto): Promise<DistrictResponseDto> {
    return this.districtService.create(dto);
  }

  @Get()
  @Public()
  async findAll(
    @Query() filterDto: DistrictFilterDto,
    @Query() activeFilter: ActiveFilterDto,
  ): Promise<DistrictResponseDto[]> {
    return this.districtService.findAll(
      filterDto.locale,
      filterDto.cityId,
      filterDto.governorateId,
      activeFilter.isActive,
    );
  }

  @Get(':id')
  @Public()
  async findById(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<DistrictResponseDto> {
    return this.districtService.findById(id, localeQuery.locale);
  }

  @Get('slug/:slug')
  @Public()
  async findBySlug(
    @Param('slug') slug: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<DistrictResponseDto> {
    return this.districtService.findBySlug(slug, localeQuery.locale);
  }

  @Get(':id/hierarchy')
  @Public()
  async findWithHierarchy(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<DistrictWithHierarchyDto> {
    return this.districtService.findWithHierarchy(id, localeQuery.locale);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Audit({ action: 'UPDATE', entityType: 'District', entityIdParam: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDistrictDto,
  ): Promise<DistrictResponseDto> {
    return this.districtService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Audit({ action: 'DELETE', entityType: 'District', entityIdParam: 'id' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.districtService.delete(id);
  }
}
