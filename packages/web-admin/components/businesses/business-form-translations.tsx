'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

interface BusinessFormTranslationsProps {
  business: any;
  businessId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export function BusinessFormTranslations({
  business,
  businessId,
  onSave,
  onCancel,
}: BusinessFormTranslationsProps) {
  const [loading, setLoading] = useState(false);
  
  // Arabic translation
  const [nameAr, setNameAr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [addressAr, setAddressAr] = useState('');
  
  // English translation
  const [nameEn, setNameEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [addressEn, setAddressEn] = useState('');

  useEffect(() => {
    if (business && business.translations) {
      const arTranslation = business.translations.find((t: any) => t.locale === 'ar');
      const enTranslation = business.translations.find((t: any) => t.locale === 'en');
      
      if (arTranslation) {
        setNameAr(arTranslation.name || '');
        setDescriptionAr(arTranslation.description || '');
        setAddressAr(arTranslation.address || '');
      }
      
      if (enTranslation) {
        setNameEn(enTranslation.name || '');
        setDescriptionEn(enTranslation.description || '');
        setAddressEn(enTranslation.address || '');
      }
    }
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nameAr.trim()) {
      alert('الرجاء إدخال الاسم بالعربية');
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

      const payload = { translations };

      if (businessId) {
        await apiClient.put(`/businesses/${businessId}`, payload);
      } else {
        alert('يجب حفظ المعلومات الأساسية أولاً');
        return;
      }

      onSave();
    } catch (error: any) {
      console.error('Failed to save translations:', error);
      const errorMessage = error.response?.data?.message || 'فشل حفظ الترجمات';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Arabic Translation */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">الترجمة العربية *</h3>
        
        <div>
          <Label htmlFor="nameAr">الاسم بالعربية *</Label>
          <Input
            id="nameAr"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="اسم النشاط التجاري"
            required
            dir="rtl"
            maxLength={200}
          />
        </div>

        <div>
          <Label htmlFor="descriptionAr">الوصف بالعربية</Label>
          <textarea
            id="descriptionAr"
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            placeholder="وصف النشاط التجاري..."
            rows={4}
            dir="rtl"
            maxLength={2000}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <Label htmlFor="addressAr">العنوان بالعربية</Label>
          <Input
            id="addressAr"
            value={addressAr}
            onChange={(e) => setAddressAr(e.target.value)}
            placeholder="العنوان التفصيلي"
            dir="rtl"
            maxLength={500}
          />
        </div>
      </div>

      {/* English Translation */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">الترجمة الإنجليزية</h3>
        
        <div>
          <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
          <Input
            id="nameEn"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="Business Name"
            dir="ltr"
            maxLength={200}
          />
        </div>

        <div>
          <Label htmlFor="descriptionEn">الوصف بالإنجليزية</Label>
          <textarea
            id="descriptionEn"
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            placeholder="Business description..."
            rows={4}
            dir="ltr"
            maxLength={2000}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <Label htmlFor="addressEn">العنوان بالإنجليزية</Label>
          <Input
            id="addressEn"
            value={addressEn}
            onChange={(e) => setAddressEn(e.target.value)}
            placeholder="Detailed address"
            dir="ltr"
            maxLength={500}
          />
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
