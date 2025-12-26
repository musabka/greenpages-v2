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
import { GovernorateService } from '../services/governorate.service';
import {
  CreateGovernorateDto,
  UpdateGovernorateDto,
  GovernorateResponseDto,
  GovernorateWithCitiesDto,
  LocaleQueryDto,
  ActiveFilterDto,
} from '../dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';

@Controller('geo/governorates')
export class GovernorateController {
  constructor(private readonly governorateService: GovernorateService) {}

  @Post()
  @Roles('ADMIN')
  @Audit({ action: 'CREATE', entityType: 'Governorate' })
  async create(
    @Body() dto: CreateGovernorateDto,
  ): Promise<GovernorateResponseDto> {
    return this.governorateService.create(dto);
  }

  @Get()
  @Public()
  async findAll(
    @Query() localeQuery: LocaleQueryDto,
    @Query() activeFilter: ActiveFilterDto,
  ): Promise<GovernorateResponseDto[]> {
    return this.governorateService.findAll(
      localeQuery.locale,
      activeFilter.isActive,
    );
  }

  @Get(':id')
  @Public()
  async findById(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<GovernorateResponseDto> {
    return this.governorateService.findById(id, localeQuery.locale);
  }

  @Get('slug/:slug')
  @Public()
  async findBySlug(
    @Param('slug') slug: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<GovernorateResponseDto> {
    return this.governorateService.findBySlug(slug, localeQuery.locale);
  }

  @Get(':id/cities')
  @Public()
  async findWithCities(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<GovernorateWithCitiesDto> {
    return this.governorateService.findWithCities(id, localeQuery.locale);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Audit({ action: 'UPDATE', entityType: 'Governorate', entityIdParam: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGovernorateDto,
  ): Promise<GovernorateResponseDto> {
    return this.governorateService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Audit({ action: 'DELETE', entityType: 'Governorate', entityIdParam: 'id' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.governorateService.delete(id);
  }
}
