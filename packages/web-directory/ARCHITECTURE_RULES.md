# Architecture Rules - Web Directory

## 🚨 Critical Rules (MUST Follow)

### Rule 1: Blocks = Server Components ONLY

**Applies to**: Header, Footer, Hero, and all Block components

```typescript
// ✅ CORRECT
export default async function Header() {
  const block = await apiClient.getBlock('header', 'WEB_DIRECTORY');
  return <header>{/* render block */}</header>;
}

// ❌ WRONG
'use client';
export default function Header() {
  const [block, setBlock] = useState(null);
  useEffect(() => { /* fetch */ }, []);
  return <header>{/* render block */}</header>;
}
```

**Why?**
- SEO: Server-rendered content is indexed immediately
- Performance: No client-side JavaScript for static content
- ISR: Blocks can be cached and revalidated efficiently

**Rules**:
- ❌ No `'use client'` directive
- ❌ No `useState`, `useEffect`, or any React hooks
- ❌ No client-side state management
- ✅ Fetch data directly in component (async/await)
- ✅ Use ISR revalidation for updates

---

### Rule 2: Language Switcher = Minimal Client Component

**Implementation**:

```typescript
// ✅ CORRECT - Minimal client component
'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  
  const switchLanguage = (locale: string) => {
    // 1. Set cookie
    Cookies.set('NEXT_LOCALE', locale, { expires: 365 });
    
    // 2. Refresh to apply changes
    router.refresh();
  };

  return (
    <button onClick={() => switchLanguage(currentLocale === 'ar' ? 'en' : 'ar')}>
      {currentLocale === 'ar' ? 'English' : 'العربية'}
    </button>
  );
}

// ❌ WRONG - Complex i18n logic in frontend
'use client';
export function LanguageSwitcher() {
  const [translations, setTranslations] = useState({});
  const [locale, setLocale] = useState('ar');
  
  useEffect(() => {
    // Fetching translations client-side
    fetch(`/api/translations/${locale}`).then(/* ... */);
  }, [locale]);
  
  // Complex translation logic...
}
```

**Why?**
- Cookie + Refresh: Simple and reliable
- No i18n library needed on client
- Server handles all translation logic
- Minimal JavaScript bundle

**Rules**:
- ✅ Only change cookie
- ✅ Call `router.refresh()`
- ❌ No translation logic in component
- ❌ No fetching translations client-side
- ❌ No complex state management

---

### Rule 3: Layout = "Dumb" Orchestrator

**Implementation**:

```typescript
// ✅ CORRECT - Simple orchestration
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Simple, shallow data fetching
  const locale = cookies().get('NEXT_LOCALE')?.value || 'ar';
  
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

// ❌ WRONG - Complex business logic
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Deep API calls
  const user = await apiClient.getCurrentUser();
  const permissions = await apiClient.getUserPermissions(user.id);
  const features = await apiClient.getFeatureToggles();
  const notifications = await apiClient.getNotifications(user.id);
  
  // Complex business logic
  if (user.role === 'ADMIN') {
    // Special admin layout
  } else if (user.subscription.expired) {
    // Show upgrade prompt
  }
  
  return (/* complex conditional rendering */);
}
```

**Why?**
- Performance: Layout runs on every page
- Simplicity: Easy to understand and maintain
- Separation: Business logic belongs in pages/components

**Rules**:
- ✅ Only orchestrate components
- ✅ Minimal data fetching (locale, theme)
- ❌ No deep API calls
- ❌ No complex business logic
- ❌ No conditional rendering based on user data

---

## 🔒 ISR + Locale Cache Safety

### Problem: Cache Poisoning

Without proper headers, ISR might serve:
- Arabic page to English user
- English page to Arabic user

### Solution: Vary Header

```typescript
// In proxy.ts
response.headers.set('Vary', 'Cookie, Accept-Language');
```

**What this does**:
- Tells CDN/cache to key responses by Cookie AND Accept-Language
- Ensures each locale gets its own cached version
- Prevents serving wrong language to users

### Testing

```bash
# Test 1: Arabic user
curl -H "Cookie: NEXT_LOCALE=ar" http://localhost:3000/

# Test 2: English user
curl -H "Cookie: NEXT_LOCALE=en" http://localhost:3000/

# Both should return different content
```

