import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RewardsService } from '../../rewards/services';
import { NotificationService } from '../../notifications/services';
import {
  CreateReportDto,
  ResolveReportDto,
  GetReportsDto,
  ReportResponseDto,
  PaginatedReportsDto,
  ReportStatisticsDto,
  ReportStatus,
  ReportType,
} from '../dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rewardsService: RewardsService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new data report
   */
  async create(
    data: CreateReportDto,
    reporterId: string,
  ): Promise<ReportResponseDto> {
    // Check if business exists
    const business = await this.prisma.business.findUnique({
      where: { id: data.businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Create the report
    const report = await this.prisma.dataReport.create({
      data: {
        businessId: data.businessId,
        reporterId,
        type: data.type,
        description: data.description,
        status: ReportStatus.PENDING,
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    this.logger.log(
      `Report created: ${report.id} by user ${reporterId} for business ${data.businessId}`,
    );

    return this.mapToResponseDto(report);
  }

  /**
   * Get reports with filtering and pagination
   */
  async getReports(query: GetReportsDto): Promise<PaginatedReportsDto> {
    const { status, type, businessId, reporterId, page = 1, limit = 20 } = query;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (businessId) where.businessId = businessId;
    if (reporterId) where.reporterId = reporterId;

    const [reports, total] = await Promise.all([
      this.prisma.dataReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: {
            select: {
              id: true,
              email: true,
            },
          },
          business: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.dataReport.count({ where }),
    ]);

    return {
      data: reports.map(this.mapToResponseDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get pending reports queue
   */
  async getPendingReports(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedReportsDto> {
    return this.getReports({
      status: ReportStatus.PENDING,
      page,
      limit,
    });
  }

  /**
   * Get a single report by ID
   */
  async findById(id: string): Promise<ReportResponseDto> {
    const report = await this.prisma.dataReport.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.mapToResponseDto(report);
  }

  /**
   * Resolve a report (admin action)
   * Updates business data if provided and awards points to reporter if resolved
   */
  async resolve(
    id: string,
    data: ResolveReportDto,
    adminId: string,
  ): Promise<ReportResponseDto> {
    const report = await this.prisma.dataReport.findUnique({
      where: { id },
      include: {
        business: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException('Report has already been resolved');
    }

    // Validate status
    if (data.status !== ReportStatus.RESOLVED && data.status !== ReportStatus.REJECTED) {
      throw new BadRequestException('Status must be RESOLVED or REJECTED');
    }

    // Update business data if provided and status is RESOLVED
    if (data.status === ReportStatus.RESOLVED && data.updatedBusinessData) {
      try {
        const businessUpdates = JSON.parse(data.updatedBusinessData);
        await this.prisma.business.update({
          where: { id: report.businessId },
          data: businessUpdates,
        });
        this.logger.log(`Updated business ${report.businessId} based on report ${id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to update business data: ${errorMessage}`);
        throw new BadRequestException('Invalid business data format');
      }
    }

    // Update report status
    const updated = await this.prisma.dataReport.update({
      where: { id },
      data: {
        status: data.status,
        resolvedBy: adminId,
        resolvedAt: new Date(),
        resolution: data.resolution,
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
          },
        },
        business: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    // Award points to reporter if resolved
    if (data.status === ReportStatus.RESOLVED) {
      try {
        await this.rewardsService.awardPointsForVerifiedReport(
          report.reporterId,
          {
            reportId: id,
            businessId: report.businessId,
            reportType: report.type,
          },
        );
        this.logger.log(`Awarded points to reporter ${report.reporterId} for verified report ${id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to award points for verified report: ${errorMessage}`);
        // Don't fail the resolution if points award fails
      }

      // Send notification to reporter about resolved report
      try {
        const reportTypeDescriptions: Record<ReportType, string> = {
          [ReportType.WRONG_PHONE]: 'رقم هاتف خاطئ',
          [ReportType.WRONG_LOCATION]: 'موقع خاطئ',
          [ReportType.CLOSED_BUSINESS]: 'نشاط مغلق',
          [ReportType.WRONG_INFO]: 'معلومات خاطئة',
          [ReportType.SPAM]: 'محتوى غير مناسب',
        };

        // Get business name for notification
        const business = await this.prisma.business.findUnique({
          where: { id: report.businessId },
          include: {
            translations: {
              where: { locale: 'ar' },
              take: 1,
            },
          },
        });

        const businessName = business?.translations[0]?.name || 'النشاط';

        await this.notificationService.notifyReportResolved(
          report.reporterId,
          businessName,
          reportTypeDescriptions[report.type] || report.type,
          data.resolution || 'تم حل البلاغ',
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to send notification for resolved report: ${errorMessage}`);
        // Don't fail the resolution if notification fails
      }
    }

    this.logger.log(
      `Report ${id} ${data.status.toLowerCase()} by admin ${adminId}`,
    );

    return this.mapToResponseDto(updated);
  }

  /**
   * Get report statistics
   */
  async getStatistics(): Promise<ReportStatisticsDto> {
    // Get total counts by status
    const [totalReports, pendingReports, resolvedReports, rejectedReports] =
      await Promise.all([
        this.prisma.dataReport.count(),
        this.prisma.dataReport.count({ where: { status: ReportStatus.PENDING } }),
        this.prisma.dataReport.count({ where: { status: ReportStatus.RESOLVED } }),
        this.prisma.dataReport.count({ where: { status: ReportStatus.REJECTED } }),
      ]);

    // Get counts by type
    const reportsByTypeRaw = await this.prisma.dataReport.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    const reportsByType = reportsByTypeRaw.map((item) => ({
      type: item.type,
      count: item._count.id,
    }));

    // Calculate average resolution time for resolved reports
    const resolvedReportsWithTime = await this.prisma.dataReport.findMany({
      where: {
        status: ReportStatus.RESOLVED,
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let averageResolutionTimeHours: number | undefined;
    if (resolvedReportsWithTime.length > 0) {
      const totalResolutionTimeMs = resolvedReportsWithTime.reduce((sum, report) => {
        if (report.resolvedAt) {
          return sum + (report.resolvedAt.getTime() - report.createdAt.getTime());
        }
        return sum;
      }, 0);
      const averageResolutionTimeMs = totalResolutionTimeMs / resolvedReportsWithTime.length;
      averageResolutionTimeHours = averageResolutionTimeMs / (1000 * 60 * 60); // Convert to hours
    }

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      rejectedReports,
      reportsByType,
      averageResolutionTimeHours,
    };
  }

  /**
   * Delete a report (admin only, for spam/invalid reports)
   */
  async delete(id: string): Promise<void> {
    const report = await this.prisma.dataReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.prisma.dataReport.delete({
      where: { id },
    });

    this.logger.log(`Report ${id} deleted`);
  }

  /**
   * Map Prisma report to response DTO
   */
  private mapToResponseDto(report: any): ReportResponseDto {
    return {
      id: report.id,
      businessId: report.businessId,
      reporterId: report.reporterId,
      type: report.type,
      description: report.description,
      status: report.status,
      resolvedBy: report.resolvedBy,
      resolvedAt: report.resolvedAt,
      resolution: report.resolution,
      createdAt: report.createdAt,
      reporter: report.reporter,
      business: report.business,
    };
  }
}
