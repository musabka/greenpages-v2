import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from '../services';
import {
  CreateAgentDebtDto,
  CreateSettlementDto,
  AgentDebtResponseDto,
  SettlementResponseDto,
  DebtSummaryDto,
  LedgerEntryDto,
  DateRangeDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards';
import { Roles } from '../../auth/decorators';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('debts')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async recordCollection(
    @Body() createDebtDto: CreateAgentDebtDto,
  ): Promise<AgentDebtResponseDto> {
    return this.financeService.recordCollection(createDebtDto);
  }

  @Post('settlements')
  @Roles(UserRole.ADMIN)
  async processSettlement(
    @Body() createSettlementDto: CreateSettlementDto,
  ): Promise<SettlementResponseDto> {
    return this.financeService.processSettlement(createSettlementDto);
  }

  @Get('agents/:agentId/debt')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async getAgentDebt(
    @Param('agentId') agentId: string,
  ): Promise<DebtSummaryDto> {
    return this.financeService.getAgentDebt(agentId);
  }

  @Get('agents/:agentId/ledger')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async getAgentLedger(
    @Param('agentId') agentId: string,
    @Query() dateRange: DateRangeDto,
  ): Promise<LedgerEntryDto[]> {
    return this.financeService.getAgentLedger(agentId, dateRange);
  }

  @Get('agents/:agentId/settlements')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  async getSettlementHistory(
    @Param('agentId') agentId: string,
    @Query() dateRange: DateRangeDto,
  ): Promise<SettlementResponseDto[]> {
    return this.financeService.getSettlementHistory(agentId, dateRange);
  }

  @Get('agents')
  @Roles(UserRole.ADMIN)
  async getAllAgentsWithDebt() {
    return this.financeService.getAllAgentsWithDebt();
  }
}
