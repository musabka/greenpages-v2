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

interface City {
  id: string;
  slug: string;
  name: string;
  governorateId: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  translations: Translation[];
}

interface Governorate {
  id: string;
  name: string;
  slug: string;
}

interface CityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: City | null;
  onSave: () => void;
}

export function CityDialog({
  open,
  onOpenChange,
  city,
  onSave,
}: CityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [formData, setFormData] = useState({
    slug: '',
    governorateId: '',
    lat: '',
    lng: '',
    isActive: true,
    translations: [
      { locale: 'ar', name: '' },
      { locale: 'en', name: '' },
    ],
  });

  useEffect(() => {
    if (open) {
      loadGovernorates();
    }
  }, [open]);

  useEffect(() => {
    if (city) {
      setFormData({
        slug: city.slug,
        governorateId: city.governorateId,
        lat: city.lat?.toString() || '',
        lng: city.lng?.toString() || '',
        isActive: city.isActive,
        translations: city.translations.length > 0
          ? city.translations
          : [
              { locale: 'ar', name: '' },
              { locale: 'en', name: '' },
            ],
      });
    } else {
      setFormData({
        slug: '',
        governorateId: '',
        lat: '',
        lng: '',
        isActive: true,
        translations: [
          { locale: 'ar', name: '' },
          { locale: 'en', name: '' },
        ],
      });
    }
  }, [city, open]);

  const loadGovernorates = async () => {
    try {
      const data = await apiClient.get<Governorate[]>('/geo/governorates?locale=ar');
      setGovernorates(data);
    } catch (error) {
      console.error('Failed to load governorates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        slug: formData.slug,
        governorateId: formData.governorateId,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        isActive: formData.isActive,
        translations: formData.translations.filter((t) => t.name.trim() !== ''),
      };

      if (city) {
        await apiClient.put(`/geo/cities/${city.id}`, payload);
      } else {
        await apiClient.post('/geo/cities', payload);
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save city:', error);
      alert('فشل حفظ المدينة');
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
            {city ? 'تعديل مدينة' : 'إضافة مدينة جديدة'}
          </DialogTitle>
          <DialogDescription>
            أدخل معلومات المدينة بالعربية والإنجليزية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="governorateId">المحافظة</Label>
            <select
              id="governorateId"
              value={formData.governorateId}
              onChange={(e) =>
                setFormData({ ...formData, governorateId: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">اختر المحافظة</option>
              {governorates.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {gov.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">الرمز (Slug)</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="karkh"
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
              placeholder="الكرخ"
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
              placeholder="Karkh"
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
