# Green Pages (الصفحات الخضراء) — Project Specification & AI-Agent Rules
Version: 1.0 (Principles + Features)
Owner Vision: Green Core Ecosystem (النواة الخضراء)
Stack: Next.js + NestJS + PostgreSQL + PostGIS + Flutter + VPS (Coolify) + Leaflet

---

## 0) الهدف العام (Core Purpose)
**Green Pages** هو دليل رسمي موثوق للأنشطة التجارية والخدمية يعتمد على **بيانات صحيحة** (ميدانية/إدارية) ويحقق الدخل عبر:
- باقات اشتراك للأنشطة
- نظام إعلانات مدفوع (Placements)
- (لاحقًا) خدمات إضافية كموديولات (حجوزات/توصيل…).

المرحلة الحالية تركّز على:
1) بناء قاعدة بيانات قوية جغرافياً  
2) لوحة إدارة مرنة جدًا (Feature Toggles)  
3) تطبيق مندوب بسيط (بيع + تسجيل نشاط + تحصيل)  
4) إعلانات مدفوعة مرتبطة بالمكان والتصنيف  
5) منظومة مالية: **ذمم مالية للمندوب** + تقارير للشركة

---

## 1) مبادئ التصميم (Non-Negotiable Principles)
1. **Modular Monolith** (ليس Microservices الآن).
2. **Data Sovereignty**: البيانات ملك النظام، ولا اعتماد على خدمات طرف ثالث لجوهر البيانات.
3. **Geo-First**: كل نشاط وإعلان مرتبط بمكان (محافظة/مدينة/حي + إحداثيات).
4. **Admin-Controlled Features**: كل ميزة قابلة للتفعيل/التعطيل من لوحة الإدارة.
5. **Simplicity for Field Agent**: تطبيق المندوب لا يحتوي إلا ما يلزم (بيع/تسجيل/تحصيل).
6. **No “Owner not present” flow حاليا**: لا إضافة نشاط بدون تواصل مع المالك في هذه المرحلة.
7. **Free Map Stack**: Leaflet + (مزود Tiles مجاني/مفتوح) — لا Google Maps.

---

## 2) المنتجات (Apps) التي يجب بناؤها
### 2.1 `api` (NestJS)
- API موحّد لكل التطبيقات.
- Auth + RBAC.
- Directory + Ads + Finance (Debts/Ledger) + Settings (Feature Toggles).
- Geo services (PostGIS).

### 2.2 `web-admin` (Next.js)
- لوحة إدارة شاملة (واسعة جدًا) مع إعدادات خصائص/ميزات.
- إدارة: الأنشطة، التصنيفات، المواقع، الباقات، الإعلانات، المندوبين، الذمم المالية، التقارير، إعدادات البلوكات.

### 2.3 `web-directory` (Next.js)
- الواجهة العامة للدليل (Search, Category, Business Profile).
- خريطة Leaflet للبحث وعرض النتائج.

### 2.4 `mobile-agent` (Flutter)
- إضافة نشاط + اختيار باقة + تفعيل إعلان + تسجيل مبلغ مدفوع + عرض “ذمة المندوب” + سجل عمليات.
- Minimal UI / High speed.

### 2.5 (Optional later) `mobile-user` (Flutter)
- تطبيق المستخدم العام للدليل.

---

## 3) هيكل المستودع (Monorepo Recommended)
يوصى بـ Monorepo (pnpm/turborepo أو Nx) لتوحيد الأنماط ومشاركة types.

**Naming ثابت للحزم:**
- `api`
- `prisma`
- `web-admin`
- `web-directory`
- `mobile-agent`
- `shared` (types/utils/contracts)
- `infra` (docker/coolify/compose/scripts)

---

## 4) قواعد التسمية (Strict Naming Conventions — Mandatory)
هذه القواعد إلزامية لمنع مشكلة: `is-featered` vs `isFeatured` وغيرها.

### 4.1 قاعدة عامة
- **JavaScript/TypeScript/Prisma fields**: `camelCase`
- **Enums**: `PascalCase` أو `UPPER_SNAKE_CASE` (قرار واحد وتطبيق شامل)
- **DB tables & columns**: `snake_case`
- **API routes**: `kebab-case`
- **Config keys (Feature toggles)**: `snake_case` (مقترح) أو `kebab-case` — اختر واحدًا وثبّته

> قرار المشروع المقترح:
- Prisma models: `PascalCase`
- Prisma fields: `camelCase`
- DB mapping: `@@map("snake_case")` و `@map("snake_case")`
- API routes: `/admin/feature-toggles` (kebab-case)

