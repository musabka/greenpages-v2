import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { CollectionType } from '@prisma/client';

export class CreateAgentDebtDto {
  @IsString()
  agentId!: string;

  @IsString()
  businessId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(CollectionType)
  type!: CollectionType;
}

export interface AgentDebtResponseDto {
  id: string;
  agentId: string;
  businessId: string;
  amount: number;
  type: CollectionType;
  createdAt: Date;
}

export interface DebtSummaryDto {
  agentId: string;
  totalDebt: number;
  debtCount: number;
  totalSettlements: number;
  currentBalance: number;
}
