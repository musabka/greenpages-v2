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

interface Category {
  id: string;
  slug: string;
  parentId: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  name: string;
  description: string | null;
  translations: { locale: string; name: string; description: string | null }[];
  parent?: {
    id: string;
    slug: string;
    name: string;
  };
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSave: () => void;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  level: number;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSave,
}: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  
  // Form state
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [icon, setIcon] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  
  // Translation state
  const [nameAr, setNameAr] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');

  useEffect(() => {
    if (open) {
      loadCategories();
      
      if (category) {
        // Edit mode
        setSlug(category.slug);
        setParentId(category.parentId || '');
        setIcon(category.icon || '');
        setSortOrder(category.sortOrder.toString());
        setIsActive(category.isActive);
        
        const arTranslation = category.translations.find(t => t.locale === 'ar');
        const enTranslation = category.translations.find(t => t.locale === 'en');
        
        setNameAr(arTranslation?.name || '');
        setDescriptionAr(arTranslation?.description || '');
        setNameEn(enTranslation?.name || '');
        setDescriptionEn(enTranslation?.description || '');
      } else {
        // Create mode - reset form
        setSlug('');
        setParentId('');
        setIcon('');
        setSortOrder('0');
        setIsActive(true);
        setNameAr('');
        setDescriptionAr('');
        setNameEn('');
        setDescriptionEn('');
      }
    }
  }, [open, category]);

  const loadCategories = async () => {
    try {
      const tree = await apiClient.get<any[]>('/categories/tree?locale=ar');
      const flatList = flattenTree(tree);
      setCategories(flatList);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const flattenTree = (
    nodes: any[],
    level: number = 0,
    result: CategoryOption[] = []
  ): CategoryOption[] => {
    for (const node of nodes) {
      // Skip current category when editing (can't be its own parent)
      if (category && node.id === category.id) {
        continue;
      }
      
      result.push({
        id: node.id,
        name: node.name,
        slug: node.slug,
        level,
      });
      
      if (node.children && node.children.length > 0) {
        flattenTree(node.children, level + 1, result);
      }
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nameAr.trim()) {
      alert('الرجاء إدخال الاسم بالعربية');
      return;
    }
    
    if (!slug.trim()) {
      alert('الرجاء إدخال الرمز (slug)');
      return;
    }

    setLoading(true);

    try {
      const translations = [
        {
          locale: 'ar',
          name: nameAr.trim(),
          description: descriptionAr.trim() || undefined,
        },
      ];
      
      if (nameEn.trim()) {
        translations.push({
          locale: 'en',
          name: nameEn.trim(),
          description: descriptionEn.trim() || undefined,
        });
      }

      const payload = {
        slug: slug.trim(),
        parentId: parentId || undefined,
        icon: icon.trim() || undefined,
        sortOrder: parseInt(sortOrder) || 0,
        isActive,
        translations,
      };

      if (category) {
        // Update
        await apiClient.put(`/categories/${category.id}`, payload);
      } else {
        // Create
        await apiClient.post('/categories', payload);
      }

      onSave();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      const errorMessage = error.response?.data?.message || 'فشل حفظ التصنيف';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">المعلومات الأساسية</h3>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="slug">الرمز (Slug) *</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="electronics"
                  required
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  يستخدم في الروابط (حروف إنجليزية صغيرة وشرطات فقط)
                </p>
              </div>

              <div>
                <Label htmlFor="parentId">التصنيف الأب</Label>
                <select
                  id="parentId"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">لا يوجد (تصنيف رئيسي)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {'—'.repeat(cat.level)} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">الأيقونة (Emoji)</Label>
                  <Input
                    id="icon"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="🏪"
                    maxLength={10}
                  />
                </div>

                <div>
                  <Label htmlFor="sortOrder">ترتيب العرض</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    min="0"
                  />
                </div>
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

          {/* Arabic Translation */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">الترجمة العربية *</h3>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="nameAr">الاسم بالعربية *</Label>
                <Input
                  id="nameAr"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="إلكترونيات"
                  required
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="descriptionAr">الوصف بالعربية</Label>
                <textarea
                  id="descriptionAr"
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="وصف التصنيف..."
                  rows={3}
                  dir="rtl"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* English Translation */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">الترجمة الإنجليزية</h3>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="nameEn">الاسم بالإنجليزية</Label>
                <Input
                  id="nameEn"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Electronics"
                  dir="ltr"
                />
              </div>

              <div>
                <Label htmlFor="descriptionEn">الوصف بالإنجليزية</Label>
                <textarea
                  id="descriptionEn"
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Category description..."
                  rows={3}
                  dir="ltr"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
