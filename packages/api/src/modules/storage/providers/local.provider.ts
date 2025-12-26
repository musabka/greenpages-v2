import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  StorageProvider,
  StorageResult,
} from '../interfaces/storage-provider.interface';

/**
 * Local Filesystem Storage Provider
 * مزود تخزين محلي للتطوير والاختبار
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly basePath: string;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.basePath =
      this.configService.get<string>('STORAGE_LOCAL_PATH') || './uploads';
    this.bucket =
      this.configService.get<string>('STORAGE_LOCAL_BUCKET') || 'default';
    this.baseUrl =
      this.configService.get<string>('STORAGE_LOCAL_BASE_URL') ||
      'http://localhost:3000/uploads';
  }

  async putObject(
    key: string,
    data: Buffer,
    contentType: string,
  ): Promise<StorageResult> {
    const fullPath = this.getFullPath(key);
    const dir = path.dirname(fullPath);

    // إنشاء المجلد إذا لم يكن موجوداً
    await fs.mkdir(dir, { recursive: true });

    // حساب checksum
    const checksum = crypto.createHash('md5').update(data).digest('hex');

    // كتابة الملف
    await fs.writeFile(fullPath, data);

    // حفظ metadata
    const metadataPath = `${fullPath}.meta.json`;
    await fs.writeFile(
      metadataPath,
      JSON.stringify({
        contentType,
        size: data.length,
        checksum,
        createdAt: new Date().toISOString(),
      }),
    );

    this.logger.log(`File uploaded: ${key}`);

    return {
      provider: this.name,
      bucket: this.bucket,
      objectKey: key,
      size: data.length,
      checksum,
      mimeType: contentType,
    };
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    // للتخزين المحلي، نرجع رابط مباشر مع token بسيط
    const token = crypto
      .createHash('sha256')
      .update(`${key}:${Date.now() + expiresIn * 1000}:${process.env.JWT_SECRET || 'secret'}`)
      .digest('hex')
      .substring(0, 16);

    const expires = Date.now() + expiresIn * 1000;
    return `${this.baseUrl}/${key}?token=${token}&expires=${expires}`;
  }

  async deleteObject(key: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    const metadataPath = `${fullPath}.meta.json`;

    try {
      await fs.unlink(fullPath);
      await fs.unlink(metadataPath).catch(() => {
        // تجاهل إذا لم يكن ملف metadata موجود
      });
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.getFullPath(key);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getObject(key: string): Promise<Buffer> {
    const fullPath = this.getFullPath(key);
    return fs.readFile(fullPath);
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, this.bucket, key);
  }
}
