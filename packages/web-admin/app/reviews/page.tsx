'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Star, User, Calendar, MessageSquare, Building2, Search, Filter, ExternalLink } from 'lucide-react';

enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

interface BusinessInfo {
  id: string;
  slug: string;
  name: string;
  categoryName?: string;
}

interface Review {
  id: string;
  businessId: string;
  userId: string;
  rating: number;
  text?: string;
  status: ReviewStatus;
  moderatedBy?: string;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
  };
  business?: BusinessInfo;
}

interface PaginatedReviews {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ReviewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [moderating, setModerating] = useState<string | null>(null);
  
  // Moderation dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Filter state
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [businessNameFilter, setBusinessNameFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

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
      loadPendingReviews();
    }
  }, [user, page, ratingFilter, searchQuery, businessNameFilter]);

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      
      const data = await apiClient.get<PaginatedReviews>(
        `/reviews/admin/pending?page=${page}&limit=${limit}`
      );
      
      // Enrich reviews with business details
      const enrichedReviews = await Promise.all(
        data.data.map(async (review) => {
          try {
            const business = await apiClient.get<any>(
              `/businesses/${review.businessId}?locale=ar`
            );
            return {
              ...review,
              business: {
                id: business.id,
                slug: business.slug,
                name: business.name,
                categoryName: business.categoryName,
              },
            };
          } catch (error) {
            console.error(`Failed to load business ${review.businessId}:`, error);
            return review;
          }
        })
      );
      
      // Apply client-side filters
      let filteredReviews = enrichedReviews;
      
      if (ratingFilter) {
        filteredReviews = filteredReviews.filter(r => r.rating === ratingFilter);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredReviews = filteredReviews.filter(r => 
          r.text?.toLowerCase().includes(query) ||
          r.user?.email.toLowerCase().includes(query)
        );
      }
      
      if (businessNameFilter) {
        const query = businessNameFilter.toLowerCase();
        filteredReviews = filteredReviews.filter(r =>
          r.business?.name?.toLowerCase().includes(query)
        );
      }
      
      setReviews(filteredReviews);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load pending reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (reviewId: string, status: ReviewStatus, notes?: string) => {
    try {
      setModerating(reviewId);
      
      await apiClient.put(`/reviews/${reviewId}/moderate`, {
        status,
        notes,
      });
      
      // Reload reviews after moderation
      await loadPendingReviews();
      
      // Close dialog if open
      setShowRejectDialog(false);
      setSelectedReviewId(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Failed to moderate review:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409 || error.response?.data?.message?.includes('already moderated')) {
        alert('⚠️ هذه المراجعة تمت معالجتها بالفعل من قبل مشرف آخر. سيتم تحديث القائمة.');
        await loadPendingReviews();
      } else {
        const errorMessage = error.response?.data?.message || 'فشل في معالجة المراجعة';
        alert(errorMessage);
      }
    } finally {
      setModerating(null);
    }
  };

  const handleApprove = (reviewId: string) => {
    if (!confirm('هل أنت متأكد من الموافقة على هذه المراجعة؟')) {
      return;
    }
    handleModerate(reviewId, ReviewStatus.APPROVED);
  };

  const handleRejectClick = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedReviewId) return;
    
    if (!rejectionReason.trim()) {
      if (!confirm('لم تقم بإدخال سبب الرفض. هل تريد المتابعة بدون سبب؟')) {
        return;
      }
    }
    
    handleModerate(selectedReviewId, ReviewStatus.REJECTED, rejectionReason.trim() || undefined);
  };

  const handleResetFilters = () => {
    setRatingFilter('');
    setSearchQuery('');
    setBusinessNameFilter('');
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
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
            <h1 className="text-3xl font-bold">مراجعة التقييمات</h1>
            <p className="text-muted-foreground">
              الموافقة على التقييمات المعلقة أو رفضها
            </p>
          </div>
        </div>

        {/* Filters */}
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
                <label className="text-sm font-medium mb-2 block">التقييم</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => {
                    setRatingFilter(e.target.value ? Number(e.target.value) : '');
                    setPage(1);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">جميع التقييمات</option>
                  <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                  <option value="4">⭐⭐⭐⭐ (4)</option>
                  <option value="3">⭐⭐⭐ (3)</option>
                  <option value="2">⭐⭐ (2)</option>
                  <option value="1">⭐ (1)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">البحث في النص</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="نص المراجعة أو البريد الإلكتروني..."
                    className="pr-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">اسم النشاط</label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={businessNameFilter}
                    onChange={(e) => {
                      setBusinessNameFilter(e.target.value);
                      setPage(1);
                    }}
                    placeholder="ابحث عن نشاط تجاري..."
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
                  إعادة تعيين الفلاتر
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Reviews Count */}
        <Card>
          <CardHeader>
            <CardTitle>التقييمات المعلقة ({total})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">{loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد تقييمات معلقة</p>
                <p className="text-sm mt-2">جميع التقييمات تمت مراجعتها</p>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-6 hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-4">
                        {/* Review Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              {renderStars(review.rating)}
                              <span className="text-sm font-medium">
                                {review.rating} من 5
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{review.user?.email || 'مستخدم'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(review.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                            معلق
                          </span>
                        </div>

                        {/* Review Text */}
                        {review.text && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {review.text}
                            </p>
                          </div>
                        )}

                        {/* Business Info - Enhanced */}
                        {review.business && (
                          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-blue-600" />
                                  <span className="font-medium text-blue-900">
                                    {review.business.name || 'غير متوفر'}
                                  </span>
                                </div>
                                {review.business.categoryName && (
                                  <div className="text-xs text-blue-700 mr-6">
                                    التصنيف: {review.business.categoryName}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground mr-6">
                                  معرف: {review.business.slug}
                                </div>
                              </div>
                              <a
                                href={`/businesses?query=${review.business.slug}`}
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

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(review.id)}
                            disabled={moderating === review.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="ml-2 h-4 w-4" />
                            {moderating === review.id ? 'جاري المعالجة...' : 'موافقة'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectClick(review.id)}
                            disabled={moderating === review.id}
                          >
                            <XCircle className="ml-2 h-4 w-4" />
                            {moderating === review.id ? 'جاري المعالجة...' : 'رفض'}
                          </Button>
                        </div>
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
      </div>

      {/* Rejection Reason Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">رفض المراجعة</h3>
                <p className="text-sm text-muted-foreground">
                  يُفضل إدخال سبب الرفض لتحسين الجودة ودعم العملاء
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  سبب الرفض (اختياري)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="مثال: محتوى غير لائق، معلومات خاطئة، إساءة..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground mt-1 text-left">
                  {rejectionReason.length}/500
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectDialog(false);
                    setSelectedReviewId(null);
                    setRejectionReason('');
                  }}
                  disabled={moderating !== null}
                >
                  إلغاء
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRejectConfirm}
                  disabled={moderating !== null}
                >
                  <XCircle className="ml-2 h-4 w-4" />
                  {moderating ? 'جاري الرفض...' : 'تأكيد الرفض'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
