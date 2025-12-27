import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators';
import { ReportService } from '../services';
import {
  CreateReportDto,
  ResolveReportDto,
  GetReportsDto,
  ReportResponseDto,
  PaginatedReportsDto,
  ReportStatisticsDto,
} from '../dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Create a new data report
   * Available to all authenticated users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser('id') userId: string,
  ): Promise<ReportResponseDto> {
    return this.reportService.create(createReportDto, userId);
  }

  /**
   * Get reports with filtering
   * Admin only
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getReports(
    @Query() query: GetReportsDto,
  ): Promise<PaginatedReportsDto> {
    return this.reportService.getReports(query);
  }

  /**
   * Get pending reports queue
   * Admin only
   */
  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getPendingReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedReportsDto> {
    return this.reportService.getPendingReports(page, limit);
  }

  /**
   * Get report statistics
   * Admin only
   */
  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getStatistics(): Promise<ReportStatisticsDto> {
    return this.reportService.getStatistics();
  }

  /**
   * Get a single report by ID
   * Admin only
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async findById(@Param('id') id: string): Promise<ReportResponseDto> {
    return this.reportService.findById(id);
  }

  /**
   * Resolve a report (approve or reject)
   * Admin only
   */
  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async resolve(
    @Param('id') id: string,
    @Body() resolveReportDto: ResolveReportDto,
    @CurrentUser('id') adminId: string,
  ): Promise<ReportResponseDto> {
    return this.reportService.resolve(id, resolveReportDto, adminId);
  }

  /**
   * Delete a report
   * Admin only (for spam/invalid reports)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.reportService.delete(id);
  }
}
