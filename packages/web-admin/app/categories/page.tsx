'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { CategoryDialog } from '@/components/categories/category-dialog';

interface CategoryTree {
  id: string;
  slug: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  name: string;
  description: string | null;
  children: CategoryTree[];
}

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

export default function CategoriesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [categoryTree, setCategoryTree] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadCategories();
  }, [router]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<CategoryTree[]>('/categories/tree?locale=ar');
      setCategoryTree(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (parentId?: string) => {
    setEditingCategory(parentId ? { parentId } as any : null);
    setDialogOpen(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const category = await apiClient.get<Category>(`/categories/${id}?locale=ar`);
      setEditingCategory(category);
      setDialogOpen(true);
    } catch (error) {
      console.error('Failed to load category:', error);
      alert('فشل تحميل بيانات التصنيف');
    }
  };

  const handleDelete = async (id: string, hasChildren: boolean) => {
    const message = hasChildren
      ? 'هذا التصنيف يحتوي على تصنيفات فرعية. هل تريد حذفه مع جميع التصنيفات الفرعية؟'
      : 'هل أنت متأكد من حذف هذا التصنيف؟';

    if (!confirm(message)) return;

    try {
      const cascade = hasChildren;
      await apiClient.delete(`/categories/${id}?cascade=${cascade}`);
      await loadCategories();
    } catch (error: any) {
      console.error('Failed to delete category:', error);
      const errorMessage = error.response?.data?.message || 'فشل حذف التصنيف';
      alert(errorMessage);
    }
  };

  const handleSave = async () => {
    setDialogOpen(false);
    await loadCategories();
  };

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const renderCategoryNode = (category: CategoryTree, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category.id);

    return (
      <div key={category.id} className="border-b last:border-b-0">
        <div
          className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          style={{ paddingRight: `${level * 2 + 0.75}rem` }}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(category.id)}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}
            
            {category.icon && (
              <span className="text-lg">{category.icon}</span>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{category.name}</span>
                {!category.isActive && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    غير نشط
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{category.slug}</div>
              {category.description && (
                <div className="text-xs text-muted-foreground mt-1">{category.description}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreate(category.id)}
              title="إضافة تصنيف فرعي"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(category.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(category.id, hasChildren)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {category.children.map((child) => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">التصنيفات</h1>
            <p className="text-muted-foreground">إدارة تصنيفات الأنشطة التجارية</p>
          </div>
          <Button onClick={() => handleCreate()}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة تصنيف رئيسي
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>شجرة التصنيفات</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : categoryTree.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                لا توجد تصنيفات
              </div>
            ) : (
              <div>
                {categoryTree.map((category) => renderCategoryNode(category))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
