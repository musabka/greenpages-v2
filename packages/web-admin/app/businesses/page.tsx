'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Search, MapPin, Phone, Star, Eye } from 'lucide-react';
import { BusinessDialog } from '@/components/businesses/business-dialog';

interface Business {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  isActive: boolean;
  categoryName: string;
  districtName: string;
  cityName: string;
  governorateName: string;
  primaryImage?: string;
}

interface PaginatedResult {
  data: Business[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function BusinessesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [governorateFilter, setGovernorateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Filter options
  const [categories, setCategories] = useState<any[]>([]);
  const [governorates, setGovernorates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadFilterOptions();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadBusinesses();
    }
  }, [user, page, searchQuery, categoryFilter, governorateFilter, cityFilter, districtFilter]);

  useEffect(() => {
    // Load cities when governorate changes
    if (governorateFilter) {
      loadCities(governorateFilter);
    } else {
      setCities([]);
      setCityFilter('');
    }
  }, [governorateFilter]);

  useEffect(() => {
    // Load districts when city changes
    if (cityFilter) {
      loadDistricts(cityFilter);
    } else {
      setDistricts([]);
      setDistrictFilter('');
    }
  }, [cityFilter]);

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

  const loadCities = async (governorateId: string) => {
    try {
      const data = await apiClient.get<any[]>(`/cities?governorateId=${governorateId}&locale=ar`);
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const loadDistricts = async (cityId: string) => {
    try {
      const data = await apiClient.get<any[]>(`/districts?cityId=${cityId}&locale=ar`);
      setDistricts(data);
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        locale: 'ar',
      });
      
      if (searchQuery) params.append('query', searchQuery);
      if (categoryFilter) params.append('categoryId', categoryFilter);
      if (governorateFilter) params.append('governorateId', governorateFilter);
      if (cityFilter) params.append('cityId', cityFilter);
      if (districtFilter) params.append('districtId', districtFilter);

      const data = await apiClient.get<PaginatedResult>(`/businesses/search?${params.toString()}`);
      setBusinesses(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBusinessId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingBusinessId(id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف النشاط التجاري "${name}"؟`)) return;

    try {
      await apiClient.delete(`/businesses/${id}`);
      await loadBusinesses();
    } catch (error: any) {
      console.error('Failed to delete business:', error);
      const errorMessage = error.response?.data?.message || 'فشل حذف النشاط التجاري';
      alert(errorMessage);
    }
  };

  const handleSave = async () => {
    setDialogOpen(false);
    setEditingBusinessId(null);
    await loadBusinesses();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setGovernorateFilter('');
    setCityFilter('');
    setDistrictFilter('');
    setPage(1);
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
            <h1 className="text-3xl font-bold">الأنشطة التجارية</h1>
            <p className="text-muted-foreground">إدارة الأنشطة التجارية المسجلة في الدليل</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة نشاط تجاري
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>البحث والتصفية</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">البحث</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اسم النشاط، الهاتف، العنوان..."
                      className="pr-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">التصنيف</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">جميع التصنيفات</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">المحافظة</label>
                  <select
                    value={governorateFilter}
                    onChange={(e) => setGovernorateFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">جميع المحافظات</option>
                    {governorates.map((gov) => (
                      <option key={gov.id} value={gov.id}>
                        {gov.name}
                      </option>
                    ))}
                  </select>
                </div>

                {governorateFilter && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">المدينة</label>
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">جميع المدن</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {cityFilter && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">الحي</label>
                    <select
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">جميع الأحياء</option>
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Search className="ml-2 h-4 w-4" />
                  بحث
                </Button>
                <Button type="button" variant="outline" onClick={handleResetFilters}>
                  إعادة تعيين
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              النتائج ({total})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                لا توجد أنشطة تجارية
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {businesses.map((business) => (
                    <div
                      key={business.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{business.name}</h3>
                          {business.isVerified && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              موثق
                            </span>
                          )}
                          {business.isFeatured && (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                              مميز
                            </span>
                          )}
                          {!business.isActive && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                              غير نشط
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {business.governorateName} - {business.cityName} - {business.districtName}
                            </span>
                          </div>
                          
                          {business.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{business.phone}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{business.avgRating.toFixed(1)} ({business.reviewCount})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>{business.viewCount}</span>
                            </div>
                          </div>
                          
                          <div className="text-xs">
                            <span className="font-medium">التصنيف:</span> {business.categoryName}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(business.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(business.id, business.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t p-4">
                    <div className="text-sm text-muted-foreground">
                      صفحة {page} من {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        السابق
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        التالي
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <BusinessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        businessId={editingBusinessId}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
