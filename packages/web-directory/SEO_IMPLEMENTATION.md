# SEO Implementation Guide

## Overview

This document describes the comprehensive SEO implementation for the Green Pages web directory, covering all requirements from the specification (Requirements 15.1-15.10).

## Implemented Features

### ✅ 1. Meta Tags Per Page (Requirement 15.1)

All pages include unique, optimized meta tags:

- **Home Page**: General directory description
- **Business Pages**: Business-specific title, description, keywords
- **Search Pages**: Dynamic titles based on search query and pagination
- **404 Page**: Proper noindex meta tags

**Implementation:**
- Using Next.js `generateMetadata()` function for dynamic pages
- Static metadata for fixed pages
- Template-based titles in root layout

### ✅ 2. JSON-LD Structured Data (Requirement 15.2)

Implemented structured data types:

#### LocalBusiness Schema (Business Pages)
```json
{
  "@type": "LocalBusiness",
  "name": "Business Name",
  "address": { ... },
  "geo": { ... },
  "aggregateRating": { ... },
  "openingHoursSpecification": [ ... ]
}
```

#### Organization Schema (Home Page)
```json
{
  "@type": "Organization",
  "name": "الصفحات الخضراء | Green Pages",
  "url": "...",
  "logo": "..."
}
```

#### WebSite Schema with SearchAction (Home Page)
```json
{
  "@type": "WebSite",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "..."
  }
}
```

#### BreadcrumbList Schema (All Pages)
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [ ... ]
}
```

#### ⭐ Review Schema (Business Pages with 3+ Reviews) - ADVANCED
```json
{
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "Review",
      "author": { ... },
      "reviewRating": { ... },
      "reviewBody": "...",
      "datePublished": "..."
    }
  ]
}
```

#### ⭐ FAQPage Schema (Search Page) - ADVANCED
```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "...",
      "acceptedAnswer": { ... }
    }
  ]
}
```

### ✅ 3. Dynamic Sitemap.xml (Requirement 15.3)

**File:** `app/sitemap.ts`

Features:
- Static pages (home, search)
- All business pages with proper priorities
- Category pages
- Location pages (governorates and cities)
- Proper `lastModified` dates
- Change frequency hints
- Priority values (1.0 for home, 0.9 for featured businesses, etc.)
- Multi-language alternates

**Pagination Handling:**
- Fetches all businesses in batches
- Safety limit to prevent infinite loops
- Error handling for API failures

### ✅ 4. Canonical URLs (Requirement 15.4)

Implemented on all pages:
- Home: `/`
- Business: `/business/[slug]`
- Search: `/search?query=...` (with all filters)
- Proper handling of pagination parameters

**Implementation:**
```typescript
alternates: {
  canonical: canonicalUrl,
}
```

### ✅ 5. Semantic HTML5 (Requirement 15.5)

Proper semantic elements used throughout:
- `<header>` for page headers
- `<main>` for main content
- `<article>` for business cards and content
- `<aside>` for sidebars and filters
- `<nav>` for navigation
- `<footer>` for page footers
- `<section>` for content sections

### ✅ 6. Open Graph and Twitter Cards (Requirement 15.6)

All pages include:

**Open Graph:**
- `og:type`: website
- `og:locale`: ar_LB / en_US
- `og:url`: Canonical URL
- `og:title`: Page-specific title
- `og:description`: Page-specific description
- `og:image`: Business images or default
- `og:site_name`: الصفحات الخضراء | Green Pages

**Twitter Cards:**
- `twitter:card`: summary_large_image
- `twitter:title`: Page-specific title
- `twitter:description`: Page-specific description
- `twitter:image`: Business images or default

### ✅ 7. Custom SEO Fields (Requirement 15.7)

Business model supports:
- `metaTitle`: Custom meta title
- `metaDescription`: Custom meta description
- `slug`: SEO-friendly URL slug

**Fallback Logic:**
```typescript
const title = business.metaTitle || `${business.name} - ${business.category.name}`;
const description = business.metaDescription || business.description || 
  `${business.name} في ${business.district.name}. ${business.category.name}`;
