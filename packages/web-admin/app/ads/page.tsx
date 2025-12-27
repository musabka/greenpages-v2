'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, TrendingUp, Eye, MousePointerClick, Calendar, DollarSign } from 'lucide-react';
import { CampaignDialog } from '@/components/ads/campaign-dialog';

interface AdCampaign {
  id: string;
  businessId: string;
  budget: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ads: Ad[];
}

interface Ad {
  id: string;
  campaignId: string;
  placement: string;
  governorateId: string | null;
  cityId: string | null;
  districtId: string | null;
  categoryId: string | null;
  activeHoursStart: number | null;
  activeHoursEnd: number | null;
  impressions: number;
  clicks: number;
  isActive: boolean;
}

interface PerformanceReport {
  campaignId: string;
  businessId: string;
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  budget: number;
  startDate: string;
  endDate: string;
  adPerformance: {
    adId: string;
    placement: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }[];
}

export default function AdsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadCampaigns();
  }, [router]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      // For now, we'll need to implement a list all campaigns endpoint
      // or load by business. Let's use a placeholder approach
      const data = await apiClient.get<AdCampaign[]>('/ads/campaigns');
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCampaign(null);
    setDialogOpen(true);
  };

  const handleEdit = async (campaign: AdCampaign) => {
    setEditingCampaign(campaign);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحملة الإعلانية؟')) return;

    try {
      await apiClient.delete(`/ads/campaigns/${id}`);
      await loadCampaigns();
    } catch (error: any) {
      console.error('Failed to delete campaign:', error);
      const errorMessage = error.response?.data?.message || 'فشل حذف الحملة';
      alert(errorMessage);
    }
  };

  const handleViewPerformance = async (campaignId: string) => {
    try {
      const report = await apiClient.get<PerformanceReport>(`/ads/campaigns/${campaignId}/performance`);
      setPerformanceReport(report);
      setSelectedCampaignId(campaignId);
    } catch (error) {
      console.error('Failed to load performance report:', error);
      alert('فشل تحميل تقرير الأداء');
    }
  };

  const handleSave = async () => {
    setDialogOpen(false);
    await loadCampaigns();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPlacementLabel = (placement: string) => {
    const labels: Record<string, string> = {
      SEARCH_SPONSORED: 'نتائج البحث المدعومة',
      HOME_HERO: 'بانر الصفحة الرئيسية',
      CATEGORY_BANNER: 'بانر صفحة التصنيف',
      PROFILE_SIDEBAR: 'الشريط الجانبي للملف',
      MAP_PIN_HIGHLIGHT: 'تمييز دبوس الخريطة',
      SEARCH_AUTOCOMPLETE: 'اقتراحات البحث التلقائي',
    };
    return labels[placement] || placement;
  };

  const calculateTotalStats = (campaign: AdCampaign) => {
    const totalImpressions = campaign.ads.reduce((sum, ad) => sum + ad.impressions, 0);
    const totalClicks = campaign.ads.reduce((sum, ad) => sum + ad.clicks, 0);
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
    return { totalImpressions, totalClicks, ctr };
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
            <h1 className="text-3xl font-bold">الحملات الإعلانية</h1>
            <p className="text-muted-foreground">إدارة الحملات الإعلانية وتقارير الأداء</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="ml-2 h-4 w-4" />
            إنشاء حملة جديدة
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground">لا توجد حملات إعلانية</p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="ml-2 h-4 w-4" />
                إنشاء أول حملة
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const stats = calculateTotalStats(campaign);
              const isActive = campaign.isActive && new Date(campaign.endDate) > new Date();
              
              return (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          حملة #{campaign.id.slice(0, 8)}
                          {isActive ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              نشط
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                              غير نشط
                            </span>
                          )}
                        </CardTitle>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatPrice(campaign.budget)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Performance Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span>مرات الظهور</span>
                        </div>
                        <div className="mt-1 text-2xl font-bold">{stats.totalImpressions.toLocaleString('ar-EG')}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MousePointerClick className="h-4 w-4" />
                          <span>النقرات</span>
                        </div>
                        <div className="mt-1 text-2xl font-bold">{stats.totalClicks.toLocaleString('ar-EG')}</div>
                      </div>
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span>معدل النقر (CTR)</span>
                        </div>
                        <div className="mt-1 text-2xl font-bold">{stats.ctr}%</div>
                      </div>
                    </div>

                    {/* Ad Placements */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium">المواضع الإعلانية ({campaign.ads.length})</h4>
                      <div className="space-y-2">
                        {campaign.ads.map((ad) => (
                          <div key={ad.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{getPlacementLabel(ad.placement)}</span>
                              {!ad.isActive && (
                                <span className="text-xs text-muted-foreground">(غير نشط)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{ad.impressions.toLocaleString('ar-EG')} ظهور</span>
                              <span>{ad.clicks.toLocaleString('ar-EG')} نقرة</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPerformance(campaign.id)}
                        className="flex-1"
                      >
                        <TrendingUp className="ml-2 h-4 w-4" />
                        تقرير الأداء
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(campaign)}
                        className="flex-1"
                      >
                        <Edit className="ml-2 h-4 w-4" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(campaign.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Performance Report Modal */}
        {performanceReport && selectedCampaignId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPerformanceReport(null)}>
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle>تقرير أداء الحملة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">مرات الظهور</div>
                    <div className="mt-1 text-2xl font-bold">{performanceReport.totalImpressions.toLocaleString('ar-EG')}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">النقرات</div>
                    <div className="mt-1 text-2xl font-bold">{performanceReport.totalClicks.toLocaleString('ar-EG')}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">معدل النقر</div>
                    <div className="mt-1 text-2xl font-bold">{performanceReport.ctr}%</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">الميزانية</div>
                    <div className="mt-1 text-2xl font-bold">{formatPrice(performanceReport.budget)}</div>
                  </div>
                </div>

                {/* Per-Ad Performance */}
                <div>
                  <h4 className="mb-3 font-medium">أداء كل موضع إعلاني</h4>
                  <div className="space-y-2">
                    {performanceReport.adPerformance.map((ad) => (
                      <div key={ad.adId} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{getPlacementLabel(ad.placement)}</div>
                          <div className="text-sm text-muted-foreground">#{ad.adId.slice(0, 8)}</div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">مرات الظهور</div>
                            <div className="font-medium">{ad.impressions.toLocaleString('ar-EG')}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">النقرات</div>
                            <div className="font-medium">{ad.clicks.toLocaleString('ar-EG')}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">معدل النقر</div>
                            <div className="font-medium">{ad.ctr}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setPerformanceReport(null)}>إغلاق</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaign={editingCampaign}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
