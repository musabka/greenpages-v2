import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SubscriptionService } from '../services/subscription.service';
import {
  CreateSubscriptionDto,
  RenewSubscriptionDto,
  SubscriptionResponseDto,
  ActiveSubscriptionDto,
  SubscriptionQueryDto,
  PaginatedSubscriptionsDto,
} from '../dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';
import { IsOptional, IsString } from 'class-validator';

class LocaleQueryDto {
  @IsOptional()
  @IsString()
  locale?: string = 'ar';
}

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'CREATE', entityType: 'Subscription' })
  async create(
    @Body() dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  async findAll(
    @Query() query: SubscriptionQueryDto,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<PaginatedSubscriptionsDto> {
    return this.subscriptionService.findAll(query, localeQuery.locale);
  }

  @Get('business/:businessId')
  @Roles('ADMIN', 'AGENT', 'USER')
  async getActiveSubscription(
    @Param('businessId') businessId: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<ActiveSubscriptionDto | null> {
    return this.subscriptionService.getActiveSubscription(
      businessId,
      localeQuery.locale,
    );
  }

  @Get('business/:businessId/feature/:featureKey')
  @Roles('ADMIN', 'AGENT', 'USER')
  async hasFeatureAccess(
    @Param('businessId') businessId: string,
    @Param('featureKey') featureKey: string,
  ): Promise<{ hasAccess: boolean }> {
    const hasAccess = await this.subscriptionService.hasFeatureAccess(
      businessId,
      featureKey,
    );
    return { hasAccess };
  }

  @Get('business/:businessId/feature/:featureKey/value')
  @Roles('ADMIN', 'AGENT', 'USER')
  async getFeatureValue(
    @Param('businessId') businessId: string,
    @Param('featureKey') featureKey: string,
  ): Promise<{ value: string | number | boolean | null }> {
    const value = await this.subscriptionService.getFeatureValue(
      businessId,
      featureKey,
    );
    return { value };
  }

  @Get(':id')
  @Roles('ADMIN')
  async findById(
    @Param('id') id: string,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.findById(id, localeQuery.locale);
  }

  @Post('business/:businessId/renew')
  @Roles('ADMIN', 'AGENT')
  @Audit({ action: 'CREATE', entityType: 'Subscription' })
  async renewSubscription(
    @Param('businessId') businessId: string,
    @Body() dto: RenewSubscriptionDto,
    @Query() localeQuery: LocaleQueryDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.renewSubscription(
      businessId,
      dto,
      localeQuery.locale,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  @Audit({ action: 'DELETE', entityType: 'Subscription', entityIdParam: 'id' })
  async cancelSubscription(@Param('id') id: string): Promise<void> {
    return this.subscriptionService.cancelSubscription(id);
  }

  @Post('process-expired')
  @Roles('ADMIN')
  @Audit({ action: 'UPDATE', entityType: 'Subscription' })
  async processExpiredSubscriptions(): Promise<{ processed: number }> {
    return this.subscriptionService.processExpiredSubscriptions();
  }
}
