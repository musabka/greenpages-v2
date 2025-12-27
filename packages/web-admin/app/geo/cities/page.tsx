'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { AdminDataTable, Column } from '@/components/data-table/admin-data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { CityDialog } from '@/components/geo/city-dialog';

interface City {
  id: string;
  slug: string;
  name: string;
  governorateId: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  translations: { locale: string; name: string }[];
  governorate?: {
    id: string;
    slug: string;
    name: string;
  };
}

export default function CitiesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadCities();
  }, [router]);

  const loadCities = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<City[]>('/geo/cities?locale=ar');
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCity(null);
    setDialogOpen(true);
  };

  const handleEdit = (city: City) => {
    setEditingCity(city);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المدينة؟')) return;

    try {
      await apiClient.delete(`/geo/cities/${id}`);
      await loadCities();
    } catch (error) {
      console.error('Failed to delete city:', error);
      alert('فشل حذف المدينة');
    }
  };

  const handleSave = async () => {
    setDialogOpen(false);
    await loadCities();
  };

  const columns: Column<City>[] = [
    {
      key: 'name',
      title: 'الاسم',
      render: (item) => (
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-xs text-muted-foreground">{item.slug}</div>
        </div>
      ),
    },
    {
      key: 'governorate',
      title: 'المحافظة',
      render: (item) => (
        <span className="text-sm">{item.governorate?.name || '-'}</span>
      ),
    },
    {
      key: 'coordinates',
      title: 'الإحداثيات',
      render: (item) =>
        item.lat && item.lng ? (
          <span className="text-xs">
            {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'translations',
      title: 'الترجمات',
      render: (item) => (
        <div className="flex gap-1">
          {item.translations.map((t) => (
            <span
              key={t.locale}
              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
            >
              {t.locale}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'isActive',
      title: 'الحالة',
      render: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            item.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {item.isActive ? 'نشط' : 'غير نشط'}
        </span>
      ),
    },
  ];

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
            <h1 className="text-3xl font-bold">المدن</h1>
            <p className="text-muted-foreground">إدارة المدن في النظام</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة مدينة
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>قائمة المدن</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminDataTable
              data={cities}
              columns={columns}
              loading={loading}
              searchable
              searchPlaceholder="البحث في المدن..."
              actions={(item) => (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/geo/cities/${item.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
              emptyMessage="لا توجد مدن"
            />
          </CardContent>
        </Card>
      </div>

      <CityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        city={editingCity}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
