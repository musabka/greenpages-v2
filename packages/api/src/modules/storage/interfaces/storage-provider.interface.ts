/**
 * Storage Provider Interface
 * يحدد العقد الأساسي لجميع مزودات التخزين
 */

export interface StorageResult {
  provider: string;
  bucket: string;
  objectKey: string;
  size: number;
  checksum: string;
  mimeType: string;
}

export interface StorageProviderConfig {
  name: string;
  isActive: boolean;
  bucket: string;
  [key: string]: unknown;
}

export interface StorageProvider {
  /**
   * اسم المزود (r2, s3, minio, bunny, local)
   */
  readonly name: string;

  /**
   * رفع ملف إلى التخزين
   */
  putObject(
    key: string,
    data: Buffer,
    contentType: string,
  ): Promise<StorageResult>;

  /**
   * الحصول على رابط موقع للوصول المؤقت
   */
  getSignedUrl(key: string, expiresIn: number): Promise<string>;

  /**
   * حذف ملف من التخزين
   */
  deleteObject(key: string): Promise<void>;

  /**
   * التحقق من وجود ملف
   */
  exists(key: string): Promise<boolean>;

  /**
   * الحصول على محتوى الملف
   */
  getObject(key: string): Promise<Buffer>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
export const STORAGE_CONFIG = Symbol('STORAGE_CONFIG');
