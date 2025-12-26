import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { StorageService } from '../services/storage.service';
import { GetSignedUrlDto, SwitchProviderDto, StorageProviderType } from '../dto/storage.dto';

interface UploadedFileType {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * رفع ملف
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /^(image\/(jpeg|png|gif|webp)|application\/pdf)$/,
          }),
        ],
      }),
    )
    file: UploadedFileType,
    @Query('folder') folder?: string,
  ) {
    const result = await this.storageService.upload(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * الحصول على رابط موقع للملف
   */
  @Get('signed-url')
  async getSignedUrl(@Query() dto: GetSignedUrlDto) {
    const url = await this.storageService.getSignedUrl(
      dto.objectKey,
      undefined,
      dto.expiresIn,
    );

    return {
      success: true,
      data: { url, expiresIn: dto.expiresIn },
    };
  }

  /**
   * الحصول على معلومات ملف
   */
  @Get('info/:objectKey')
  async getFileInfo(@Param('objectKey') objectKey: string) {
    const info = await this.storageService.getFileInfo(objectKey);
    return {
      success: true,
      data: info,
    };
  }

  /**
   * Soft Delete - تعليم الملف كمحذوف
   */
  @Delete(':objectKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('objectKey') objectKey: string) {
    await this.storageService.softDelete(objectKey);
  }

  /**
   * Hard Delete - حذف فعلي (للمدير فقط)
   */
  @Delete(':objectKey/permanent')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('objectKey') objectKey: string) {
    await this.storageService.hardDelete(objectKey);
  }

  /**
   * استعادة ملف محذوف
   */
  @Post(':objectKey/restore')
  async restore(@Param('objectKey') objectKey: string) {
    await this.storageService.restore(objectKey);
    return {
      success: true,
      message: 'File restored successfully',
    };
  }

  /**
   * قائمة الملفات المحذوفة
   */
  @Get('deleted')
  @Roles('ADMIN')
  async listDeletedFiles(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.storageService.listDeletedFiles(page, limit);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * التحقق من وجود ملف
   */
  @Get('exists/:objectKey')
  async exists(@Param('objectKey') objectKey: string) {
    const exists = await this.storageService.exists(objectKey);
    return {
      success: true,
      data: { exists },
    };
  }

  /**
   * إحصائيات التخزين
   */
  @Get('stats')
  @Roles('ADMIN')
  async getStats() {
    const stats = await this.storageService.getStorageStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * الحصول على معلومات المزود النشط
   */
  @Get('provider')
  getActiveProvider() {
    return {
      success: true,
      data: {
        active: this.storageService.getActiveProviderName(),
        available: this.storageService.getAvailableProviders(),
      },
    };
  }

  /**
   * تبديل المزود النشط (للمدير فقط)
   */
  @Post('provider/switch')
  @Roles('ADMIN')
  switchProvider(@Body() dto: SwitchProviderDto) {
    this.storageService.switchProvider(dto.provider);
    return {
      success: true,
      message: `Switched to ${dto.provider} provider`,
      data: {
        active: this.storageService.getActiveProviderName(),
      },
    };
  }

  /**
   * نقل ملف من مزود إلى آخر
   */
  @Post(':objectKey/migrate')
  @Roles('ADMIN')
  async migrateFile(
    @Param('objectKey') objectKey: string,
    @Body() dto: SwitchProviderDto,
  ) {
    await this.storageService.migrateFile(objectKey, dto.provider);
    return {
      success: true,
      message: `File migrated to ${dto.provider}`,
    };
  }

  /**
   * نقل جميع الملفات من مزود إلى آخر (Background)
   */
  @Post('migrate/all')
  @Roles('ADMIN')
  async migrateAllFiles(
    @Body()
    dto: {
      sourceProvider: StorageProviderType;
      targetProvider: StorageProviderType;
      batchSize?: number;
    },
  ) {
    const result = await this.storageService.migrateAllFiles(
      dto.sourceProvider,
      dto.targetProvider,
      dto.batchSize || 10,
    );
    return {
      success: true,
      message: 'Migration completed',
      data: result,
    };
  }
}
