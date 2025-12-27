# Green Pages Admin Dashboard

لوحة التحكم الإدارية لنظام الصفحات الخضراء - مبنية باستخدام Next.js 16 و Tailwind CSS 4.

## المميزات

### Foundation Layer (الطبقة الأساسية)
- ✅ **نظام المصادقة الكامل**: JWT + Refresh Token + Role-based Access Control
- ✅ **API Client موحد**: Fetch wrapper مع معالجة الأخطاء التلقائية
- ✅ **نظام الصلاحيات**: RBAC على مستوى واجهة المستخدم
- ✅ **نظام التخطيط**: Sidebar + Header + Guards

### المكونات القابلة لإعادة الاستخدام
- ✅ **AdminDataTable**: جدول بيانات شامل مع:
  - Pagination (ترقيم الصفحات)
  - Sorting (الترتيب)
  - Filtering (التصفية)
  - Bulk Actions (الإجراءات الجماعية)
  - Permissions (الصلاحيات)

### البنية المعمارية
```
packages/web-admin/
├── app/                    # Next.js App Router
│   ├── dashboard/         # لوحة التحكم الرئيسية
│   ├── login/            # صفحة تسجيل الدخول
│   └── layout.tsx        # التخطيط الرئيسي
├── components/
│   ├── layout/           # مكونات التخطيط (Sidebar, Header)
│   ├── data-table/       # جدول البيانات القابل لإعادة الاستخدام
│   └── ui/               # مكونات UI الأساسية
├── lib/
│   ├── api-client.ts     # عميل API موحد
│   ├── auth.ts           # أدوات المصادقة
│   ├── permissions.ts    # نظام الصلاحيات
│   └── utils.ts          # أدوات مساعدة
└── middleware.ts         # حماية المسارات
```

## التقنيات المستخدمة

- **Next.js 16**: أحدث إصدار مع App Router
- **Tailwind CSS 4**: أحدث إصدار للتصميم
- **TypeScript**: للكتابة الآمنة
- **React Hook Form**: لإدارة النماذج
- **Zod**: للتحقق من البيانات
- **Lucide React**: للأيقونات

## التثبيت

```bash
# تثبيت الحزم
npm install

# تشغيل بيئة التطوير
npm run dev

# بناء للإنتاج
npm run build

# تشغيل الإنتاج
npm start
```

## المتغيرات البيئية

انسخ ملف `.env.example` إلى `.env.local` وقم بتعديل القيم:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Green Pages Admin
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## نظام الصلاحيات

النظام يدعم ثلاثة أدوار:
- **ADMIN**: صلاحيات كاملة
- **AGENT**: صلاحيات محدودة (الأنشطة والمالية)
- **USER**: بدون صلاحيات إدارية

## الصفحات المتاحة

- `/login` - تسجيل الدخول
- `/dashboard` - لوحة التحكم الرئيسية
- `/geography` - إدارة البيانات الجغرافية (قريباً)
- `/categories` - إدارة التصنيفات (قريباً)
- `/businesses` - إدارة الأنشطة التجارية (قريباً)
- `/plans` - إدارة الباقات (قريباً)
- `/ads` - إدارة الإعلانات (قريباً)
- `/finance` - إدارة المالية (قريباً)
- `/reviews` - إدارة المراجعات (قريباً)
- `/reports` - إدارة البلاغات (قريباً)
- `/notifications` - إدارة الإشعارات (قريباً)
- `/users` - إدارة المستخدمين (قريباً)
- `/settings` - الإعدادات (قريباً)

## المساهمة

هذا المشروع جزء من نظام Green Pages المتكامل.

## الترخيص

MIT
