import { IsString, IsEnum, IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportType, ReportStatus } from '@prisma/client';

export { ReportType, ReportStatus };

/**
 * DTO for creating a new data report
 */
export class CreateReportDto {
  @IsUUID()
  businessId!: string;

  @IsEnum(ReportType)
  type!: ReportType;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for resolving a report
 */
export class ResolveReportDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus; // RESOLVED or REJECTED

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  updatedBusinessData?: string; // JSON string of updated business fields
}

/**
 * DTO for querying reports with filters
 */
export class GetReportsDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @IsOptional()
  @IsUUID()
  businessId?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

/**
 * Response DTO for a single report
 */
export class ReportResponseDto {
  id!: string;
  businessId!: string;
  reporterId!: string;
  type!: ReportType;
  description?: string;
  status!: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  createdAt!: Date;
  reporter?: {
    id: string;
    email: string;
  };
  business?: {
    id: string;
    slug: string;
  };
}

/**
 * Paginated reports response
 */
export class PaginatedReportsDto {
  data!: ReportResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}

/**
 * Report statistics response
 */
export class ReportStatisticsDto {
  totalReports!: number;
  pendingReports!: number;
  resolvedReports!: number;
  rejectedReports!: number;
  reportsByType!: {
    type: ReportType;
    count: number;
  }[];
  averageResolutionTimeHours?: number;
}
