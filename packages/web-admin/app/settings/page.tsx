'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ToggleLeft, Layout, Languages } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

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

  const settingsCards = [
    {
      title: 'Feature Toggles',
      titleAr: 'مفاتيح التحكم',
      description: 'Enable or disable features without code changes',
      descriptionAr: 'تفعيل أو تعطيل الميزات بدون تغيير الكود',
      icon: ToggleLeft,
      href: '/settings/toggles',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'UI Blocks',
      titleAr: 'كتل الواجهة',
      description: 'Customize header, footer, and hero blocks',
      descriptionAr: 'تخصيص الرأس والتذييل وكتل البطل',
      icon: Layout,
      href: '/settings/blocks',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Translations',
      titleAr: 'الترجمات',
      description: 'Manage multi-language content',
      descriptionAr: 'إدارة المحتوى متعدد اللغات',
      icon: Languages,
      href: '/settings/translations',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <h2 className="text-2xl font-bold text-muted-foreground">الإعدادات</h2>
            <p className="text-muted-foreground mt-1">
              Manage system configuration and customization
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.href}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={() => router.push(card.href)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  <CardTitle className="text-lg text-muted-foreground">{card.titleAr}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.descriptionAr}</p>
                  <Button variant="outline" className="w-full mt-4">
                    Manage / إدارة
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
