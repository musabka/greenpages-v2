'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

interface BusinessFormLocationProps {
  business: any;
  businessId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export function BusinessFormLocation({
  business,
  businessId,
  onSave,
  onCancel,
}: BusinessFormLocationProps) {
  const [loading, setLoading] = useState(false);
  
  // Location data
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  
  // Form state
  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  useEffect(() => {
    loadGovernorates();
    
    if (business) {
      setDistrictId(business.districtId || '');
      setLat(business.lat?.toString() || '');
      setLng(business.lng?.toString() || '');
      
      // Load hierarchy
      if (business.district) {
        setCityId(business.district.cityId);
        if (business.city) {
          setGovernorateId(business.city.governorateId);
        }
      }
    }
  }, [business]);

  useEffect(() => {
    if (governorateId) {
      loadCities(governorateId);
    } else {
      setCities([]);
      setCityId('');
    }
  }, [governorateId]);

  useEffect(() => {
    if (cityId) {
      loadDistricts(cityId);
    } else {
      setDistricts([]);
      setDistrictId('');
    }
  }, [cityId]);

  const loadGovernorates = async () => {
    try {
      const data = await apiClient.get<any[]>('/governorates?locale=ar');
      setGovernorates(data);
    } catch (error) {
      console.error('Failed to load governorates:', error);
    }
  };

  const loadCities = async (govId: string) => {
    try {
      const data = await apiClient.get<any[]>(`/cities?governorateId=${govId}&locale=ar`);
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const loadDistricts = async (cId: string) => {
    try {
      const data = await apiClient.get<any[]>(`/districts?cityId=${cId}&locale=ar`);
      setDistricts(data);
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!districtId) {
      alert('الرجاء اختيار الحي');
      return;
    }
    
    if (!lat || !lng) {
      alert('الرجاء إدخال الإحداثيات');
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      alert('الإحداثيات غير صحيحة');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        districtId,
        lat: latitude,
        lng: longitude,
      };

      if (businessId) {
        await apiClient.put(`/businesses/${businessId}`, payload);
      } else {
        alert('يجب حفظ المعلومات الأساسية أولاً');
        return;
      }

      onSave();
    } catch (error: any) {
      console.error('Failed to save location:', error);
      const errorMessage = error.response?.data?.message || 'فشل حفظ الموقع';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="governorateId">المحافظة *</Label>
          <select
            id="governorateId"
            value={governorateId}
            onChange={(e) => setGovernorateId(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">اختر المحافظة</option>
            {governorates.map((gov) => (
              <option key={gov.id} value={gov.id}>
                {gov.name}
              </option>
            ))}
          </select>
        </div>

        {governorateId && (
          <div>
            <Label htmlFor="cityId">المدينة *</Label>
            <select
              id="cityId"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">اختر المدينة</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {cityId && (
          <div>
            <Label htmlFor="districtId">الحي *</Label>
            <select
              id="districtId"
              value={districtId}
              onChange={(e) => setDistrictId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">اختر الحي</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lat">خط العرض (Latitude) *</Label>
            <Input
              id="lat"
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="33.3152"
              required
              dir="ltr"
            />
          </div>

          <div>
            <Label htmlFor="lng">خط الطول (Longitude) *</Label>
            <Input
              id="lng"
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="44.3661"
              required
              dir="ltr"
            />
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 يمكنك الحصول على الإحداثيات من خرائط جوجل بالنقر بزر الماوس الأيمن على الموقع واختيار "الإحداثيات"
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </div>
    </form>
  );
}
