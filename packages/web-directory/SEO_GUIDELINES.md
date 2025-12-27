# SEO Guidelines - Web Directory

## 🎯 Search + Pagination Best Practices

### Rule 1: Canonical URLs

**Purpose**: Prevent duplicate content penalties

```typescript
// pages/search/page.tsx
export async function generateMetadata({ searchParams }): Promise<Metadata> {
  const page = Number(searchParams.page) || 1;
  const query = searchParams.q || '';
  
  return {
    alternates: {
      canonical: page === 1 
        ? `/search?q=${query}`
        : `/search?q=${query}&page=1`,  // Always point to page 1
    },
  };
}
```

**Why?**
- Search engines see page 1 as the primary version
- Prevents dilution of SEO value across pages
- Consolidates ranking signals

---

### Rule 2: Noindex Deep Pages

**Purpose**: Focus SEO value on important pages

```typescript
export async function generateMetadata({ searchParams }): Promise<Metadata> {
  const page = Number(searchParams.page) || 1;
  
  return {
    robots: {
      index: page <= 3,      // Only index first 3 pages
      follow: true,          // But follow links on all pages
      googleBot: {
        index: page <= 3,
        follow: true,
      },
    },
  };
}
```

**Why?**
- Deep pagination pages have low value
- Prevents crawl budget waste
- Focuses SEO on high-quality pages

**Thresholds**:
- Pages 1-3: Index + Follow
- Pages 4+: Noindex + Follow

---

### Rule 3: Prev/Next Links

**Purpose**: Help search engines understand pagination

```typescript
export async function generateMetadata({ searchParams }): Promise<Metadata> {
  const page = Number(searchParams.page) || 1;
  const query = searchParams.q || '';
  const totalPages = 10; // Get from API
  
  const links: Record<string, string> = {};
  
  if (page > 1) {
    links.prev = `/search?q=${query}&page=${page - 1}`;
  }
  
  if (page < totalPages) {
    links.next = `/search?q=${query}&page=${page + 1}`;
  }
  
  return {
    alternates: {
      canonical: `/search?q=${query}&page=${page}`,
    },
    other: links,
  };
}
```

**Why?**
- Helps Google understand page relationships
- Improves crawling efficiency
- Better indexing of paginated content

---

### Rule 4: URL Structure

**Good URL Structure**:
```
✅ /search?q=restaurant&page=2
✅ /search?q=restaurant&location=beirut&page=2
✅ /category/restaurants?page=2
```

**Bad URL Structure**:
```
❌ /search/page/2?q=restaurant  (page in path)
❌ /search?q=restaurant&p=2     (unclear parameter)
❌ /search?query=restaurant&offset=20  (offset instead of page)
```

**Why?**
- Consistent structure is easier to crawl
- Query parameters are flexible
- Page number is clear and semantic

---

## 📄 Business Profile Pages

### Metadata Template

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const business = await apiClient.getBusinessBySlug(params.slug);
  
  return {
    title: business.metaTitle || `${business.name} | الصفحات الخضراء`,
    description: business.metaDescription || business.description,
    keywords: [
      business.name,
      business.category.name,
      business.district.name,
      business.city.name,
      'دليل',
      'أعمال',
    ],
    alternates: {
      canonical: `/business/${business.slug}`,
      languages: {
        ar: `/ar/business/${business.slug}`,
        en: `/en/business/${business.slug}`,
      },
    },
    openGraph: {
      title: business.name,
      description: business.description,
      url: `/business/${business.slug}`,
      siteName: 'الصفحات الخضراء',
      images: business.images.map(img => ({
        url: img.url,
        width: 1200,
        height: 630,
        alt: business.name,
      })),
      locale: 'ar_AR',
      type: 'business.business',
    },
    twitter: {
      card: 'summary_large_image',
      title: business.name,
      description: business.description,
      images: [business.images[0]?.url],
    },
  };
}
```

---

### Structured Data (JSON-LD)

```typescript
export default async function BusinessPage({ params }) {
  const business = await apiClient.getBusinessBySlug(params.slug);
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    image: business.images.map(img => img.url),
    '@id': `https://greenpages.com/business/${business.slug}`,
    url: `https://greenpages.com/business/${business.slug}`,
    telephone: business.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: business.district.name,
      addressRegion: business.city.name,
      addressCountry: 'LB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.lat,
      longitude: business.lng,
    },
    openingHoursSpecification: business.workingHours && Object.entries(business.workingHours).map(([day, hours]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: day,
      opens: hours.open,
      closes: hours.close,
    })),
    aggregateRating: business.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: business.avgRating,
      reviewCount: business.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Page content */}
    </>
  );
}
```

---

## 🗺️ Sitemap Strategy

### Dynamic Sitemap Generation

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];
  
  // Fetch businesses
  const businesses = await apiClient.getAllBusinessSlugs();
  const businessPages: MetadataRoute.Sitemap = businesses.map(business => ({
    url: `${baseUrl}/business/${business.slug}`,
    lastModified: new Date(business.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));
  
  // Fetch categories
  const categories = await apiClient.getAllCategorySlugs();
  const categoryPages: MetadataRoute.Sitemap = categories.map(category => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));
  
  return [...staticPages, ...businessPages, ...categoryPages];
}
```