---

## 📄 Search + Pagination SEO Rules

### Rule 1: Canonical URLs

```typescript
// ✅ CORRECT
export const metadata: Metadata = {
  alternates: {
    canonical: '/search?q=restaurant&page=1',
  },
};

// For paginated results
if (page > 1) {
  metadata.alternates = {
    canonical: `/search?q=${query}`,  // Point to page 1
  };
}
```

### Rule 2: Noindex Deep Pages

```typescript
// ✅ CORRECT - Noindex pages beyond page 3
export const metadata: Metadata = {
  robots: {
    index: page <= 3,  // Only index first 3 pages
    follow: true,
  },
};
```

### Rule 3: Prev/Next Links

```typescript
// ✅ CORRECT
export const metadata: Metadata = {
  alternates: {
    canonical: `/search?q=${query}&page=${page}`,
  },
  other: {
    ...(page > 1 && { prev: `/search?q=${query}&page=${page - 1}` }),
    ...(hasNextPage && { next: `/search?q=${query}&page=${page + 1}` }),
  },
};
```

**Why?**
- Prevents duplicate content penalties
- Helps search engines understand pagination
- Focuses SEO value on important pages

---

## 📊 Component Classification

### Server Components (Default)

- ✅ Header
- ✅ Footer
- ✅ Hero
- ✅ Business Card
- ✅ Category List
- ✅ Search Results (container)
- ✅ All Blocks

### Client Components (Minimal)

- ✅ Language Switcher
- ✅ Map (Leaflet)
- ✅ Review Form
- ✅ Notification Bell
- ✅ Search Filters (interactive)
- ✅ Image Gallery (interactive)

### Hybrid (Server + Client)

```typescript
// Server Component (container)
export default async function SearchPage() {
  const results = await apiClient.search(params);
  
  return (
    <div>
      <SearchResults results={results} />  {/* Server */}
      <SearchFilters />  {/* Client */}
    </div>
  );
}
```

---

## 🎯 Performance Targets

### Core Web Vitals

- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

### How to Achieve

1. **Server Components**: Reduce JavaScript bundle
2. **ISR**: Fast page loads from cache
3. **Image Optimization**: Next.js Image component
4. **Lazy Loading**: Load images/maps on demand
5. **Minimal Client JS**: Only interactive components

---

## 🚫 Anti-Patterns to Avoid

### ❌ Client-Side Data Fetching in Blocks

```typescript
// ❌ WRONG
'use client';
export function Header() {
  const [menu, setMenu] = useState([]);
  
  useEffect(() => {
    fetch('/api/menu').then(res => res.json()).then(setMenu);
  }, []);
  
  return <header>{/* render menu */}</header>;
}
```

**Why wrong?**
- SEO: Content not in initial HTML
- Performance: Extra network request
- UX: Loading state visible to user

### ❌ Complex State in Layout

```typescript
// ❌ WRONG
'use client';
export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState([]);
  
  // Complex state management...
}
```

**Why wrong?**
- Performance: Layout re-renders on every state change
- Complexity: Hard to debug and maintain
- SEO: Client-side rendering hurts SEO

### ❌ Fetching Translations Client-Side

```typescript
// ❌ WRONG
'use client';
export function Component() {
  const [t, setT] = useState({});
  const locale = useLocale();
  
  useEffect(() => {
    fetch(`/api/translations/${locale}`).then(/* ... */);
  }, [locale]);
}
```

**Why wrong?**
- Performance: Extra network request
- Bundle size: i18n library adds weight
- Complexity: Server already has translations

---

## ✅ Checklist for New Components

Before creating a component, ask:

1. **Does it need interactivity?**
   - No → Server Component
   - Yes → Client Component (minimal)

2. **Does it fetch data?**
   - Yes → Server Component (async/await)
   - No → Either (prefer Server)

3. **Is it a Block?**
   - Yes → MUST be Server Component

4. **Does it need state?**
   - No → Server Component
   - Yes → Client Component (keep minimal)

5. **Is it in Layout?**
   - Yes → Keep it simple (no business logic)

---

## 📚 References

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [SEO Best Practices](https://nextjs.org/learn/seo/introduction-to-seo)

---

**Last Updated**: December 27, 2025
**Version**: 1.0.0
**Status**: ✅ Active