### 4.2 ممنوع منعًا باتًا
- وجود اسمين لنفس المعنى داخل النظام.
- أخطاء إملائية تدخل كأسماء دائمة (مثل featered).
- Mixing بين `snake_case` و `camelCase` في نفس الطبقة.

### 4.3 أمثلة صحيحة
- DB column: `is_featured`
- Prisma field: `isFeatured @map("is_featured")`
- API DTO: `isFeatured: boolean`

---

## 5) نظام “البلوكات” (Blocks) — مقترح معتمد
الهدف: جعل الهيدر/الفوتر وبعض أجزاء الواجهة قابلة للتعديل بدون Page Builder كامل.

### 5.1 ما هو البلوك؟
كيان قابل للاستدعاء في الواجهة، مع إعدادات (JSON) محفوظة في DB، مثل:
- Header block
- Footer block
- Home hero block
- Ads placements blocks (يمكن لاحقًا)

### 5.2 خصائص البلوكات
- لكل Block: `type`, `schemaVersion`, `settingsJson`, `isEnabled`, `target` (web-directory/web-admin…)
- Render عبر مكوّنات محددة مسبقًا (ليس سحب-وإفلات الآن).

---

## 6) المزايا الأساسية (Feature Set — المرحلة الأولى)
### 6.1 Directory
- تصنيفات (Categories) + شجرة/مستويات (اختياري)
- نشاط تجاري (Business/Company)
- صور للنشاط
- ساعات العمل
- أرقام اتصال + WhatsApp
- موقع (lat/lng) + Address + Geo hierarchy

### 6.2 Search + Map
- بحث نصي (اسم/تصنيف/عنوان/هاتف)
- فلاتر جغرافية (مدينة/حي)
- عرض النتائج على خريطة Leaflet
- ترتيب (الأقرب/الأحدث/المميز)

### 6.3 Subscriptions (باقات)
- Plans: price, duration, limits
- ربط النشاط بباقة فعالة
- انتهاء/تجديد

### 6.4 Ads System (مدفوع)
- Placements محددة (لا أكثر من اللازم بالبداية):
  - Sponsored in search results
  - Home featured
  - Business profile highlight
  - (Optional) banner
- استهداف: محافظة/مدينة/حي + تصنيف
- مدة: أسبوع/شهر/3 أشهر
- **وسم واضح “إعلان/مُعلن”** في الواجهات
- تحكم كامل من لوحة الإدارة بتفعيل/تعطيل كل placement

### 6.5 Agent Operations (بساطة قصوى)
- إضافة نشاط جديد (مع المالك حاضر)
- اختيار باقة + تفعيل إعلان
- تسجيل مبلغ تم تحصيله نقدًا في الميدان
- سجل يومي للمندوب (عملياته)
- **ذمة مالية للمندوب** تظهر مباشرة

### 6.6 Finance: ذمم + تسوية
- عند تحصيل مبلغ:
  - يُسجّل كـ `agent_debt` (ذمة على المندوب)
- عند تسليم المبلغ للمحاسب:
  - عملية `settlement` تصفّر/تخصم الذمة
  - يُضاف المبلغ لخزينة الشركة + تقارير

---

## 7) Feature Toggles (إعدادات خصائص واسعة جدًا)
لوحة الإدارة يجب أن تحتوي “مفاتيح” لتفعيل/إلغاء تفعيل ميزات مثل:
- زر “هل أنت المالك؟” (إن تم اعتماده لاحقًا)
- زر الإبلاغ عن خطأ
- إظهار/إخفاء WhatsApp
- إظهار/إخفاء ساعات العمل
- تفعيل/تعطيل إضافة نشاط من الزوار (حاليًا غالبًا Disabled)
- تفعيل/تعطيل أنواع الإعلانات
- تفعيل/تعطيل أجزاء من الصفحة الرئيسية (بلوكات)

**قاعدة:**  
لا hardcode لميزة “فرضًا موجودة”، يجب أن تمر عبر Settings/FeatureToggles عند الإمكان.

---

## 8) التخزين (Multi-Storage Providers) — شرط إلزامي
المشروع يجب أن يدعم أكثر من مزود تخزين:
- Cloudflare R2
- Amazon S3
- MinIO (Self-hosted)
- Bunny Storage
- Local filesystem (للتطوير/حالات خاصة)

### 8.1 شرط أساسي
يجب بناء **Storage Abstraction Layer** موحد:
- واجهة (interface) واحدة مثل:
  - `putObject`
  - `getSignedUrl`
  - `deleteObject`
  - `exists`
- Providers تطبق نفس الواجهة.

### 8.2 Switching بأمان
المدير يستطيع تبديل “المزود الافتراضي” من لوحة الإدارة لاحقًا دون كسر النظام:
- تخزين metadata للملف في DB:
  - `storageProvider`
  - `bucket`
  - `objectKey`
  - `mimeType`
  - `size`
  - `checksum`
