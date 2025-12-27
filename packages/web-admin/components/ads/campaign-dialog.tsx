'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { Plus, Trash2 } from 'lucide-react';

interface AdCampaign {
  id: string;
  businessId: string;
  budget: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  ads: Ad[];
}

interface Ad {
  id?: string;
  placement: string;
  governorateId: string | null;
  cityId: string | null;
  districtId: string | null;
  categoryId: string | null;
  activeHoursStart: number | null;
  activeHoursEnd: number | null;
  isActive: boolean;
}

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: AdCampaign | null;
  onSave: () => void;
}

interface Business {
  id: string;
  name: string;
}

interface Governorate {
  id: string;
  name: string;
}

interface City {
  id: string;
  name: string;
  governorateId: string;
}

interface District {
  id: string;
  name: string;
  cityId: string;
}

interface Category {
  id: string;
  name: string;
}

const AD_PLACEMENTS = [
  { value: 'SEARCH_SPONSORED', label: 'نتائج البحث المدعومة' },
  { value: 'HOME_HERO', label: 'بانر الصفحة الرئيسية' },
  { value: 'CATEGORY_BANNER', label: 'بانر صفحة التصنيف' },
  { value: 'PROFILE_SIDEBAR', label: 'الشريط الجانبي للملف' },
  { value: 'MAP_PIN_HIGHLIGHT', label: 'تمييز دبوس الخريطة' },
  { value: 'SEARCH_AUTOCOMPLETE', label: 'اقتراحات البحث التلقائي' },
];

