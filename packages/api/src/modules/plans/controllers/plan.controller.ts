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
import { PlanService } from '../services/plan.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  PlanResponseDto,
  PlanListResponseDto,
} from '../dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class LocaleQueryDto {
  @IsOptional()
  @IsString()
  locale?: string = 'ar';
}

class PlanFilterDto extends LocaleQueryDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @Roles('ADMIN')
  @Audit({ action: 'CREATE', entityType: 'Plan' })
  async create(@Body() dto: CreatePlanDto): Promise<PlanResponseDto> {
    return this.planService.create(dto);
  }

  @Get()
  @Public()
  async findAll(@Query() filterDto: PlanFilterDto): Promise<PlanListResponseDto[]> {
    return this.planService.findAll(filterDto.locale, filterDto.isActive);
  }

  @Get('active')
  @Public()
  async getActivePlans(
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<PlanResponseDto[]> {
    return this.planService.getActivePlans(localeQuery.locale);
  }

  @Get('default')
  @Public()
  async getDefaultPlan(
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<PlanResponseDto> {
    return this.planService.getDefaultPlan(localeQuery.locale);
  }

  @Get(':id')
  @Public()
  async findById(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<PlanResponseDto> {
    return this.planService.findById(id, localeQuery.locale);
  }

  @Get('slug/:slug')
  @Public()
  async findBySlug(
    @Param('slug') slug: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<PlanResponseDto> {
    return this.planService.findBySlug(slug, localeQuery.locale);
  }

  @Get(':id/features')
  @Public()
  async getPlanFeatures(
    @Param('id') id: string,
  ): Promise<Record<string, string | number | boolean>> {
    return this.planService.getPlanFeatures(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Audit({ action: 'UPDATE', entityType: 'Plan', entityIdParam: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    return this.planService.update(id, dto);
  }

  @Put(':id/set-default')
  @Roles('ADMIN')
  @Audit({ action: 'UPDATE', entityType: 'Plan', entityIdParam: 'id' })
  async setAsDefault(@Param('id') id: string): Promise<PlanResponseDto> {
    return this.planService.setAsDefault(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Audit({ action: 'DELETE', entityType: 'Plan', entityIdParam: 'id' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.planService.delete(id);
  }
}
