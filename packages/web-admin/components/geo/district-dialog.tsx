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

interface District {
  id: string;
  slug: string;
  name: string;
  cityId: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  translations: Translation[];
}

interface City {
  id: string;
  name: string;
  slug: string;
  governorateId: string;
  governorate?: {
    id: string;
    name: string;
  };
}

interface Governorate {
  id: string;
  name: string;
  slug: string;
}

interface DistrictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  district: District | null;
  onSave: () => void;
}

export function DistrictDialog({
  open,
  onOpenChange,
  district,
  onSave,
}: DistrictDialogProps) {
  const [loading, setLoading] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [formData, setFormData] = useState({
    slug: '',
    cityId: '',
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
      loadCities();
    }
  }, [open]);

  useEffect(() => {
    if (district) {
      setFormData({
        slug: district.slug,
        cityId: district.cityId,
        governorateId: '',
        lat: district.lat?.toString() || '',
        lng: district.lng?.toString() || '',
        isActive: district.isActive,
        translations: district.translations.length > 0
          ? district.translations
          : [
              { locale: 'ar', name: '' },
              { locale: 'en', name: '' },
            ],
      });
    } else {
      setFormData({
        slug: '',
        cityId: '',
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
  }, [district, open]);

  useEffect(() => {
    if (formData.governorateId) {
      const filtered = cities.filter(
        (city) => city.governorateId === formData.governorateId
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(cities);
    }
  }, [formData.governorateId, cities]);

  const loadGovernorates = async () => {
    try {
      const data = await apiClient.get<Governorate[]>('/geo/governorates?locale=ar');
      setGovernorates(data);
    } catch (error) {
      console.error('Failed to load governorates:', error);
    }
  };

  const loadCities = async () => {
    try {
      const data = await apiClient.get<City[]>('/geo/cities?locale=ar');
      setCities(data);
      setFilteredCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        slug: formData.slug,
        cityId: formData.cityId,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lng: formData.lng ? parseFloat(formData.lng) : undefined,
        isActive: formData.isActive,
        translations: formData.translations.filter((t) => t.name.trim() !== ''),
      };

      if (district) {
        await apiClient.put(`/geo/districts/${district.id}`, payload);
      } else {
        await apiClient.post('/geo/districts', payload);
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save district:', error);
      alert('فشل حفظ الحي');
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
            {district ? 'تعديل حي' : 'إضافة حي جديد'}
          </DialogTitle>
          <DialogDescription>
            أدخل معلومات الحي بالعربية والإنجليزية
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="governorateId">المحافظة (للتصفية)</Label>
            <select
              id="governorateId"
              value={formData.governorateId}
              onChange={(e) =>
                setFormData({ ...formData, governorateId: e.target.value, cityId: '' })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">جميع المحافظات</option>
              {governorates.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {gov.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cityId">المدينة</Label>
            <select
              id="cityId"
              value={formData.cityId}
              onChange={(e) =>
                setFormData({ ...formData, cityId: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">اختر المدينة</option>
              {filteredCities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                  {city.governorate && ` (${city.governorate.name})`}
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
              placeholder="mansour"
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
              placeholder="المنصور"
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
              placeholder="Mansour"
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
