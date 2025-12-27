'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentUser } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { Bell, Send, Users, CheckCircle, AlertCircle } from 'lucide-react';

enum NotificationType {
  SUBSCRIPTION_EXPIRY = 'SUBSCRIPTION_EXPIRY',
  REVIEW_REPLY = 'REVIEW_REPLY',
  REPORT_RESOLVED = 'REPORT_RESOLVED',
  POINTS_EARNED = 'POINTS_EARNED',
  SYSTEM = 'SYSTEM',
}

enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  USER = 'USER',
}

interface BroadcastFormData {
  type: NotificationType;
  title: string;
  body: string;
  targetRoles: UserRole[];
  targetUserIds: string[];
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState<BroadcastFormData>({
    type: NotificationType.SYSTEM,
    title: '',
    body: '',
    targetRoles: [],
    targetUserIds: [],
  });

  const [userIdsInput, setUserIdsInput] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    setLoading(false);
  }, [router]);

  const handleRoleToggle = (role: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setShowSuccess(false);

    // Validation
    if (!formData.title.trim()) {
      setErrorMessage('يرجى إدخال عنوان الإشعار');
      return;
    }

    if (!formData.body.trim()) {
      setErrorMessage('يرجى إدخال نص الإشعار');
      return;
    }

    if (formData.targetRoles.length === 0 && formData.targetUserIds.length === 0) {
      setErrorMessage('يرجى اختيار مجموعة مستخدمين أو إدخال معرفات مستخدمين محددة');
      return;
    }

    try {
      setSending(true);

      const response = await apiClient.post<{ count: number; message: string }>(
        '/notifications/broadcast',
        {
          type: formData.type,
          title: formData.title,
          body: formData.body,
          targetRoles: formData.targetRoles.length > 0 ? formData.targetRoles : undefined,
          targetUserIds: formData.targetUserIds.length > 0 ? formData.targetUserIds : undefined,
        }
      );

      setSuccessMessage(`تم إرسال الإشعار بنجاح إلى ${response.count} مستخدم`);
      setShowSuccess(true);

      // Reset form
      setFormData({
        type: NotificationType.SYSTEM,
        title: '',
        body: '',
        targetRoles: [],
        targetUserIds: [],
      });
      setUserIdsInput('');

      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      setErrorMessage(
        error.message || 'فشل في إرسال الإشعار. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleUserIdsChange = (value: string) => {
    setUserIdsInput(value);
    // Parse comma-separated user IDs
    const ids = value
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    setFormData((prev) => ({ ...prev, targetUserIds: ids }));
  };

  if (loading || !user) {
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
        <div>
          <h1 className="text-3xl font-bold">إرسال الإشعارات</h1>
          <p className="text-muted-foreground">
            إرسال إشعارات إلى مجموعات المستخدمين
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-900">{errorMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Broadcast Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              إنشاء إشعار جديد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Notification Type */}
              <div className="space-y-2">
                <Label htmlFor="type">نوع الإشعار</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as NotificationType,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value={NotificationType.SYSTEM}>نظام</option>
                  <option value={NotificationType.SUBSCRIPTION_EXPIRY}>
                    انتهاء الاشتراك
                  </option>
                  <option value={NotificationType.REVIEW_REPLY}>رد على تقييم</option>
                  <option value={NotificationType.REPORT_RESOLVED}>حل بلاغ</option>
                  <option value={NotificationType.POINTS_EARNED}>نقاط مكتسبة</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الإشعار *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="مثال: تحديث مهم في النظام"
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/100 حرف
                </p>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="body">نص الإشعار *</Label>
                <textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, body: e.target.value }))
                  }
                  placeholder="مثال: تم إضافة ميزات جديدة للنظام. يرجى تحديث التطبيق للاستفادة من التحسينات."
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  maxLength={500}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.body.length}/500 حرف
                </p>
              </div>

              {/* Target Roles */}
              <div className="space-y-3">
                <Label>المجموعات المستهدفة</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.includes(UserRole.USER)}
                      onChange={() => handleRoleToggle(UserRole.USER)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">المستخدمون العاديون</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.includes(UserRole.AGENT)}
                      onChange={() => handleRoleToggle(UserRole.AGENT)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">المندوبون</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targetRoles.includes(UserRole.ADMIN)}
                      onChange={() => handleRoleToggle(UserRole.ADMIN)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">المديرون</span>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  اختر مجموعة أو أكثر لإرسال الإشعار إليها
                </p>
              </div>

              {/* Specific User IDs (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="userIds">
                  معرفات مستخدمين محددة (اختياري)
                </Label>
                <Input
                  id="userIds"
                  value={userIdsInput}
                  onChange={(e) => handleUserIdsChange(e.target.value)}
                  placeholder="مثال: user-id-1, user-id-2, user-id-3"
                />
                <p className="text-xs text-muted-foreground">
                  أدخل معرفات المستخدمين مفصولة بفواصل لإرسال الإشعار لمستخدمين محددين
                </p>
                {formData.targetUserIds.length > 0 && (
                  <p className="text-xs text-blue-600">
                    سيتم الإرسال إلى {formData.targetUserIds.length} مستخدم محدد
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={sending}
                  className="flex-1"
                >
                  <Send className="ml-2 h-4 w-4" />
                  {sending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      type: NotificationType.SYSTEM,
                      title: '',
                      body: '',
                      targetRoles: [],
                      targetUserIds: [],
                    });
                    setUserIdsInput('');
                    setErrorMessage('');
                  }}
                  disabled={sending}
                >
                  إعادة تعيين
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-900">
                <p className="font-medium">ملاحظات مهمة:</p>
                <ul className="list-disc list-inside space-y-1 mr-4">
                  <li>سيتم إرسال الإشعار فوراً إلى جميع المستخدمين المستهدفين</li>
                  <li>يمكن اختيار مجموعات مستخدمين أو إدخال معرفات محددة أو كليهما</li>
                  <li>الإشعارات المرسلة لا يمكن التراجع عنها</li>
                  <li>تأكد من صحة المحتوى قبل الإرسال</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
