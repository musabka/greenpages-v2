'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Star, CheckCircle2 } from 'lucide-react';
import { PlanDialog } from '@/components/plans/plan-dialog';

interface PlanListItem {
  id: string;
  slug: string;
  price: number;
  durationDays: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  name: string;
  description: string | null;
  featureCount: number;
}

interface Plan {
  id: string;
  slug: string;
  price: number;
  durationDays: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  name: string;
  description: string | null;
  translations: { locale: string; name: string; description: string | null }[];
  features: { featureKey: string; featureValue: string }[];
}

export default function PlansPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadPlans();
  }, [router]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<PlanListItem[]>('/plans?locale=ar');
      setPlans(data);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const plan = await apiClient.get<Plan>(`/plans/${id}?locale=ar`);
      setEditingPlan(plan);
      setDialogOpen(true);
    } catch (error) {
      console.error('Failed to load plan:', error);
      alert('فشل تحميل بيانات الباقة');
    }
  };

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      alert('لا يمكن حذف الباقة الافتراضية. قم بتعيين باقة أخرى كافتراضية أولاً.');
      return;
    }

    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;

    try {
      await apiClient.delete(`/plans/${id}`);
      await loadPlans();
    } catch (error: any) {
      console.error('Failed to delete plan:', error);
      const errorMessage = error.response?.data?.message || 'فشل حذف الباقة';
      alert(errorMessage);
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!confirm('هل تريد تعيين هذه الباقة كافتراضية؟')) return;

    try {
      await apiClient.put(`/plans/${id}/set-default`, {});
      await loadPlans();
    } catch (error: any) {
      console.error('Failed to set default plan:', error);
      const errorMessage = error.response?.data?.message || 'فشل تعيين الباقة الافتراضية';
      alert(errorMessage);
    }
  };

  const handleSave = async () => {
    setDialogOpen(false);
    await loadPlans();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };

  const formatDuration = (days: number) => {
    if (days === 30) return 'شهر';
    if (days === 90) return '3 أشهر';
    if (days === 180) return '6 أشهر';
    if (days === 365) return 'سنة';
    return `${days} يوم`;
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
            <h1 className="text-3xl font-bold">باقات الاشتراك</h1>
            <p className="text-muted-foreground">إدارة باقات الاشتراك والمميزات</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة باقة جديدة
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="col-span-full text-center p-8 text-muted-foreground">
              لا توجد باقات
            </div>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className={plan.isDefault ? 'border-primary border-2' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {plan.isDefault && (
                          <Star className="h-4 w-4 fill-primary text-primary" />
                        )}
                      </CardTitle>
                      {plan.isDefault && (
                        <p className="text-xs text-primary mt-1">الباقة الافتراضية</p>
                      )}
                    </div>
                    {!plan.isActive && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        غير نشط
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-3xl font-bold">{formatPrice(plan.price)}</div>
                    <div className="text-sm text-muted-foreground">{formatDuration(plan.durationDays)}</div>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{plan.featureCount} ميزة</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <div>الرمز: {plan.slug}</div>
                    <div>الترتيب: {plan.sortOrder}</div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(plan.id)}
                      className="flex-1"
                    >
                      <Edit className="ml-2 h-4 w-4" />
                      تعديل
                    </Button>
                    {!plan.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(plan.id)}
                        title="تعيين كافتراضية"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(plan.id, plan.isDefault)}
                      disabled={plan.isDefault}
                      title={plan.isDefault ? 'لا يمكن حذف الباقة الافتراضية' : 'حذف'}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <PlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={editingPlan}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