```

### ✅ 8. Heading Hierarchy (Requirement 15.8)

Proper heading structure:
- `<h1>`: Main page title (one per page)
- `<h2>`: Major sections
- `<h3>`: Subsections
- No skipped levels

**Examples:**
- Home: H1 (Hero), H2 (Categories, Featured)
- Business: H1 (Business Name), H2 (Sections), H3 (Subsections)
- Search: H1 (Search Title), H2 (Filters, Results)

### ✅ 9. robots.txt (Requirement 15.9)

**File:** `app/robots.ts`

Features:
- Allow all crawlers by default
- Disallow: `/api/`, `/admin/`, `/_next/`, `/private/`
- Special rules for Googlebot and Bingbot
- Sitemap reference
- Host declaration
- Deep pagination protection

### ✅ 10. Hreflang Tags (Requirement 15.10)

Implemented on all pages:

```typescript
alternates: {
  languages: {
    'ar': '/ar/...',
    'en': '/en/...',
    'ar-LB': '/ar/...',
    'en-US': '/en/...',
  },
}
```

**Coverage:**
- Home page
- Business pages
- Search pages
- Category pages
- Location pages

## Additional SEO Features

### ⭐ Advanced Structured Data (Beyond Requirements)

#### Review Schema for High-Rated Businesses
- Automatically generated for businesses with 3+ reviews
- Fetches top 5 reviews from API
- Displays in Google Rich Results
- Shows star ratings directly in search results
- Includes reviewer names and dates

**Benefits:**
- Increased click-through rates (CTR)
- Better visibility in search results
- Trust signals for potential customers
- Rich snippets in Google Search

#### FAQPage Schema for Search
- Common questions about using the directory
- Appears in "People Also Ask" section
- Helps with voice search optimization
- Provides quick answers to users

**FAQ Topics:**
- How to search for businesses
- How to filter results
- What are featured businesses
- How to contact businesses
- How to leave reviews

### Pagination SEO

**Search Pages:**
- `rel="prev"` and `rel="next"` link tags
- Noindex for deep pagination (page 4+)
- Proper canonical URLs with pagination params

### Performance Optimization

- ISR (Incremental Static Regeneration) for business pages
- Proper caching headers
- Lazy loading for images
- Optimized Core Web Vitals

### Mobile SEO

- Responsive meta viewport
- Mobile-first design
- Touch-friendly targets (44x44px minimum)
- Fast mobile load times

### Image SEO

- Alt text for all images
- Proper image dimensions in Open Graph
- Lazy loading for below-fold images
- WebP format support

## Testing Checklist

### Manual Testing

- [ ] Verify meta tags in browser DevTools
- [ ] Test structured data with Google Rich Results Test
- [ ] Check sitemap.xml accessibility
- [ ] Verify robots.txt rules
- [ ] Test canonical URLs
- [ ] Verify hreflang tags
- [ ] Check Open Graph preview (Facebook Debugger)
- [ ] Check Twitter Card preview (Twitter Card Validator)

### Automated Testing

```bash
# Test sitemap generation
curl http://localhost:3000/sitemap.xml

# Test robots.txt
curl http://localhost:3000/robots.txt

# Test structured data
npx @lhci/cli collect --url=http://localhost:3000
```

### SEO Tools

1. **Google Search Console**
   - Submit sitemap
   - Monitor index coverage
   - Check mobile usability

2. **Google Rich Results Test**
   - Test structured data
   - Verify LocalBusiness schema

3. **PageSpeed Insights**
   - Check Core Web Vitals
   - Monitor performance scores

4. **Screaming Frog SEO Spider**
   - Crawl entire site
   - Check for broken links
   - Verify meta tags

## Best Practices

### Content

- Unique titles for each page (50-60 characters)
- Unique descriptions (150-160 characters)
- Descriptive, keyword-rich content
- Natural keyword usage (no stuffing)

### Technical

- HTTPS everywhere
- Fast page load times (<3s)
- Mobile-responsive design
- Clean URL structure
- Proper 301 redirects for moved content

### Structured Data

- Valid JSON-LD syntax
- Complete required properties
- Test with Google's tools
- Keep data accurate and up-to-date

## Future Enhancements

### Phase 2

- [ ] Add FAQ schema for common questions
- [ ] Implement Review schema for business reviews
- [ ] Add Event schema for business events
- [ ] Implement AMP pages for mobile
- [ ] Add breadcrumb navigation UI

### Phase 3

- [ ] Implement video schema for business videos
- [ ] Add Product schema for business offerings
- [ ] Implement local business hours in real-time
- [ ] Add multi-location business support
- [ ] Implement advanced schema markup

## Monitoring

### Key Metrics

1. **Organic Traffic**: Monitor in Google Analytics
2. **Search Rankings**: Track keyword positions
3. **Click-Through Rate**: Monitor in Search Console
4. **Index Coverage**: Check in Search Console
5. **Core Web Vitals**: Monitor in PageSpeed Insights

### Regular Tasks

- Weekly: Check Search Console for errors
- Monthly: Review organic traffic trends
- Quarterly: Audit structured data
- Annually: Comprehensive SEO audit

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)
- [Web.dev SEO](https://web.dev/learn/seo/)

## Support

For SEO-related questions or issues:
1. Check this documentation
2. Review Next.js SEO documentation
3. Test with Google's tools
4. Consult with SEO team

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** ✅ Complete
