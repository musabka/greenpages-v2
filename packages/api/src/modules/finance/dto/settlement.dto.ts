import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateSettlementDto {
  @IsString()
  agentId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  accountantId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export interface SettlementResponseDto {
  id: string;
  agentId: string;
  accountantId: string;
  amount: number;
  notes?: string | null;
  createdAt: Date;
}
