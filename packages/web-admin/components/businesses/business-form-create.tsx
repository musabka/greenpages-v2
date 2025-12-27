'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

interface BusinessFormCreateProps {
  onSave: () => void;
  onCancel: () => void;
}

export function BusinessFormCreate({
  onSave,
  onCancel,
}: BusinessFormCreateProps) {
  const [loading, setLoading] = useState(false);
  
  // Filter options
  const [categories, setCategories] = useState<any[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  
  // Basic info
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Location
  const [governorateId, setGovernorateId] = useState('');
  const [cityId, setCityId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  
  // Translations
  const [nameAr, setNameAr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [addressAr, setAddressAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [addressEn, setAddressEn] = useState('');

  useEffect(() => {
    loadFilterOptions();
  }, []);

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

  const loadFilterOptions = async () => {
    try {
      const [categoriesData, governoratesData] = await Promise.all([
        apiClient.get<any[]>('/categories/tree?locale=ar'),
        apiClient.get<any[]>('/governorates?locale=ar'),
      ]);
      setCategories(flattenCategories(categoriesData));
      setGovernorates(governoratesData);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const flattenCategories = (tree: any[], result: any[] = []): any[] => {
    for (const node of tree) {
      result.push({ id: node.id, name: node.name });
      if (node.children && node.children.length > 0) {
        flattenCategories(node.children, result);
      }
    }
    return result;
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
    
    // Validation
    if (!slug.trim()) {
      alert('الرجاء إدخال الرمز (slug)');
      return;
    }
    
    if (!categoryId) {
      alert('الرجاء اختيار التصنيف');
      return;
    }
    
    if (!districtId) {
      alert('الرجاء اختيار الحي');
      return;
    }
    
    if (!lat || !lng) {
      alert('الرجاء إدخال الإحداثيات');
      return;
    }
    
    if (!nameAr.trim()) {
      alert('الرجاء إدخال الاسم بالعربية');
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
      const translations = [
        {
          locale: 'ar',
          name: nameAr.trim(),
          description: descriptionAr.trim() || undefined,
          address: addressAr.trim() || undefined,
        },
      ];
      
      if (nameEn.trim()) {
        translations.push({
          locale: 'en',
          name: nameEn.trim(),
          description: descriptionEn.trim() || undefined,
          address: addressEn.trim() || undefined,
        });
      }

      const payload = {
        slug: slug.trim(),
        categoryId,
        districtId,
        lat: latitude,
        lng: longitude,
        phone: phone.trim() || undefined,
        phone2: phone2.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        isFeatured,
        isVerified,
        isActive,
        translations,
      };

      await apiClient.post('/businesses', payload);
      onSave();
    } catch (error: any) {
      console.error('Failed to create business:', error);
      const errorMessage = error.response?.data?.message || 'فشل إنشاء النشاط التجاري';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">المعلومات الأساسية</h3>
        
        <div className="grid gap-4">
          <div>
            <Label htmlFor="slug">الرمز (Slug) *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-business-name"
              required
              dir="ltr"
            />
          </div>

          <div>
            <Label htmlFor="categoryId">التصنيف *</Label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">اختر التصنيف</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+964 770 123 4567"
                dir="ltr"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp">واتساب</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+964 770 123 4567"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">الموقع</h3>
        
        <div className="grid gap-4">
          <div>
            <Label htmlFor="governorateId">المحافظة *</Label>
            <select
              id="governorateId"
              value={governorateId}
              onChange={(e) => setGovernorateId(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">اختر المحافظة</option>
              {governorates.map((gov) => (
                <option key={gov.id} value={gov.id}>{gov.name}</option>
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">اختر المدينة</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">اختر الحي</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lat">خط العرض *</Label>
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
              <Label htmlFor="lng">خط الطول *</Label>
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
        </div>
      </div>

      {/* Translations Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium border-b pb-2">الترجمة العربية *</h3>
        
        <div className="grid gap-4">
          <div>
            <Label htmlFor="nameAr">الاسم *</Label>
            <Input
              id="nameAr"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="اسم النشاط التجاري"
              required
              dir="rtl"
            />
          </div>
          <div>
            <Label htmlFor="addressAr">العنوان</Label>
            <Input
              id="addressAr"
              value={addressAr}
              onChange={(e) => setAddressAr(e.target.value)}
              placeholder="العنوان التفصيلي"
              dir="rtl"
            />
          </div>
        </div>
      </div>

      {/* Flags */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isActive" className="cursor-pointer">نشط</Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          إلغاء
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </div>
    </form>
  );
}