**Limits**:
- Maximum 50,000 URLs per sitemap
- If exceeded, split into multiple sitemaps
- Use sitemap index file

---

## 🌐 Hreflang Tags

### Multi-Language Support

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const business = await apiClient.getBusinessBySlug(params.slug);
  
  return {
    alternates: {
      canonical: `/business/${business.slug}`,
      languages: {
        'ar': `/ar/business/${business.slug}`,
        'en': `/en/business/${business.slug}`,
        'x-default': `/business/${business.slug}`,  // Default fallback
      },
    },
  };
}
```

**Why?**
- Helps Google serve correct language to users
- Prevents duplicate content across languages
- Improves international SEO

---

## 📊 Performance = SEO

### Core Web Vitals Impact

| Metric | Target | SEO Impact |
|--------|--------|------------|
| LCP | < 2.5s | High |
| FID | < 100ms | Medium |
| CLS | < 0.1 | High |

### How to Achieve

1. **Server Components**: Reduce JavaScript
2. **ISR**: Fast page loads from cache
3. **Image Optimization**: Next.js Image component
4. **Lazy Loading**: Load below-fold content on demand
5. **Minimal Client JS**: Only interactive components

---

## 🚫 SEO Anti-Patterns

### ❌ Client-Side Rendering for Content

```typescript
// ❌ WRONG - Content not in initial HTML
'use client';
export function BusinessProfile() {
  const [business, setBusiness] = useState(null);
  
  useEffect(() => {
    fetch(`/api/business/${slug}`).then(/* ... */);
  }, []);
  
  return <div>{business?.name}</div>;
}
```

**Why wrong?**
- Search engines don't see content
- Slow initial render
- Poor user experience

### ❌ Duplicate Content

```typescript
// ❌ WRONG - Multiple URLs for same content
/business/123
/business/restaurant-name
/b/restaurant-name
```

**Solution**: Use canonical URLs

### ❌ Infinite Scroll Without Pagination

```typescript
// ❌ WRONG - No way to deep link
<InfiniteScroll onLoadMore={loadMore} />
```

**Solution**: Hybrid approach
- Infinite scroll for UX
- Pagination URLs for SEO
- Load More button as fallback

---

## ✅ SEO Checklist

### Every Page Must Have

- [ ] Unique `<title>` tag (50-60 characters)
- [ ] Unique `<meta description>` (150-160 characters)
- [ ] Canonical URL
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] Semantic HTML (h1, h2, etc.)
- [ ] Alt text for images
- [ ] Structured data (where applicable)

### Business Pages Must Have

- [ ] LocalBusiness schema
- [ ] Aggregate rating (if reviews exist)
- [ ] Opening hours
- [ ] Address with geo coordinates
- [ ] Breadcrumb schema
- [ ] hreflang tags (multi-language)

### Search/Category Pages Must Have

- [ ] Canonical to page 1
- [ ] Noindex for deep pages (4+)
- [ ] Prev/next links
- [ ] Clear heading hierarchy
- [ ] Descriptive meta description

---

## 📚 Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org LocalBusiness](https://schema.org/LocalBusiness)
- [Next.js SEO](https://nextjs.org/learn/seo/introduction-to-seo)
- [Core Web Vitals](https://web.dev/vitals/)

---

**Last Updated**: December 27, 2025
**Version**: 1.0.0
**Status**: ✅ Active