- الصور/الملفات لا تعتمد على URL ثابت من مزود واحد.
- توليد الوصول يتم عبر Signed URL أو Proxy endpoint حسب السياسة.

### 8.3 ملاحظة مهمة
التبديل لا يعني نقل كل الملفات تلقائيًا فورًا (اختياري لاحقًا).
لكن يجب أن النظام:
- يعرف أين يوجد كل ملف
- يقدر يخدمه بدون افتراض مزود واحد

---

## 9) خرائط Leaflet (No Google Maps)
- Leaflet للعرض
- PostGIS للاستعلامات الجغرافية:
  - nearest businesses
  - within polygon (اختياري)
  - bounding box search
- اختيار مزود Tiles مجاني/مفتوح (قرار تنفيذي لاحقًا)
- Cache لنتائج البحث الشائعة (اختياري)

---

## 10) قواعد الجودة الهندسية (AI-Agent Engineering Rules)
هذه “شروط عمل” لوكيل GitHub Pro/Copilot داخل VS Code على Windows:

### 10.1 لا تكتب شيئًا قبل توحيد:
- Naming conventions (أسماء النماذج/الأعمدة/DTOs)
- Folder structure لكل app
- Contracts/Types في `shared`

### 10.2 ممنوع إدخال مكتبات غير لازمة
- لا تضخم dependencies.
- كل إضافة مكتبة يجب أن يكون لها سبب واضح.

### 10.3 Database-first Logic
- تصميم Domain منطقي ثم Prisma schema.
- كل حقل جديد يجب أن يكون له:
  - سبب
  - فهرس (إذا يلزم)
  - سياسة حذف/أرشفة (soft delete إذا تقرر)

### 10.4 Errors & Validation
- Validation على مستوى DTO (api)
- أخطاء API موحدة (error codes)

### 10.5 Security Baseline
- JWT + Refresh token (أو جلسات) — قرار واحد
- RBAC واضح
- Rate limiting على endpoints الحساسة
- Audit log لأفعال الإدارة والمالية (على الأقل: create/update/delete + settlements)

### 10.6 Environment & Config
- كل شيء عبر env/config
- لا قيم ثابتة داخل الكود للأسعار/الباقات/الإعلانات
- الأسعار والمواضع من DB/Settings

### 10.7 الأداء
- Pagination في كل lists
- Indexes على:
  - search fields (pg_trgm إن اعتمد)
  - geo fields (GiST)
  - foreign keys

### 10.8 Maintainability
- فصل واضح بين:
  - domain
  - application services
  - infrastructure
- لا “God service” واحد لكل شيء

---

## 11) مسار التطوير (Roadmap مختصر)
1) `api` الأساس: Auth + Users/Roles + Geo + Directory CRUD  
2) `web-admin`: إدارة شاملة + Feature toggles + إدارة المحتوى  
3) `web-directory`: Search + Business profile + Map  
4) `mobile-agent`: إضافة نشاط + بيع باقة + إعلان + تحصيل + ذمة  
5) Finance: debts + settlements + basic reports  
6) Ads placements + targeting + reporting basic (views/clicks لاحقًا)

---

## 12) تعريف النجاح في المرحلة الأولى
- إدخال أنشطة بسرعة عبر المندوب
- بيع باقات + تسجيل تحصيل ميداني
- ذمم مالية دقيقة + تسوية محاسبية
- بحث سريع على الويب + خريطة Leaflet
- لوحة إدارة تتحكم بالميزات دون تعديل كود

---

## 13) مخرجات مطلوبة من الوكيل (Deliverables)
- خطة تنفيذ تقنية (تفصيل الملفات/المجلدات) بناءً على هذه المبادئ
- ERD/Domain models (منطقيًا) ثم Prisma schema
- API contracts + shared types
- تنفيذ أولي لكل app وفق المراحل أعلاه
- توثيق تشغيل على VPS عبر Coolify (infra notes)

---

## 14) محاذير (Pitfalls to Avoid)
- إدخال “سير عمل معقد للمندوب” (مرفوض)
- بناء Page Builder كامل (غير مطلوب)
- تعميم الإعلانات بلا استهداف جغرافي
- ربط الملفات بمزود تخزين واحد
- عدم توحيد التسمية منذ البداية

---

## 15) ملاحظات نهائية
هذا الملف يحدد **المبدأ والميزات والقواعد**.
الوكيل مسؤول عن:
- تفاصيل التنفيذ
- تقسيم المهام
- اختيار المكتبات المناسبة ضمن الحدود
- إنتاج كود نظيف وقابل للتوسع
- الالتزام الصارم بقواعد التسمية والطبقات
