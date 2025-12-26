import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { StorageService } from './services/storage.service';
import { StorageController } from './controllers/storage.controller';
import { LocalStorageProvider } from './providers/local.provider';
import { R2StorageProvider } from './providers/r2.provider';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [StorageController],
  providers: [StorageService, LocalStorageProvider, R2StorageProvider],
  exports: [StorageService],
})
export class StorageModule {}
