import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BusinessService } from '../services/business.service';
import { BusinessSearchService } from '../services/business-search.service';
import {
  CreateBusinessDto,
  UpdateBusinessDto,
  SearchBusinessDto,
  BusinessResponseDto,
  BusinessCardDto,
  PaginatedBusinessResult,
  BusinessImageResponseDto,
} from '../dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserPayload } from '../../auth/interfaces';
import { IsOptional, IsString, IsArray } from 'class-validator';

class LocaleQueryDto {
  @IsOptional()
  @IsString()
  locale?: string = 'ar';
}

class ReorderImagesDto {
  @IsArray()
  @IsString({ each: true })
  imageIds!: string[];
}

@Controller('businesses')
export class BusinessController {
  constructor(
    private readonly businessService: BusinessService,
    private readonly searchService: BusinessSearchService,
  ) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get('search')
  @Public()
  async search(@Query() dto: SearchBusinessDto): Promise<PaginatedBusinessResult> {
    return this.searchService.search(dto);
  }

  @Get('featured')
  @Public()
  async getFeatured(
    @Query() localeQuery: LocaleQueryDto,
    @Query('limit') limit?: number,
  ): Promise<BusinessCardDto[]> {
    return this.searchService.getFeatured(localeQuery.locale, limit || 10);
  }

  @Get('by-category/:categoryId')
  @Public()
  async getByCategory(
    @Param('categoryId') categoryId: string,
    @Query() localeQuery: LocaleQueryDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedBusinessResult> {
    return this.searchService.getByCategory(
      categoryId,
      localeQuery.locale,
      page || 1,
      limit || 20,
    );
  }

  @Get('by-location')
  @Public()
  async getByLocation(
    @Query('governorateId') governorateId?: string,
    @Query('cityId') cityId?: string,
    @Query('districtId') districtId?: string,
    @Query() localeQuery?: LocaleQueryDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedBusinessResult> {
    return this.searchService.getByLocation(
      governorateId,
      cityId,
      districtId,
      localeQuery?.locale || 'ar',
      page || 1,
      limit || 20,
    );
  }

  @Get('slug/:slug')
  @Public()
  async findBySlug(
    @Param('slug') slug: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<BusinessResponseDto> {
    const business = await this.businessService.findBySlug(slug, localeQuery.locale);
    // Increment view count asynchronously
    this.businessService.incrementViewCount(business.id).catch(() => {});
    return business;
  }

  @Get(':id')
  @Public()
  async findById(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<BusinessResponseDto> {
    const business = await this.businessService.findById(id, localeQuery.locale);
    // Increment view count asynchronously
    this.businessService.incrementViewCount(business.id).catch(() => {});
    return business;
  }


  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post()
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'CREATE', entityType: 'Business' })
  async create(@Body() dto: CreateBusinessDto): Promise<BusinessResponseDto> {
    return this.businessService.create(dto);
  }

  @Put(':id')
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'UPDATE', entityType: 'Business', entityIdParam: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessDto,
  ): Promise<BusinessResponseDto> {
    return this.businessService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Audit({ action: 'DELETE', entityType: 'Business', entityIdParam: 'id' })
  async softDelete(@Param('id') id: string): Promise<void> {
    return this.businessService.softDelete(id);
  }

  @Post(':id/restore')
  @Roles('ADMIN')
  @Audit({ action: 'RESTORE', entityType: 'Business', entityIdParam: 'id' })
  async restore(@Param('id') id: string): Promise<BusinessResponseDto> {
    return this.businessService.restore(id);
  }

  @Delete(':id/permanent')
  @Roles('ADMIN')
  @Audit({ action: 'HARD_DELETE', entityType: 'Business', entityIdParam: 'id' })
  async hardDelete(@Param('id') id: string): Promise<void> {
    return this.businessService.hardDelete(id);
  }

  @Get('admin/deleted')
  @Roles('ADMIN')
  async findDeleted(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query() localeQuery?: LocaleQueryDto,
  ): Promise<{ data: BusinessResponseDto[]; total: number }> {
    return this.businessService.findDeleted(
      page || 1,
      limit || 20,
      localeQuery?.locale || 'ar',
    );
  }

  // ============================================
  // IMAGE ENDPOINTS
  // ============================================

  @Post(':id/images')
  @Roles('ADMIN', 'AGENT')
  @UseInterceptors(FileInterceptor('file'))
  @Audit({ action: 'ADD_IMAGE', entityType: 'Business', entityIdParam: 'id' })
  async addImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('isPrimary') isPrimary?: string,
  ): Promise<BusinessImageResponseDto> {
    return this.businessService.addImage(
      id,
      file.buffer,
      file.originalname,
      file.mimetype,
      isPrimary === 'true',
    );
  }

  @Delete(':id/images/:imageId')
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'REMOVE_IMAGE', entityType: 'Business', entityIdParam: 'id' })
  async removeImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    return this.businessService.removeImage(id, imageId);
  }

  @Put(':id/images/:imageId/primary')
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'SET_PRIMARY_IMAGE', entityType: 'Business', entityIdParam: 'id' })
  async setPrimaryImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    return this.businessService.setPrimaryImage(id, imageId);
  }

  @Put(':id/images/reorder')
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'REORDER_IMAGES', entityType: 'Business', entityIdParam: 'id' })
  async reorderImages(
    @Param('id') id: string,
    @Body() dto: ReorderImagesDto,
  ): Promise<void> {
    return this.businessService.reorderImages(id, dto.imageIds);
  }

  // ============================================
  // OWNER ENDPOINTS
  // ============================================

  @Get('owner/my-businesses')
  @Roles('USER', 'ADMIN')
  async getMyBusinesses(
    @CurrentUser() user: UserPayload,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<BusinessResponseDto[]> {
    return this.businessService.findByOwner(user.id, localeQuery.locale);
  }

  @Put('owner/:id')
  @Roles('USER', 'ADMIN')
  @Audit({ action: 'OWNER_UPDATE', entityType: 'Business', entityIdParam: 'id' })
  async ownerUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessDto,
    @CurrentUser() user: UserPayload,
  ): Promise<BusinessResponseDto> {
    // Verify ownership using the new abstraction
    const canManage = await this.businessService.canUserManageBusiness(user.id, id);
    if (!canManage) {
      throw new ForbiddenException('You do not have permission to manage this business');
    }

    // Get user's role for this business
    const role = await this.businessService.getUserBusinessRole(user.id, id);

    // Owners can only update certain fields based on their role
    let allowedDto: UpdateBusinessDto;

    if (role === 'OWNER') {
      // Full access to editable fields
      allowedDto = {
        phone: dto.phone,
        phone2: dto.phone2,
        whatsapp: dto.whatsapp,
        email: dto.email,
        website: dto.website,
        workingHours: dto.workingHours,
        translations: dto.translations,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      };
    } else if (role === 'MANAGER') {
      // Can edit most fields
      allowedDto = {
        phone: dto.phone,
        phone2: dto.phone2,
        whatsapp: dto.whatsapp,
        email: dto.email,
        website: dto.website,
        workingHours: dto.workingHours,
        translations: dto.translations,
      };
    } else {
      // EDITOR - content only
      allowedDto = {
        translations: dto.translations,
      };
    }

    return this.businessService.update(id, allowedDto);
  }
}
