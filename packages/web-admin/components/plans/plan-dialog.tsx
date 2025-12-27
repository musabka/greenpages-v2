'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { X, Plus, Trash2 } from 'lucide-react';

interface Plan {
  id: string;
  slug: string;
  price: number;
  durationDays: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  name: string;
  description: string | null;
  translations: { locale: string; name: string; description: string | null }[];
  features: { featureKey: string; featureValue: string }[];
}

interface PlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSave: () => void;
}

interface Translation {
  locale: string;
  name: string;
  description: string;
}

interface Feature {
  featureKey: string;
  featureValue: string;
}

const FEATURE_KEYS = [
  { key: 'max_images', label: 'الحد الأقصى للصور', type: 'number' },
  { key: 'show_whatsapp', label: 'عرض واتساب', type: 'boolean' },
  { key: 'show_working_hours', label: 'عرض ساعات العمل', type: 'boolean' },
  { key: 'map_pin_visible', label: 'إظهار على الخريطة', type: 'boolean' },
  { key: 'search_priority', label: 'أولوية البحث', type: 'number' },
  { key: 'profile_highlight', label: 'تمييز الملف الشخصي', type: 'boolean' },
  { key: 'show_website', label: 'عرض الموقع الإلكتروني', type: 'boolean' },
  { key: 'show_email', label: 'عرض البريد الإلكتروني', type: 'boolean' },
];

export function PlanDialog({ open, onOpenChange, plan, onSave }: PlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [translations, setTranslations] = useState<Translation[]>([
    { locale: 'ar', name: '', description: '' },
    { locale: 'en', name: '', description: '' },
  ]);
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    if (plan) {
      setSlug(plan.slug);
      setPrice(plan.price.toString());
      setDurationDays(plan.durationDays.toString());
      setIsDefault(plan.isDefault);
      setIsActive(plan.isActive);
      setSortOrder(plan.sortOrder.toString());
      setTranslations(
        plan.translations.map((t) => ({
          locale: t.locale,
          name: t.name,
          description: t.description || '',
        }))
      );
      setFeatures(plan.features || []);
    } else {
      resetForm();
    }
  }, [plan, open]);

  const resetForm = () => {
    setSlug('');
    setPrice('');
    setDurationDays('');
    setIsDefault(false);
    setIsActive(true);
    setSortOrder('0');
    setTranslations([
      { locale: 'ar', name: '', description: '' },
      { locale: 'en', name: '', description: '' },
    ]);
    setFeatures([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        slug,
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
        isDefault,
        isActive,
        sortOrder: parseInt(sortOrder),
        translations: translations.filter((t) => t.name.trim() !== ''),
        features: features.filter((f) => f.featureKey && f.featureValue),
      };

      if (plan) {
        await apiClient.put(`/plans/${plan.id}`, data);
      } else {
        await apiClient.post('/plans', data);
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to save plan:', error);
      const errorMessage = error.response?.data?.message || 'فشل حفظ الباقة';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateTranslation = (index: number, field: keyof Translation, value: string) => {
    const updated = [...translations];
    updated[index] = { ...updated[index], [field]: value };
    setTranslations(updated);
  };

  const addFeature = () => {
    setFeatures([...features, { featureKey: '', featureValue: '' }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, field: keyof Feature, value: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: value };
    setFeatures(updated);
  };

  const getFeatureType = (key: string): string => {
    return FEATURE_KEYS.find((f) => f.key === key)?.type || 'text';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'تعديل الباقة' : 'إضافة باقة جديدة'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">المعلومات الأساسية</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">الرمز (Slug) *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="basic-plan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">السعر (جنيه) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durationDays">المدة (بالأيام) *</Label>
                <Input
                  id="durationDays"
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="30"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  30 = شهر، 90 = 3 أشهر، 365 = سنة
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">الترتيب</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">نشط</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">باقة افتراضية</span>
              </label>
            </div>
          </div>

          {/* Translations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">الترجمات</h3>
            
            {translations.map((translation, index) => (
              <div key={translation.locale} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-base">
                    {translation.locale === 'ar' ? 'العربية' : 'English'}
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`name-${translation.locale}`}>الاسم *</Label>
                  <Input
                    id={`name-${translation.locale}`}
                    value={translation.name}
                    onChange={(e) => updateTranslation(index, 'name', e.target.value)}
                    placeholder={translation.locale === 'ar' ? 'الباقة الأساسية' : 'Basic Plan'}
                    required={translation.locale === 'ar'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`description-${translation.locale}`}>الوصف</Label>
                  <textarea
                    id={`description-${translation.locale}`}
                    value={translation.description}
                    onChange={(e) => updateTranslation(index, 'description', e.target.value)}
                    placeholder={translation.locale === 'ar' ? 'وصف الباقة...' : 'Plan description...'}
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">المميزات</h3>
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة ميزة
              </Button>
            </div>

            {features.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد مميزات. اضغط "إضافة ميزة" لإضافة مميزات للباقة.
              </p>
            ) : (
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-3 items-start p-3 border rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`feature-key-${index}`}>المفتاح</Label>
                        <select
                          id={`feature-key-${index}`}
                          value={feature.featureKey}
                          onChange={(e) => updateFeature(index, 'featureKey', e.target.value)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">اختر ميزة...</option>
                          {FEATURE_KEYS.map((fk) => (
                            <option key={fk.key} value={fk.key}>
                              {fk.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`feature-value-${index}`}>القيمة</Label>
                        {getFeatureType(feature.featureKey) === 'boolean' ? (
                          <select
                            id={`feature-value-${index}`}
                            value={feature.featureValue}
                            onChange={(e) => updateFeature(index, 'featureValue', e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="true">نعم</option>
                            <option value="false">لا</option>
                          </select>
                        ) : (
                          <Input
                            id={`feature-value-${index}`}
                            type={getFeatureType(feature.featureKey) === 'number' ? 'number' : 'text'}
                            value={feature.featureValue}
                            onChange={(e) => updateFeature(index, 'featureValue', e.target.value)}
                            placeholder={getFeatureType(feature.featureKey) === 'number' ? '0' : 'قيمة'}
                          />
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeature(index)}
                      className="mt-7"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : plan ? 'حفظ التعديلات' : 'إضافة الباقة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
