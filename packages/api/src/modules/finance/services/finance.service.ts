import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAgentDebtDto,
  CreateSettlementDto,
  DebtSummaryDto,
  LedgerEntryDto,
  DateRangeDto,
} from '../dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a cash collection as agent debt
   * Requirements: 9.1, 9.3
   */
  async recordCollection(data: CreateAgentDebtDto) {
    // Validate agent exists
    const agent = await this.prisma.agent.findUnique({
      where: { id: data.agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${data.agentId} not found`);
    }

    // Validate business exists
    const business = await this.prisma.business.findUnique({
      where: { id: data.businessId },
    });

    if (!business) {
      throw new NotFoundException(
        `Business with ID ${data.businessId} not found`,
      );
    }

    // Create debt record
    const debt = await this.prisma.agentDebt.create({
      data: {
        agentId: data.agentId,
        businessId: data.businessId,
        amount: new Decimal(data.amount),
        type: data.type,
      },
      include: {
        business: {
          include: {
            translations: {
              where: { locale: 'ar' },
            },
          },
        },
      },
    });

    return {
      id: debt.id,
      agentId: debt.agentId,
      businessId: debt.businessId,
      amount: debt.amount.toNumber(),
      type: debt.type,
      createdAt: debt.createdAt,
    };
  }

  /**
   * Process a settlement to reduce agent debt
   * Requirements: 9.2, 9.5
   */
  async processSettlement(data: CreateSettlementDto) {
    // Validate agent exists
    const agent = await this.prisma.agent.findUnique({
      where: { id: data.agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${data.agentId} not found`);
    }

    // Get current debt balance
    const debtSummary = await this.getAgentDebt(data.agentId);

    // Prevent negative debt (Requirement 9.5)
    if (data.amount > debtSummary.currentBalance) {
      throw new BadRequestException(
        `Settlement amount (${data.amount}) exceeds current debt balance (${debtSummary.currentBalance})`,
      );
    }

    // Create settlement record
    const settlement = await this.prisma.settlement.create({
      data: {
        agentId: data.agentId,
        accountantId: data.accountantId,
        amount: new Decimal(data.amount),
        notes: data.notes,
      },
    });

    return {
      id: settlement.id,
      agentId: settlement.agentId,
      accountantId: settlement.accountantId,
      amount: settlement.amount.toNumber(),
      notes: settlement.notes,
      createdAt: settlement.createdAt,
    };
  }

  /**
   * Get agent debt summary
   * Requirements: 9.4
   */
  async getAgentDebt(agentId: string): Promise<DebtSummaryDto> {
    // Validate agent exists
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    // Get total debts
    const debtsResult = await this.prisma.agentDebt.aggregate({
      where: { agentId },
      _sum: { amount: true },
      _count: true,
    });

    const totalDebt = debtsResult._sum.amount
      ? debtsResult._sum.amount.toNumber()
      : 0;
    const debtCount = debtsResult._count;

    // Get total settlements
    const settlementsResult = await this.prisma.settlement.aggregate({
      where: { agentId },
      _sum: { amount: true },
    });

    const totalSettlements = settlementsResult._sum.amount
      ? settlementsResult._sum.amount.toNumber()
      : 0;

    // Calculate current balance
    const currentBalance = totalDebt - totalSettlements;

    return {
      agentId,
      totalDebt,
      debtCount,
      totalSettlements,
      currentBalance,
    };
  }

  /**
   * Get agent ledger with all transactions
   * Requirements: 9.4
   */
  async getAgentLedger(
    agentId: string,
    dateRange?: DateRangeDto,
  ): Promise<LedgerEntryDto[]> {
    // Validate agent exists
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    // Build date filter
    const dateFilter: any = {};
    if (dateRange?.startDate) {
      dateFilter.gte = new Date(dateRange.startDate);
    }
    if (dateRange?.endDate) {
      dateFilter.lte = new Date(dateRange.endDate);
    }

    // Get debts
    const debts = await this.prisma.agentDebt.findMany({
      where: {
        agentId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      include: {
        business: {
          include: {
            translations: {
              where: { locale: 'ar' },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get settlements
    const settlements = await this.prisma.settlement.findMany({
      where: {
        agentId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      orderBy: { createdAt: 'asc' },
    });

    // Combine and sort by date
    const entries: LedgerEntryDto[] = [];
    let runningBalance = 0;

    // Merge debts and settlements chronologically
    const allTransactions = [
      ...debts.map((d) => ({
        type: 'DEBT' as const,
        date: d.createdAt,
        data: d,
      })),
      ...settlements.map((s) => ({
        type: 'SETTLEMENT' as const,
        date: s.createdAt,
        data: s,
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const transaction of allTransactions) {
      if (transaction.type === 'DEBT') {
        const debt = transaction.data as any;
        runningBalance += debt.amount.toNumber();
        entries.push({
          id: debt.id,
          type: 'DEBT',
          amount: debt.amount.toNumber(),
          balance: runningBalance,
          businessId: debt.businessId,
          businessName: debt.business.translations[0]?.name || 'Unknown',
          collectionType: debt.type,
          createdAt: debt.createdAt,
        });
      } else {
        const settlement = transaction.data as any;
        runningBalance -= settlement.amount.toNumber();
        entries.push({
          id: settlement.id,
          type: 'SETTLEMENT',
          amount: settlement.amount.toNumber(),
          balance: runningBalance,
          notes: settlement.notes,
          createdAt: settlement.createdAt,
        });
      }
    }

    return entries;
  }

  /**
   * Get settlement history for an agent
   * Requirements: 9.4
   */
  async getSettlementHistory(agentId: string, dateRange?: DateRangeDto) {
    // Validate agent exists
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    // Build date filter
    const dateFilter: any = {};
    if (dateRange?.startDate) {
      dateFilter.gte = new Date(dateRange.startDate);
    }
    if (dateRange?.endDate) {
      dateFilter.lte = new Date(dateRange.endDate);
    }

    const settlements = await this.prisma.settlement.findMany({
      where: {
        agentId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return settlements.map((s) => ({
      id: s.id,
      agentId: s.agentId,
      accountantId: s.accountantId,
      amount: s.amount.toNumber(),
      notes: s.notes,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Get all agents with their debt summaries
   * Requirements: 9.4
   */
  async getAllAgentsWithDebt() {
    const agents = await this.prisma.agent.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { employeeCode: 'asc' },
    });

    const agentsWithDebt = await Promise.all(
      agents.map(async (agent) => {
        const debtSummary = await this.getAgentDebt(agent.id);
        return {
          id: agent.id,
          employeeCode: agent.employeeCode,
          userId: agent.userId,
          user: agent.user,
          debtSummary,
        };
      }),
    );

    return agentsWithDebt;
  }
}
