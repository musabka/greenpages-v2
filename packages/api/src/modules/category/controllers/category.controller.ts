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
import { CategoryService } from '../services/category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryResponseDto,
  CategoryWithChildrenDto,
  CategoryTreeDto,
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

class CategoryFilterDto extends LocaleQueryDto {
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

class DeleteCategoryQueryDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  cascade?: boolean = false;
}

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles('ADMIN')
  @Audit({ action: 'CREATE', entityType: 'Category' })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoryService.create(dto);
  }

  @Get()
  @Public()
  async findAll(
    @Query() filterDto: CategoryFilterDto,
  ): Promise<CategoryResponseDto[]> {
    return this.categoryService.findAll(
      filterDto.locale,
      filterDto.parentId,
      filterDto.isActive,
    );
  }

  @Get('tree')
  @Public()
  async getTree(
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<CategoryTreeDto[]> {
    return this.categoryService.getTree(localeQuery.locale);
  }

  @Get(':id')
  @Public()
  async findById(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.findById(id, localeQuery.locale);
  }

  @Get('slug/:slug')
  @Public()
  async findBySlug(
    @Param('slug') slug: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.findBySlug(slug, localeQuery.locale);
  }

  @Get(':id/children')
  @Public()
  async findWithChildren(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<CategoryWithChildrenDto> {
    return this.categoryService.findWithChildren(id, localeQuery.locale);
  }

  @Put(':id')
  @Roles('ADMIN')
  @Audit({ action: 'UPDATE', entityType: 'Category', entityIdParam: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Audit({ action: 'DELETE', entityType: 'Category', entityIdParam: 'id' })
  async delete(
    @Param('id') id: string,
    @Query() queryDto: DeleteCategoryQueryDto,
  ): Promise<void> {
    return this.categoryService.delete(id, queryDto.cascade);
  }
}
