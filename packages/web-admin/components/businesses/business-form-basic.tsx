'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

interface BusinessFormBasicProps {
  business: any;
  businessId: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export function BusinessFormBasic({
  business,
  businessId,
  onSave,
  onCancel,
}: BusinessFormBasicProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Form state
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
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  useEffect(() => {
    loadCategories();
    
    if (business) {
      setSlug(business.slug || '');
      setCategoryId(business.categoryId || '');
      setPhone(business.phone || '');
      setPhone2(business.phone2 || '');
      setWhatsapp(business.whatsapp || '');
      setEmail(business.email || '');
      setWebsite(business.website || '');
      setIsFeatured(business.isFeatured || false);
      setIsVerified(business.isVerified || false);
      setIsActive(business.isActive !== undefined ? business.isActive : true);
      setMetaTitle(business.metaTitle || '');
      setMetaDescription(business.metaDescription || '');
    }
  }, [business]);

  const loadCategories = async () => {
    try {
      const tree = await apiClient.get<any[]>('/categories/tree?locale=ar');
      setCategories(flattenCategories(tree));
    } catch (error) {
      console.error('Failed to load categories:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!slug.trim()) {
      alert('الرجاء إدخال الرمز (slug)');
      return;
    }
    
    if (!categoryId) {
      alert('الرجاء اختيار التصنيف');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        slug: slug.trim(),
        categoryId,
        phone: phone.trim() || undefined,
        phone2: phone2.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        isFeatured,
        isVerified,
        isActive,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
      };

      if (businessId) {
        await apiClient.put(`/businesses/${businessId}`, payload);
      } else {
        // For create, we need location data too
        alert('يجب إضافة بيانات الموقع أولاً. انتقل إلى تبويب "الموقع"');
        return;
      }

      onSave();
    } catch (error: any) {
      console.error('Failed to save business:', error);
      const errorMessage = error.response?.data?.message || 'فشل حفظ النشاط التجاري';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <p className="text-xs text-muted-foreground mt-1">
            يستخدم في الروابط (حروف إنجليزية صغيرة وشرطات فقط)
          </p>
        </div>

        <div>
          <Label htmlFor="categoryId">التصنيف *</Label>
          <select
            id="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">اختر التصنيف</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
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
            <Label htmlFor="phone2">رقم هاتف إضافي</Label>
            <Input
              id="phone2"
              value={phone2}
              onChange={(e) => setPhone2(e.target.value)}
              placeholder="+964 770 123 4567"
              dir="ltr"
            />
          </div>
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@example.com"
              dir="ltr"
            />
          </div>

          <div>
            <Label htmlFor="website">الموقع الإلكتروني</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="metaTitle">عنوان SEO</Label>
          <Input
            id="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="عنوان الصفحة في محركات البحث"
            maxLength={200}
          />
        </div>

        <div>
          <Label htmlFor="metaDescription">وصف SEO</Label>
          <textarea
            id="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="وصف الصفحة في محركات البحث"
            rows={3}
            maxLength={500}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isFeatured" className="cursor-pointer">
              مميز
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isVerified"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isVerified" className="cursor-pointer">
              موثق
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              نشط
            </Label>
          </div>
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
