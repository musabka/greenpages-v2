'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

interface Translation {
  locale: string;
  name: string;
}

interface Governorate {
  id: string;
  slug: string;
  name: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  translations: Translation[];
}

interface GovernorateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  governorate: Governorate | null;
  onSave: () => void;
}

export function GovernorateDialog({
  open,
  onOpenChange,
  governorate,
  onSave,
}: GovernorateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    lat: '',
    lng: '',
    isActive: true,
    translations: [
      { locale: 'ar', name: '' },
      { locale: 'en', name: '' },
    ],
  });

  useEffect(() => {
    if (governorate) {
      setFormData({
        slug: governorate.slug,
        lat: governorate.lat?.toString() || '',
        lng: governorate.lng?.toString() || '',
        isActive: governorate.isActive,
        translations: governorate.translations.length > 0
          ? governorate.translations
          : [
              { locale: 'ar', name: '' },
              { locale: 'en', name: '' },
            ],
      });
    } else {
      setFormData({
        slug: '',
        lat: '',
        lng: '',
        isActive: true,
        translations: [
          { locale: 'ar', name: '' },
          { locale: 'en', name: '' },
        ],
      });
    }
  }, [governorate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        slug: formData.slug,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        isActive: formData.isActive,
        translations: formData.translations.filter((t) => t.name.trim() !== ''),
      };

      if (governorate) {
        await apiClient.put(`/geo/governorates/${governorate.id}`, payload);
      } else {
        await apiClient.post('/geo/governorates', payload);
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save governorate:', error);
      alert('فشل حفظ المحافظة');
    } finally {
      setLoading(false);
    }
  };

  const updateTranslation = (locale: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: prev.translations.map((t) =>
        t.locale === locale ? { ...t, name } : t
      ),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {governorate ? 'تعديل محافظة' : 'إضافة محافظة جديدة'}
          </DialogTitle>
          <DialogDescription>
            أدخل معلومات المحافظة بالعربية والإنجليزية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="slug">الرمز (Slug)</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="baghdad"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name-ar">الاسم بالعربية</Label>
            <Input
              id="name-ar"
              value={
                formData.translations.find((t) => t.locale === 'ar')?.name || ''
              }
              onChange={(e) => updateTranslation('ar', e.target.value)}
              placeholder="بغداد"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name-en">الاسم بالإنجليزية</Label>
            <Input
              id="name-en"
              value={
                formData.translations.find((t) => t.locale === 'en')?.name || ''
              }
              onChange={(e) => updateTranslation('en', e.target.value)}
              placeholder="Baghdad"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">خط العرض (Latitude)</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) =>
                  setFormData({ ...formData, lat: e.target.value })
                }
                placeholder="33.3152"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lng">خط الطول (Longitude)</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) =>
                  setFormData({ ...formData, lng: e.target.value })
                }
                placeholder="44.3661"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive">نشط</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
