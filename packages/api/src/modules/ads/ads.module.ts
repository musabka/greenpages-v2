import { Module } from '@nestjs/common';
import { AdController } from './controllers';
import { AdService } from './services';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  controllers: [AdController],
  providers: [AdService],
  exports: [AdService],
})
export class AdsModule {}
