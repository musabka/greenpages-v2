import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  StorageProvider,
  StorageResult,
} from '../interfaces/storage-provider.interface';

/**
 * Cloudflare R2 Storage Provider
 * يستخدم S3-compatible API مع توقيع AWS Signature V4
 */
@Injectable()
export class R2StorageProvider implements StorageProvider, OnModuleInit {
  readonly name = 'r2';
  private readonly logger = new Logger(R2StorageProvider.name);
  private accountId = '';
  private accessKeyId = '';
  private secretAccessKey = '';
  private bucket = 'green-pages';
  private publicUrl = '';
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.accountId = this.configService.get<string>('R2_ACCOUNT_ID') || '';
    this.accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID') || '';
    this.secretAccessKey =
      this.configService.get<string>('R2_SECRET_ACCESS_KEY') || '';
    this.bucket = this.configService.get<string>('R2_BUCKET') || 'green-pages';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';

    this.isConfigured = !!(
      this.accountId &&
      this.accessKeyId &&
      this.secretAccessKey
    );

    if (this.isConfigured) {
      this.logger.log('R2 Storage Provider configured successfully');
    } else {
      this.logger.warn(
        'R2 Storage Provider not configured - missing credentials',
      );
    }
  }

  private getEndpoint(): string {
    return `https://${this.accountId}.r2.cloudflarestorage.com`;
  }

  private checkConfiguration(): void {
    if (!this.isConfigured) {
      throw new Error(
        'R2 Storage Provider not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY',
      );
    }
  }

  async putObject(
    key: string,
    data: Buffer,
    contentType: string,
  ): Promise<StorageResult> {
    this.checkConfiguration();

    const checksum = crypto.createHash('md5').update(data).digest('hex');
    const contentSha256 = crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');

    const endpoint = this.getEndpoint();
    const url = `${endpoint}/${this.bucket}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const headers = await this.signRequest(
      'PUT',
      `/${this.bucket}/${key}`,
      {
        'content-type': contentType,
        'content-length': data.length.toString(),
        'x-amz-content-sha256': contentSha256,
        'x-amz-date': amzDate,
        host: `${this.accountId}.r2.cloudflarestorage.com`,
      },
      contentSha256,
      dateStamp,
      amzDate,
    );

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: data,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`R2 upload failed: ${error}`);
      throw new Error(`R2 upload failed: ${response.status} - ${error}`);
    }

    this.logger.log(`File uploaded to R2: ${key}`);

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
    this.checkConfiguration();

    // إذا كان هناك public URL، استخدمه
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    // إنشاء presigned URL باستخدام AWS Signature V4
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const credential = `${this.accessKeyId}/${dateStamp}/auto/s3/aws4_request`;
    const expires = expiresIn.toString();

    const canonicalQueryString = [
      `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
      `X-Amz-Credential=${encodeURIComponent(credential)}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${expires}`,
      `X-Amz-SignedHeaders=host`,
    ]
      .sort()
      .join('&');

    const canonicalRequest = [
      'GET',
      `/${this.bucket}/${key}`,
      canonicalQueryString,
      `host:${this.accountId}.r2.cloudflarestorage.com`,
      '',
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      `${dateStamp}/auto/s3/aws4_request`,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = this.getSignatureKey(dateStamp);
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');

    const endpoint = this.getEndpoint();
    return `${endpoint}/${this.bucket}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  }

  async deleteObject(key: string): Promise<void> {
    this.checkConfiguration();

    const endpoint = this.getEndpoint();
    const url = `${endpoint}/${this.bucket}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const headers = await this.signRequest(
      'DELETE',
      `/${this.bucket}/${key}`,
      {
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        'x-amz-date': amzDate,
        host: `${this.accountId}.r2.cloudflarestorage.com`,
      },
      'UNSIGNED-PAYLOAD',
      dateStamp,
      amzDate,
    );

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`R2 delete failed: ${response.status} - ${error}`);
    }

    this.logger.log(`File deleted from R2: ${key}`);
  }

  async exists(key: string): Promise<boolean> {
    this.checkConfiguration();

    const endpoint = this.getEndpoint();
    const url = `${endpoint}/${this.bucket}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const headers = await this.signRequest(
      'HEAD',
      `/${this.bucket}/${key}`,
      {
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        'x-amz-date': amzDate,
        host: `${this.accountId}.r2.cloudflarestorage.com`,
      },
      'UNSIGNED-PAYLOAD',
      dateStamp,
      amzDate,
    );

    const response = await fetch(url, {
      method: 'HEAD',
      headers,
    });

    return response.ok;
  }

  async getObject(key: string): Promise<Buffer> {
    this.checkConfiguration();

    const endpoint = this.getEndpoint();
    const url = `${endpoint}/${this.bucket}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const headers = await this.signRequest(
      'GET',
      `/${this.bucket}/${key}`,
      {
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        'x-amz-date': amzDate,
        host: `${this.accountId}.r2.cloudflarestorage.com`,
      },
      'UNSIGNED-PAYLOAD',
      dateStamp,
      amzDate,
    );

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`R2 get failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async signRequest(
    method: string,
    canonicalUri: string,
    headers: Record<string, string>,
    payloadHash: string,
    dateStamp: string,
    amzDate: string,
  ): Promise<Record<string, string>> {
    const signedHeaders = Object.keys(headers)
      .map((h) => h.toLowerCase())
      .sort()
      .join(';');

    const canonicalHeaders = Object.entries(headers)
      .map(([k, v]) => `${k.toLowerCase()}:${v}`)
      .sort()
      .join('\n');

    const canonicalRequest = [
      method,
      canonicalUri,
      '', // query string
      canonicalHeaders,
      '',
      signedHeaders,
      payloadHash,
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      `${dateStamp}/auto/s3/aws4_request`,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const signingKey = this.getSignatureKey(dateStamp);
    const signature = crypto
      .createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex');

    const credential = `${this.accessKeyId}/${dateStamp}/auto/s3/aws4_request`;

    return {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    };
  }

  private getSignatureKey(dateStamp: string): Buffer {
    const kDate = crypto
      .createHmac('sha256', `AWS4${this.secretAccessKey}`)
      .update(dateStamp)
      .digest();
    const kRegion = crypto.createHmac('sha256', kDate).update('auto').digest();
    const kService = crypto
      .createHmac('sha256', kRegion)
      .update('s3')
      .digest();
    const kSigning = crypto
      .createHmac('sha256', kService)
      .update('aws4_request')
      .digest();
    return kSigning;
  }
}