export function CampaignDialog({ open, onOpenChange, campaign, onSave }: CampaignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    businessId: '',
    budget: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const [ads, setAds] = useState<Ad[]>([
    {
      placement: 'SEARCH_SPONSORED',
      governorateId: null,
      cityId: null,
      districtId: null,
      categoryId: null,
      activeHoursStart: null,
      activeHoursEnd: null,
      isActive: true,
    },
  ]);

  useEffect(() => {
    if (open) {
      loadData();
      if (campaign) {
        setFormData({
          businessId: campaign.businessId,
          budget: campaign.budget.toString(),
          startDate: campaign.startDate.split('T')[0],
          endDate: campaign.endDate.split('T')[0],
          isActive: campaign.isActive,
        });
        setAds(campaign.ads.map(ad => ({
          ...ad,
          governorateId: ad.governorateId || null,
          cityId: ad.cityId || null,
          districtId: ad.districtId || null,
          categoryId: ad.categoryId || null,
        })));
      } else {
        resetForm();
      }
    }
  }, [open, campaign]);

  const loadData = async () => {
    try {
      const [businessesData, governoratesData, categoriesData] = await Promise.all([
        apiClient.get<any[]>('/directory/businesses?page=1&limit=1000&locale=ar'),
        apiClient.get<Governorate[]>('/geo/governorates?locale=ar'),
        apiClient.get<Category[]>('/categories?locale=ar'),
      ]);

      setBusinesses(businessesData.map((b: any) => ({ id: b.id, name: b.name })));
      setGovernorates(governoratesData);
      setCategories(categoriesData);

      // Load all cities
      const citiesData = await apiClient.get<City[]>('/geo/cities?locale=ar');
      setCities(citiesData);

      // Load all districts
      const districtsData = await apiClient.get<District[]>('/geo/districts?locale=ar');
      setDistricts(districtsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      businessId: '',
      budget: '',
      startDate: '',
      endDate: '',
      isActive: true,
    });
    setAds([
      {
        placement: 'SEARCH_SPONSORED',
        governorateId: null,
        cityId: null,
        districtId: null,
        categoryId: null,
        activeHoursStart: null,
        activeHoursEnd: null,
        isActive: true,
      },
    ]);
  };

  const handleAddAd = () => {
    setAds([
      ...ads,
      {
        placement: 'SEARCH_SPONSORED',
        governorateId: null,
        cityId: null,
        districtId: null,
        categoryId: null,
        activeHoursStart: null,
        activeHoursEnd: null,
        isActive: true,
      },
    ]);
  };

  const handleRemoveAd = (index: number) => {
    setAds(ads.filter((_, i) => i !== index));
  };

  const handleAdChange = (index: number, field: keyof Ad, value: any) => {
    const newAds = [...ads];
    newAds[index] = { ...newAds[index], [field]: value };
    setAds(newAds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        businessId: formData.businessId,
        budget: parseFloat(formData.budget),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: formData.isActive,
        ads: ads.map(ad => ({
          placement: ad.placement,
          governorateId: ad.governorateId || undefined,
          cityId: ad.cityId || undefined,
          districtId: ad.districtId || undefined,
          categoryId: ad.categoryId || undefined,
          activeHoursStart: ad.activeHoursStart !== null ? parseInt(ad.activeHoursStart.toString()) : undefined,
          activeHoursEnd: ad.activeHoursEnd !== null ? parseInt(ad.activeHoursEnd.toString()) : undefined,
          isActive: ad.isActive,
        })),
      };

      if (campaign) {
        await apiClient.put(`/ads/campaigns/${campaign.id}`, {
          budget: payload.budget,
          startDate: payload.startDate,
          endDate: payload.endDate,
          isActive: payload.isActive,
        });
      } else {
        await apiClient.post('/ads/campaigns', payload);
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save campaign:', error);
      const errorMessage = error.response?.data?.message || 'فشل حفظ الحملة';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCities = (governorateId: string | null) => {
    if (!governorateId) return [];
    return cities.filter(c => c.governorateId === governorateId);
  };

  const getFilteredDistricts = (cityId: string | null) => {
    if (!cityId) return [];
    return districts.filter(d => d.cityId === cityId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{campaign ? 'تعديل الحملة الإعلانية' : 'إنشاء حملة إعلانية جديدة'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">تفاصيل الحملة</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessId">النشاط التجاري *</Label>
                <select
                  id="businessId"
                  value={formData.businessId}
                  onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  disabled={!!campaign}
                >
                  <option value="">اختر النشاط التجاري</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">الميزانية (جنيه) *</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">تاريخ البداية *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">تاريخ النهاية *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isActive" className="cursor-pointer">نشط</Label>
              </div>
            </div>
          </div>

          {/* Ad Placements */}
          {!campaign && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">المواضع الإعلانية</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddAd}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة موضع
                </Button>
              </div>

              <div className="space-y-4">
                {ads.map((ad, index) => (
                  <div key={index} className="rounded-lg border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">موضع إعلاني {index + 1}</h4>
                      {ads.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAd(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>نوع الموضع *</Label>
                        <select
                          value={ad.placement}
                          onChange={(e) => handleAdChange(index, 'placement', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                        >
                          {AD_PLACEMENTS.map((placement) => (
                            <option key={placement.value} value={placement.value}>
                              {placement.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse pt-8">
                        <input
                          type="checkbox"
                          checked={ad.isActive}
                          onChange={(e) => handleAdChange(index, 'isActive', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label className="cursor-pointer">نشط</Label>
                      </div>
                    </div>

                    {/* Geographic Targeting */}
                    <div>
                      <h5 className="mb-2 text-sm font-medium">الاستهداف الجغرافي (اختياري)</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>المحافظة</Label>
                          <select
                            value={ad.governorateId || ''}
                            onChange={(e) => {
                              handleAdChange(index, 'governorateId', e.target.value || null);
                              handleAdChange(index, 'cityId', null);
                              handleAdChange(index, 'districtId', null);
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">الكل</option>
                            {governorates.map((gov) => (
                              <option key={gov.id} value={gov.id}>
                                {gov.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>المدينة</Label>
                          <select
                            value={ad.cityId || ''}
                            onChange={(e) => {
                              handleAdChange(index, 'cityId', e.target.value || null);
                              handleAdChange(index, 'districtId', null);
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            disabled={!ad.governorateId}
                          >
                            <option value="">الكل</option>
                            {getFilteredCities(ad.governorateId).map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>الحي</Label>
                          <select
                            value={ad.districtId || ''}
                            onChange={(e) => handleAdChange(index, 'districtId', e.target.value || null)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            disabled={!ad.cityId}
                          >
                            <option value="">الكل</option>
                            {getFilteredDistricts(ad.cityId).map((district) => (
                              <option key={district.id} value={district.id}>
                                {district.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Category Targeting */}
                    <div className="space-y-2">
                      <Label>التصنيف (اختياري)</Label>
                      <select
                        value={ad.categoryId || ''}
                        onChange={(e) => handleAdChange(index, 'categoryId', e.target.value || null)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">الكل</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Time Targeting */}
                    <div>
                      <h5 className="mb-2 text-sm font-medium">الاستهداف الزمني (اختياري)</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>ساعة البداية (0-23)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={ad.activeHoursStart !== null ? ad.activeHoursStart : ''}
                            onChange={(e) => handleAdChange(index, 'activeHoursStart', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="الكل"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>ساعة النهاية (0-23)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={ad.activeHoursEnd !== null ? ad.activeHoursEnd : ''}
                            onChange={(e) => handleAdChange(index, 'activeHoursEnd', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="الكل"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : campaign ? 'تحديث' : 'إنشاء'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
