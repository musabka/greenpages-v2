# Image Ordering System

## Overview
نظام ترتيب الصور يعتمد على حقل `sortOrder` الصريح في قاعدة البيانات، وليس على موضع الصورة في المصفوفة (array index).

## Why Explicit sortOrder?

### ❌ المشكلة مع Array Index
```typescript
// خطأ: الاعتماد على موضع الصورة في المصفوفة
images.map((img, index) => {
  // index هنا يمكن أن يتغير عند:
  // - إضافة صورة جديدة
  // - حذف صورة
  // - إعادة تحميل البيانات
  // - التصفية أو الفرز
})
```

### ✅ الحل: Explicit sortOrder
```typescript
// صحيح: كل صورة لها sortOrder خاص بها في قاعدة البيانات
interface BusinessImage {
  id: string;
  sortOrder: number;  // ← هذا هو الترتيب الحقيقي
  // ... other fields
}

// عند التحميل، نرتب حسب sortOrder
const sortedImages = images.sort((a, b) => a.sortOrder - b.sortOrder);
```

## Implementation Details

### 1. Loading Images
```typescript
const loadImages = async () => {
  const business = await apiClient.get(`/businesses/${businessId}`);
  
  // ✅ Sort by explicit sortOrder
  const sortedImages = (business.images || []).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  
  setImages(sortedImages);
};
```

### 2. Drag & Drop Reordering
```typescript
const handleDragEnd = async () => {
  // Get new order as array of IDs
  const imageIds = images.map(img => img.id);
  
  // Send to API - server will update sortOrder for each image
  await apiClient.put(`/businesses/${businessId}/images/reorder`, {
    imageIds
  });
  
  // Reload to get updated sortOrder from server
  await loadImages();
};
```

### 3. API Endpoint
```typescript
// PUT /businesses/:id/images/reorder
// Body: { imageIds: string[] }

// Server updates sortOrder:
// imageIds[0] → sortOrder = 0
// imageIds[1] → sortOrder = 1
// imageIds[2] → sortOrder = 2
// etc.
```

## Benefits

1. **Persistence**: الترتيب محفوظ في قاعدة البيانات
2. **Consistency**: نفس الترتيب في كل مكان (API, Admin, Web, Mobile)
3. **Reliability**: لا يتأثر بإضافة/حذف صور أخرى
4. **Flexibility**: يمكن إعادة الترتيب بسهولة
5. **Scalability**: يعمل مع أي عدد من الصور

## UI Features

### Visual Indicators
- **Drag Handle** (⋮⋮): يظهر عند hover للإشارة إلى إمكانية السحب
- **Sort Order Badge** (#1, #2, #3): يعرض الترتيب الحالي بوضوح
- **Loading State**: رسالة أثناء حفظ الترتيب الجديد
- **Drag Feedback**: الصورة المسحوبة تصبح شفافة

### User Flow
1. المستخدم يسحب صورة إلى موضع جديد
2. الواجهة تحدث الترتيب فوراً (optimistic update)
3. يتم إرسال الترتيب الجديد للسيرفر
4. السيرفر يحدث sortOrder في قاعدة البيانات
5. يتم إعادة تحميل الصور للتأكد من التزامن

## Database Schema

```prisma
model BusinessImage {
  id            String   @id @default(cuid())
  businessId    String
  business      Business @relation(fields: [businessId], references: [id])
  
  sortOrder     Int      @default(0)  // ← Explicit order field
  isPrimary     Boolean  @default(false)
  
  // ... other fields
  
  @@map("business_images")
}
```

## Testing Scenarios

### ✅ Should Work
- إعادة ترتيب الصور بالسحب والإفلات
- حذف صورة من المنتصف (الترتيب يبقى صحيح)
- إضافة صورة جديدة (تأخذ آخر sortOrder + 1)
- إعادة تحميل الصفحة (الترتيب محفوظ)
- فتح نفس النشاط من جهاز آخر (نفس الترتيب)

### ❌ Should NOT Happen
- تغيير الترتيب عند حذف صورة أخرى
- اختلاف الترتيب بين الصفحات
- فقدان الترتيب عند إعادة التحميل
- تضارب في الترتيب بين المستخدمين

## Best Practices

1. **Always sort by sortOrder** when displaying images
2. **Never rely on array index** for ordering
3. **Reload after reorder** to sync with server
4. **Show visual feedback** during drag operations
5. **Handle errors gracefully** and revert on failure

## Related Files

- `business-form-images.tsx` - UI implementation
- `business.controller.ts` - API endpoint
- `business.service.ts` - Reorder logic
- `schema.prisma` - Database schema
