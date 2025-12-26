import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { StorageModule } from '../storage/storage.module';
import { BusinessService, BusinessSearchService } from './services';
import { BusinessController } from './controllers';

@Module({
  imports: [
    PrismaModule,
    CacheModule,
    StorageModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [BusinessController],
  providers: [BusinessService, BusinessSearchService],
  exports: [BusinessService, BusinessSearchService],
})
export class DirectoryModule {}
