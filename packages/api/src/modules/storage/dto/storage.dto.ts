import { IsString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';

export enum StorageProviderType {
  R2 = 'r2',
  S3 = 's3',
  MINIO = 'minio',
  BUNNY = 'bunny',
  LOCAL = 'local',
}

export class UploadFileDto {
  @IsString()
  filename!: string;

  @IsString()
  contentType!: string;

  @IsOptional()
  @IsString()
  folder?: string;
}

export class GetSignedUrlDto {
  @IsString()
  objectKey!: string;

  @IsOptional()
  @IsNumber()
  @Min(60)
  expiresIn?: number = 3600; // 1 hour default
}

export class FileMetadataDto {
  @IsString()
  storageProvider!: string;

  @IsString()
  bucket!: string;

  @IsString()
  objectKey!: string;

  @IsString()
  mimeType!: string;

  @IsNumber()
  size!: number;

  @IsString()
  checksum!: string;
}

export class SwitchProviderDto {
  @IsEnum(StorageProviderType)
  provider!: StorageProviderType;
}
