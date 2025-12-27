'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Phone,
  Info,
  Flag,
  User,
  Calendar,
  Building2,
  Search,
  Filter,
  ExternalLink,
  BarChart3,
  Clock,
  TrendingUp,
} from 'lucide-react';

enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

enum ReportType {
  WRONG_PHONE = 'WRONG_PHONE',
  WRONG_LOCATION = 'WRONG_LOCATION',
  CLOSED_BUSINESS = 'CLOSED_BUSINESS',
  WRONG_INFO = 'WRONG_INFO',
  SPAM = 'SPAM',
}

interface Report {
  id: string;
  businessId: string;
  reporterId: string;
  type: ReportType;
  description?: string;
  status: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  createdAt: Date;
  reporter?: {
    id: string;
    email: string;
  };
  business?: {
    id: string;
    slug: string;
    name?: string;
  };
}

interface PaginatedReports {
  data: Report[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ReportStatistics {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  rejectedReports: number;
  reportsByType: {
    type: ReportType;
    count: number;
  }[];
  averageResolutionTimeHours?: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  // Resolution dialog state
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<ReportStatus>(ReportStatus.RESOLVED);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [businessUpdates, setBusinessUpdates] = useState('');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ReportType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // View mode
  const [viewMode, setViewMode] = useState<'queue' | 'all' | 'statistics'>('queue');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  useEffect(() => {
    if (user) {
      if (viewMode === 'statistics') {
        loadStatistics();
      } else {
        loadReports();
      }
    }
  }, [user, page, statusFilter, typeFilter, searchQuery, viewMode]);

  const loadReports = async () => {
    try {
      setLoading(true);

      let endpoint = '/reports';
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (viewMode === 'queue') {
        endpoint = '/reports/pending';
      } else {
        if (statusFilter) params.append('status', statusFilter);
        if (typeFilter) params.append('type', typeFilter);
      }

      const data = await apiClient.get<PaginatedReports>(
        `${endpoint}?${params.toString()}`
      );

      // Enrich reports with business details
      const enrichedReports = await Promise.all(
        data.data.map(async (report) => {
          try {
            const business = await apiClient.get<any>(
              `/businesses/${report.businessId}?locale=ar`
            );
            return {
              ...report,
              business: {
                id: business.id,
                slug: business.slug,
                name: business.name,
              },
            };
          } catch (error) {
            console.error(`Failed to load business ${report.businessId}:`, error);
            return report;
          }
        })
      );

      // Apply client-side search filter
      let filteredReports = enrichedReports;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredReports = filteredReports.filter(
          (r) =>
            r.description?.toLowerCase().includes(query) ||
            r.reporter?.email.toLowerCase().includes(query) ||
            r.business?.name?.toLowerCase().includes(query)
        );
      }

      setReports(filteredReports);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<ReportStatistics>('/reports/statistics');
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveClick = (report: Report) => {
    setSelectedReport(report);
    setSelectedReportId(report.id);
    setResolutionStatus(ReportStatus.RESOLVED);
    setResolutionNotes('');
    setBusinessUpdates('');
    setShowResolutionDialog(true);
  };

  const handleRejectClick = (report: Report) => {
    setSelectedReport(report);
    setSelectedReportId(report.id);
    setResolutionStatus(ReportStatus.REJECTED);
    setResolutionNotes('');
    setBusinessUpdates('');
    setShowResolutionDialog(true);
  };

  const handleResolutionConfirm = async () => {
    if (!selectedReportId) return;

    if (resolutionStatus === ReportStatus.RESOLVED && !resolutionNotes.trim()) {
      if (!confirm('لم تقم بإدخال ملاحظات الحل. هل تريد المتابعة؟')) {
        return;
      }
    }

    try {
      setResolving(selectedReportId);

      const payload: any = {
        status: resolutionStatus,
        resolution: resolutionNotes.trim() || undefined,
      };

      // Add business updates if provided and status is RESOLVED
      if (resolutionStatus === ReportStatus.RESOLVED && businessUpdates.trim()) {
        try {
          JSON.parse(businessUpdates);
          payload.updatedBusinessData = businessUpdates.trim();
        } catch (error) {
          alert('تنسيق JSON غير صحيح في تحديثات النشاط');
          setResolving(null);
          return;
        }
      }

      await apiClient.patch(`/reports/${selectedReportId}/resolve`, payload);

      // Reload reports after resolution
      await loadReports();
      if (viewMode === 'statistics') {
        await loadStatistics();
      }

      // Close dialog
      setShowResolutionDialog(false);
      setSelectedReportId(null);
      setSelectedReport(null);
      setResolutionNotes('');
      setBusinessUpdates('');
    } catch (error: any) {
      console.error('Failed to resolve report:', error);

      if (
        error.response?.status === 409 ||
        error.response?.data?.message?.includes('already been resolved')
      ) {
        alert('⚠️ هذا البلاغ تمت معالجته بالفعل. سيتم تحديث القائمة.');
        await loadReports();
        setShowResolutionDialog(false);
      } else {
        const errorMessage =
          error.response?.data?.message || 'فشل في معالجة البلاغ';
        alert(errorMessage);
      }
    } finally {
      setResolving(null);
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setSearchQuery('');
    setPage(1);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReportTypeLabel = (type: ReportType) => {
    const labels: Record<ReportType, string> = {
      [ReportType.WRONG_PHONE]: 'رقم هاتف خاطئ',
      [ReportType.WRONG_LOCATION]: 'موقع خاطئ',
      [ReportType.CLOSED_BUSINESS]: 'نشاط مغلق',
      [ReportType.WRONG_INFO]: 'معلومات خاطئة',
      [ReportType.SPAM]: 'محتوى غير مناسب',
    };
    return labels[type] || type;
  };

  const getReportTypeIcon = (type: ReportType) => {
    const icons: Record<ReportType, any> = {
      [ReportType.WRONG_PHONE]: Phone,
      [ReportType.WRONG_LOCATION]: MapPin,
      [ReportType.CLOSED_BUSINESS]: XCircle,
      [ReportType.WRONG_INFO]: Info,
      [ReportType.SPAM]: Flag,
    };
    const Icon = icons[type] || AlertTriangle;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: ReportStatus) => {
    const badges: Record<ReportStatus, { label: string; className: string }> = {
      [ReportStatus.PENDING]: {
        label: 'معلق',
        className: 'bg-yellow-100 text-yellow-700',
      },
      [ReportStatus.RESOLVED]: {
        label: 'تم الحل',
        className: 'bg-green-100 text-green-700',
      },
      [ReportStatus.REJECTED]: {
        label: 'مرفوض',
        className: 'bg-red-100 text-red-700',
      },
    };
    const badge = badges[status];
    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
      >
        {badge.label}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">بلاغات البيانات</h1>
            <p className="text-muted-foreground">
              إدارة بلاغات المعلومات الخاطئة والمشاكل
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => {
              setViewMode('queue');
              setPage(1);
            }}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              viewMode === 'queue'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            قائمة الانتظار
          </button>
          <button
            onClick={() => {
              setViewMode('all');
              setPage(1);
            }}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              viewMode === 'all'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            جميع البلاغات
          </button>
          <button
            onClick={() => setViewMode('statistics')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              viewMode === 'statistics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            الإحصائيات
          </button>
        </div>

        {/* Statistics View */}
        {viewMode === 'statistics' && statistics && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    إجمالي البلاغات
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.totalReports}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    بلاغات معلقة
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {statistics.pendingReports}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    بلاغات محلولة
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.resolvedReports}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    بلاغات مرفوضة
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {statistics.rejectedReports}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reports by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  البلاغات حسب النوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.reportsByType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getReportTypeIcon(item.type)}
                        <span className="text-sm font-medium">
                          {getReportTypeLabel(item.type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(item.count / statistics.totalReports) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold w-12 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Average Resolution Time */}
            {statistics.averageResolutionTimeHours !== undefined && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    متوسط وقت الحل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {statistics.averageResolutionTimeHours.toFixed(1)} ساعة
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    متوسط الوقت المستغرق لحل البلاغات
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Reports List View */}
        {viewMode !== 'statistics' && (
          <>
            {/* Filters */}
            {viewMode === 'all' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    البحث والتصفية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        الحالة
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(
                            e.target.value ? (e.target.value as ReportStatus) : ''
                          );
                          setPage(1);
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">جميع الحالات</option>
                        <option value={ReportStatus.PENDING}>معلق</option>
                        <option value={ReportStatus.RESOLVED}>تم الحل</option>
                        <option value={ReportStatus.REJECTED}>مرفوض</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        نوع البلاغ
                      </label>
                      <select
                        value={typeFilter}
                        onChange={(e) => {
                          setTypeFilter(
                            e.target.value ? (e.target.value as ReportType) : ''
                          );
                          setPage(1);
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">جميع الأنواع</option>
                        <option value={ReportType.WRONG_PHONE}>رقم هاتف خاطئ</option>
                        <option value={ReportType.WRONG_LOCATION}>موقع خاطئ</option>
                        <option value={ReportType.CLOSED_BUSINESS}>نشاط مغلق</option>
                        <option value={ReportType.WRONG_INFO}>معلومات خاطئة</option>
                        <option value={ReportType.SPAM}>محتوى غير مناسب</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        البحث
                      </label>
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                          }}
                          placeholder="وصف البلاغ أو البريد..."
                          className="pr-10"
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetFilters}
                        className="w-full"
                      >
                        إعادة تعيين
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reports List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {viewMode === 'queue' ? `قائمة الانتظار (${total})` : `البلاغات (${total})`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد بلاغات</p>
                    <p className="text-sm mt-2">
                      {viewMode === 'queue'
                        ? 'جميع البلاغات تمت معالجتها'
                        : 'لم يتم العثور على بلاغات'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="p-6 hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-4">
                            {/* Report Header */}
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    {getReportTypeIcon(report.type)}
                                    <span>{getReportTypeLabel(report.type)}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{report.reporter?.email || 'مستخدم'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(report.createdAt)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Status Badge */}
                              {getStatusBadge(report.status)}
                            </div>

                            {/* Report Description */}
                            {report.description && (
                              <div className="bg-muted/50 rounded-lg p-4">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {report.description}
                                </p>
                              </div>
                            )}

                            {/* Business Info */}
                            {report.business && (
                              <div className="bg-blue-50 rounded-lg p-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-blue-600" />
                                      <span className="font-medium text-blue-900">
                                        {report.business.name || 'غير متوفر'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mr-6">
                                      معرف: {report.business.slug}
                                    </div>
                                  </div>
                                  <a
                                    href={`/businesses?query=${report.business.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    فتح
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Resolution Info (if resolved/rejected) */}
                            {report.status !== ReportStatus.PENDING && (
                              <div
                                className={`rounded-lg p-3 ${
                                  report.status === ReportStatus.RESOLVED
                                    ? 'bg-green-50'
                                    : 'bg-red-50'
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    {report.status === ReportStatus.RESOLVED ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <span>
                                      {report.status === ReportStatus.RESOLVED
                                        ? 'تم الحل'
                                        : 'تم الرفض'}
                                    </span>
                                  </div>
                                  {report.resolution && (
                                    <p className="text-sm text-muted-foreground mr-6">
                                      {report.resolution}
                                    </p>
                                  )}
                                  {report.resolvedAt && (
                                    <p className="text-xs text-muted-foreground mr-6">
                                      {formatDate(report.resolvedAt)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons (only for pending reports) */}
                            {report.status === ReportStatus.PENDING && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleResolveClick(report)}
                                  disabled={resolving === report.id}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="ml-2 h-4 w-4" />
                                  {resolving === report.id ? 'جاري المعالجة...' : 'حل'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectClick(report)}
                                  disabled={resolving === report.id}
                                >
                                  <XCircle className="ml-2 h-4 w-4" />
                                  {resolving === report.id ? 'جاري المعالجة...' : 'رفض'}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t p-4">
                        <div className="text-sm text-muted-foreground">
                          صفحة {page} من {totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                          >
                            السابق
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                          >
                            التالي
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Resolution Dialog */}
      {showResolutionDialog && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {resolutionStatus === ReportStatus.RESOLVED
                    ? 'حل البلاغ'
                    : 'رفض البلاغ'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {resolutionStatus === ReportStatus.RESOLVED
                    ? 'قم بتحديث بيانات النشاط إذا لزم الأمر وأضف ملاحظات الحل'
                    : 'أضف سبب الرفض'}
                </p>
              </div>

              {/* Report Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {getReportTypeIcon(selectedReport.type)}
                  <span>{getReportTypeLabel(selectedReport.type)}</span>
                </div>
                {selectedReport.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.description}
                  </p>
                )}
                {selectedReport.business && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-3 w-3" />
                    <span>{selectedReport.business.name}</span>
                  </div>
                )}
              </div>

              {/* Business Updates (only for RESOLVED) */}
              {resolutionStatus === ReportStatus.RESOLVED && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    تحديثات النشاط (JSON - اختياري)
                  </label>
                  <textarea
                    value={businessUpdates}
                    onChange={(e) => setBusinessUpdates(e.target.value)}
                    placeholder='مثال: {"phone": "0123456789", "isActive": true}'
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    أدخل JSON صحيح للحقول المراد تحديثها في النشاط التجاري
                  </p>
                </div>
              )}

              {/* Resolution Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {resolutionStatus === ReportStatus.RESOLVED
                    ? 'ملاحظات الحل'
                    : 'سبب الرفض'}
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={
                    resolutionStatus === ReportStatus.RESOLVED
                      ? 'تم تحديث رقم الهاتف، تم التحقق من الموقع...'
                      : 'بلاغ غير صحيح، معلومات غير دقيقة...'
                  }
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground mt-1 text-left">
                  {resolutionNotes.length}/500
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResolutionDialog(false);
                    setSelectedReportId(null);
                    setSelectedReport(null);
                    setResolutionNotes('');
                    setBusinessUpdates('');
                  }}
                  disabled={resolving !== null}
                >
                  إلغاء
                </Button>
                <Button
                  variant={
                    resolutionStatus === ReportStatus.RESOLVED
                      ? 'default'
                      : 'destructive'
                  }
                  onClick={handleResolutionConfirm}
                  disabled={resolving !== null}
                  className={
                    resolutionStatus === ReportStatus.RESOLVED
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                  }
                >
                  {resolutionStatus === ReportStatus.RESOLVED ? (
                    <CheckCircle className="ml-2 h-4 w-4" />
                  ) : (
                    <XCircle className="ml-2 h-4 w-4" />
                  )}
                  {resolving
                    ? 'جاري المعالجة...'
                    : resolutionStatus === ReportStatus.RESOLVED
                    ? 'تأكيد الحل'
                    : 'تأكيد الرفض'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
