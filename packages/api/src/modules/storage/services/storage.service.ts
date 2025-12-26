import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  StorageProvider,
  StorageResult,
} from '../interfaces/storage-provider.interface';
import { StorageProviderType } from '../dto/storage.dto';
import { LocalStorageProvider } from '../providers/local.provider';
import { R2StorageProvider } from '../providers/r2.provider';
import { PrismaService } from '../../prisma/prisma.service';

// Map DTO enum to Prisma enum
type PrismaStorageProviderEnum = 'LOCAL' | 'R2' | 'S3' | 'MINIO' | 'BUNNY';

export interface StorageConfig {
  activeProvider: StorageProviderType;
  providers: {
    [key in StorageProviderType]?: {
      enabled: boolean;
      config: Record<string, unknown>;
    };
  };
}

/**
 * Storage Service
 * يدير التخزين مع دعم التبديل بين المزودات و Soft Delete
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private providers: Map<StorageProviderType, StorageProvider> = new Map();
  private activeProvider: StorageProviderType;

  constructor(
    private readonly configService: ConfigService,
    private readonly localProvider: LocalStorageProvider,
    private readonly r2Provider: R2StorageProvider,
    private readonly prisma: PrismaService,
  ) {
    const defaultProvider =
      (this.configService.get<string>(
        'STORAGE_PROVIDER',
      ) as StorageProviderType) || StorageProviderType.LOCAL;
    this.activeProvider = defaultProvider;
  }

  onModuleInit() {
    this.registerProvider(StorageProviderType.LOCAL, this.localProvider);
    this.registerProvider(StorageProviderType.R2, this.r2Provider);

    this.logger.log(`Storage initialized with provider: ${this.activeProvider}`);
    this.logger.log(
      `Available providers: ${Array.from(this.providers.keys()).join(', ')}`,
    );
  }

  registerProvider(type: StorageProviderType, provider: StorageProvider): void {
    this.providers.set(type, provider);
    this.logger.debug(`Registered storage provider: ${type}`);
  }

  getActiveProvider(): StorageProvider {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new BadRequestException(
        `Storage provider ${this.activeProvider} not available`,
      );
    }
    return provider;
  }

  getActiveProviderName(): StorageProviderType {
    return this.activeProvider;
  }

  getAvailableProviders(): StorageProviderType[] {
    return Array.from(this.providers.keys());
  }

  switchProvider(provider: StorageProviderType): void {
    if (!this.providers.has(provider)) {
      throw new BadRequestException(`Provider ${provider} not available`);
    }
    const oldProvider = this.activeProvider;
    this.activeProvider = provider;
    this.logger.log(`Switched storage provider: ${oldProvider} -> ${provider}`);
  }

  /**
   * رفع ملف مع حفظ metadata في قاعدة البيانات
   */
  async upload(
    data: Buffer,
    filename: string,
    contentType: string,
    folder?: string,
    metadata?: Record<string, unknown>,
  ): Promise<StorageResult & { id: string }> {
    const key = this.generateKey(filename, folder);
    const provider = this.getActiveProvider();
    const result = await provider.putObject(key, data, contentType);

    // حفظ في قاعدة البيانات
    const storageObject = await this.prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO storage_objects (id, provider, bucket, object_key, original_name, mime_type, size, checksum, metadata, created_at, updated_at)
      VALUES (
        ${crypto.randomUUID()},
        ${this.mapProviderToPrisma(this.activeProvider)}::\"StorageProvider\",
        ${result.bucket},
        ${result.objectKey},
        ${filename},
        ${result.mimeType},
        ${result.size},
        ${result.checksum},
        ${metadata ? JSON.stringify(metadata) : null}::jsonb,
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    return {
      ...result,
      id: storageObject[0].id,
    };
  }

  /**
   * الحصول على رابط موقع
   */
  async getSignedUrl(
    objectKey: string,
    providerName?: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    // التحقق من أن الملف غير محذوف
    const storageObjects = await this.prisma.$queryRaw<
      { provider: string; is_deleted: boolean }[]
    >`
      SELECT provider, is_deleted FROM storage_objects WHERE object_key = ${objectKey}
    `;

    const storageObject = storageObjects[0];

    if (storageObject?.is_deleted) {
      throw new NotFoundException('File not found');
    }

    const providerType = providerName
      ? (providerName as StorageProviderType)
      : storageObject
        ? this.mapPrismaToProvider(storageObject.provider as PrismaStorageProviderEnum)
        : this.activeProvider;

    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new BadRequestException(`Provider ${providerType} not available`);
    }

    return provider.getSignedUrl(objectKey, expiresIn);
  }

  /**
   * Soft Delete - تعليم الملف كمحذوف
   */
  async softDelete(objectKey: string): Promise<void> {
    const result = await this.prisma.$executeRaw`
      UPDATE storage_objects 
      SET is_deleted = true, deleted_at = NOW(), updated_at = NOW()
      WHERE object_key = ${objectKey}
    `;

    if (result === 0) {
      throw new NotFoundException('File not found');
    }

    this.logger.log(`File soft deleted: ${objectKey}`);
  }

  /**
   * Hard Delete - حذف فعلي من التخزين وقاعدة البيانات
   */
  async hardDelete(objectKey: string): Promise<void> {
    const storageObjects = await this.prisma.$queryRaw<
      { provider: string }[]
    >`
      SELECT provider FROM storage_objects WHERE object_key = ${objectKey}
    `;

    const storageObject = storageObjects[0];

    if (!storageObject) {
      throw new NotFoundException('File not found');
    }

    const providerType = this.mapPrismaToProvider(
      storageObject.provider as PrismaStorageProviderEnum,
    );
    const provider = this.providers.get(providerType);

    if (provider) {
      try {
        await provider.deleteObject(objectKey);
      } catch (error) {
        this.logger.warn(`Failed to delete from provider: ${error}`);
      }
    }

    await this.prisma.$executeRaw`
      DELETE FROM storage_objects WHERE object_key = ${objectKey}
    `;

    this.logger.log(`File hard deleted: ${objectKey}`);
  }

  /**
   * استعادة ملف محذوف (Soft Delete)
   */
  async restore(objectKey: string): Promise<void> {
    const storageObjects = await this.prisma.$queryRaw<
      { is_deleted: boolean }[]
    >`
      SELECT is_deleted FROM storage_objects WHERE object_key = ${objectKey}
    `;

    const storageObject = storageObjects[0];

    if (!storageObject) {
      throw new NotFoundException('File not found');
    }

    if (!storageObject.is_deleted) {
      throw new BadRequestException('File is not deleted');
    }

    await this.prisma.$executeRaw`
      UPDATE storage_objects 
      SET is_deleted = false, deleted_at = NULL, updated_at = NOW()
      WHERE object_key = ${objectKey}
    `;

    this.logger.log(`File restored: ${objectKey}`);
  }

  /**
   * تنظيف الملفات المحذوفة القديمة (أكثر من 30 يوم)
   * يمكن استدعاؤها من cron job خارجي
   */
  async cleanupDeletedFiles(): Promise<{ cleaned: number }> {
    const deletedFiles = await this.prisma.$queryRaw<{ object_key: string }[]>`
      SELECT object_key FROM storage_objects 
      WHERE is_deleted = true 
      AND deleted_at < NOW() - INTERVAL '30 days'
    `;

    this.logger.log(`Cleaning up ${deletedFiles.length} deleted files...`);

    let cleaned = 0;
    for (const file of deletedFiles) {
      try {
        await this.hardDelete(file.object_key);
        cleaned++;
      } catch (error) {
        this.logger.error(`Failed to cleanup file ${file.object_key}:`, error);
      }
    }

    this.logger.log(`Cleanup completed: ${cleaned} files removed`);
    return { cleaned };
  }

  /**
   * التحقق من وجود ملف
   */
  async exists(objectKey: string, providerName?: string): Promise<boolean> {
    const storageObjects = await this.prisma.$queryRaw<
      { provider: string; is_deleted: boolean }[]
    >`
      SELECT provider, is_deleted FROM storage_objects WHERE object_key = ${objectKey}
    `;

    const storageObject = storageObjects[0];

    if (!storageObject || storageObject.is_deleted) {
      return false;
    }

    const providerType = providerName
      ? (providerName as StorageProviderType)
      : this.mapPrismaToProvider(storageObject.provider as PrismaStorageProviderEnum);

    const provider = this.providers.get(providerType);
    if (!provider) {
      return false;
    }

    return provider.exists(objectKey);
  }

  /**
   * تحميل ملف
   */
  async download(objectKey: string, providerName?: string): Promise<Buffer> {
    const storageObjects = await this.prisma.$queryRaw<
      { provider: string; is_deleted: boolean }[]
    >`
      SELECT provider, is_deleted FROM storage_objects WHERE object_key = ${objectKey}
    `;

    const storageObject = storageObjects[0];

    if (!storageObject || storageObject.is_deleted) {
      throw new NotFoundException('File not found');
    }

    const providerType = providerName
      ? (providerName as StorageProviderType)
      : this.mapPrismaToProvider(storageObject.provider as PrismaStorageProviderEnum);

    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new BadRequestException(`Provider ${providerType} not available`);
    }

    return provider.getObject(objectKey);
  }

  /**
   * الحصول على معلومات ملف
   */
  async getFileInfo(objectKey: string) {
    const storageObjects = await this.prisma.$queryRaw<
      {
        id: string;
        provider: string;
        bucket: string;
        object_key: string;
        original_name: string;
        mime_type: string;
        size: number;
        checksum: string;
        is_deleted: boolean;
        created_at: Date;
      }[]
    >`
      SELECT id, provider, bucket, object_key, original_name, mime_type, size, checksum, is_deleted, created_at
      FROM storage_objects 
      WHERE object_key = ${objectKey}
    `;

    const storageObject = storageObjects[0];

    if (!storageObject || storageObject.is_deleted) {
      throw new NotFoundException('File not found');
    }

    return {
      id: storageObject.id,
      provider: storageObject.provider,
      bucket: storageObject.bucket,
      objectKey: storageObject.object_key,
      originalName: storageObject.original_name,
      mimeType: storageObject.mime_type,
      size: storageObject.size,
      checksum: storageObject.checksum,
      createdAt: storageObject.created_at,
    };
  }

  /**
   * قائمة الملفات المحذوفة (للاستعادة)
   */
  async listDeletedFiles(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const files = await this.prisma.$queryRaw<
      {
        id: string;
        object_key: string;
        original_name: string;
        deleted_at: Date;
      }[]
    >`
      SELECT id, object_key, original_name, deleted_at
      FROM storage_objects 
      WHERE is_deleted = true
      ORDER BY deleted_at DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countResult = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM storage_objects WHERE is_deleted = true
    `;
    const total = Number(countResult[0].count);

    return {
      files: files.map((f) => ({
        id: f.id,
        objectKey: f.object_key,
        originalName: f.original_name,
        deletedAt: f.deleted_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * إحصائيات التخزين
   */
  async getStorageStats() {
    const stats = await this.prisma.$queryRaw<
      { provider: string; file_count: bigint; total_size: bigint }[]
    >`
      SELECT provider, COUNT(*) as file_count, COALESCE(SUM(size), 0) as total_size
      FROM storage_objects 
      WHERE is_deleted = false
      GROUP BY provider
    `;

    const deletedStats = await this.prisma.$queryRaw<
      { file_count: bigint; total_size: bigint }[]
    >`
      SELECT COUNT(*) as file_count, COALESCE(SUM(size), 0) as total_size
      FROM storage_objects 
      WHERE is_deleted = true
    `;

    return {
      byProvider: stats.map((s) => ({
        provider: s.provider,
        fileCount: Number(s.file_count),
        totalSize: Number(s.total_size),
      })),
      deleted: {
        fileCount: Number(deletedStats[0]?.file_count || 0),
        totalSize: Number(deletedStats[0]?.total_size || 0),
      },
      activeProvider: this.activeProvider,
    };
  }

  // ============================================
  // MIGRATION HELPERS
  // ============================================

  /**
   * نقل ملف من مزود إلى آخر
   */
  async migrateFile(
    objectKey: string,
    targetProvider: StorageProviderType,
  ): Promise<void> {
    const storageObjects = await this.prisma.$queryRaw<
      { provider: string; mime_type: string }[]
    >`
      SELECT provider, mime_type FROM storage_objects WHERE object_key = ${objectKey}
    `;

    const storageObject = storageObjects[0];

    if (!storageObject) {
      throw new NotFoundException('File not found');
    }

    const sourceProviderType = this.mapPrismaToProvider(
      storageObject.provider as PrismaStorageProviderEnum,
    );
    if (sourceProviderType === targetProvider) {
      throw new BadRequestException('File is already in target provider');
    }

    const sourceProvider = this.providers.get(sourceProviderType);
    const targetProviderInstance = this.providers.get(targetProvider);

    if (!sourceProvider || !targetProviderInstance) {
      throw new BadRequestException('Provider not available');
    }

    // تحميل من المصدر
    const data = await sourceProvider.getObject(objectKey);

    // رفع إلى الهدف
    await targetProviderInstance.putObject(
      objectKey,
      data,
      storageObject.mime_type,
    );

    // تحديث قاعدة البيانات
    await this.prisma.$executeRaw`
      UPDATE storage_objects 
      SET provider = ${this.mapProviderToPrisma(targetProvider)}::\"StorageProvider\",
          migrated_from = ${storageObject.provider},
          migrated_at = NOW(),
          updated_at = NOW()
      WHERE object_key = ${objectKey}
    `;

    // حذف من المصدر
    await sourceProvider.deleteObject(objectKey);

    this.logger.log(
      `File migrated: ${objectKey} from ${sourceProviderType} to ${targetProvider}`,
    );
  }

  /**
   * نقل جميع الملفات من مزود إلى آخر (Background Job)
   */
  async migrateAllFiles(
    sourceProvider: StorageProviderType,
    targetProvider: StorageProviderType,
    batchSize = 10,
  ): Promise<{ migrated: number; failed: number }> {
    let migrated = 0;
    let failed = 0;
    let hasMore = true;

    while (hasMore) {
      const files = await this.prisma.$queryRaw<{ object_key: string }[]>`
        SELECT object_key FROM storage_objects 
        WHERE provider = ${this.mapProviderToPrisma(sourceProvider)}::\"StorageProvider\"
        AND is_deleted = false
        LIMIT ${batchSize}
      `;

      if (files.length === 0) {
        hasMore = false;
        break;
      }

      for (const file of files) {
        try {
          await this.migrateFile(file.object_key, targetProvider);
          migrated++;
        } catch (error) {
          this.logger.error(`Failed to migrate ${file.object_key}:`, error);
          failed++;
        }
      }
    }

    return { migrated, failed };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private generateKey(filename: string, folder?: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);

    const key = `${timestamp}-${random}-${safeName}`;
    return folder ? `${folder}/${key}` : key;
  }

  private mapProviderToPrisma(provider: StorageProviderType): string {
    const map: Record<StorageProviderType, string> = {
      [StorageProviderType.LOCAL]: 'LOCAL',
      [StorageProviderType.R2]: 'R2',
      [StorageProviderType.S3]: 'S3',
      [StorageProviderType.MINIO]: 'MINIO',
      [StorageProviderType.BUNNY]: 'BUNNY',
    };
    return map[provider];
  }

  private mapPrismaToProvider(provider: PrismaStorageProviderEnum): StorageProviderType {
    const map: Record<PrismaStorageProviderEnum, StorageProviderType> = {
      LOCAL: StorageProviderType.LOCAL,
      R2: StorageProviderType.R2,
      S3: StorageProviderType.S3,
      MINIO: StorageProviderType.MINIO,
      BUNNY: StorageProviderType.BUNNY,
    };
    return map[provider];
  }

  // Backward compatibility
  async delete(objectKey: string, _providerName?: string): Promise<void> {
    return this.softDelete(objectKey);
  }
}
