import { IsString, IsOptional, IsDateString } from 'class-validator';
import { CollectionType } from '@prisma/client';

export class DateRangeDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class GetAgentLedgerDto extends DateRangeDto {
  @IsString()
  agentId!: string;
}

export interface LedgerEntryDto {
  id: string;
  type: 'DEBT' | 'SETTLEMENT';
  amount: number;
  balance: number;
  businessId?: string;
  businessName?: string;
  collectionType?: CollectionType;
  notes?: string;
  createdAt: Date;
}
