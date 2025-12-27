import { Module } from '@nestjs/common';
import { I18nService } from './services/i18n.service';
import { I18nController } from './controllers/i18n.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [I18nController],
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}
