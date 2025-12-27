import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PlanController, SubscriptionController } from './controllers';
import { PlanService, SubscriptionService } from './services';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule, ScheduleModule.forRoot()],
  controllers: [PlanController, SubscriptionController],
  providers: [PlanService, SubscriptionService],
  exports: [PlanService, SubscriptionService],
})
export class PlansModule {}
