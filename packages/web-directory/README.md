# Web Directory - Green Pages

Public-facing directory website for Green Pages project.

**Built with Next.js 16.1.1** (Latest stable - Dec 22, 2025)

## Architecture Principles

### 🎯 Core Principles

1. **SEO-First**: Server Components by default, optimized for search engines
2. **ISR Strategy**: Incremental Static Regeneration for dynamic content
3. **Read-Heavy**: Optimized for browsing and discovery, not admin actions
4. **No Code Sharing with Admin**: Completely separate from web-admin package

### 📦 Rendering Strategy

| Page Type | Strategy | Revalidation | Reason |
|-----------|----------|--------------|--------|
| Home | ISR | 5 min | Frequently updated, high traffic |
| Business Profile | ISR | 1 hour | Semi-static, SEO critical |
| Category Pages | ISR | 2 hours | Rarely change |
| Search Results | SSR | N/A | Always fresh, user-specific |
| Static Pages | SSG | N/A | Never change |

### 🚫 Client Components Only For

- Map interactions (Leaflet)
- Review submission forms
- Notification bell
- Language switcher
- Interactive filters

### ⚡ Performance Targets

- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

## Project Structure

```
packages/web-directory/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout (Server Component)
│   ├── page.tsx           # Home page (ISR)
│   ├── business/          # Business pages
│   │   └── [slug]/        # Dynamic business profile (ISR)
│   ├── category/          # Category pages
│   │   └── [slug]/        # Dynamic category page (ISR)
│   ├── search/            # Search page (SSR)
│   ├── robots.ts          # SEO: robots.txt
│   └── sitemap.ts         # SEO: sitemap.xml
├── components/            # React components
│   ├── business/          # Business-related components
│   ├── map/               # Map components (Client)
│   ├── search/            # Search components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities
│   ├── api-client.ts      # API client for Server Components
│   └── utils.ts           # Helper functions
└── public/                # Static assets
```

## Environment Variables

See `.env.example` for all required environment variables.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## SEO Features

### ✅ Implemented

- Meta tags (title, description, keywords)
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- robots.txt
- sitemap.xml
- Semantic HTML5
- Structured data (JSON-LD) - Ready for implementation

### 🔄 To Implement

- Dynamic sitemap generation from API
- Business structured data (LocalBusiness)
- Breadcrumb structured data
- hreflang tags for multi-language
- Custom SEO fields per business

## ISR Configuration

ISR revalidation times are configured via environment variables:

- `NEXT_PUBLIC_ISR_REVALIDATE_BUSINESS`: Business pages (default: 3600s = 1 hour)
- `NEXT_PUBLIC_ISR_REVALIDATE_CATEGORY`: Category pages (default: 7200s = 2 hours)
- `NEXT_PUBLIC_ISR_REVALIDATE_HOME`: Home page (default: 300s = 5 minutes)

## Advertising Integration

Ads are clearly labeled as "إعلان" (Advertisement) and maintain consistent DOM structure for CLS optimization.

Supported placements:
- Search sponsored results
- Home hero banner
- Category page banners
- Business profile sidebar
- Map pin highlights
- Search autocomplete suggestions

## i18n Support

- Primary language: Arabic (ar)
- Secondary language: English (en)
- RTL/LTR layout support
- Locale-based content fetching from API

## Map Integration

Using Leaflet (not Google Maps) with:
- Free/open tile providers
- PostGIS-powered geographic queries
- Business markers with popups
- Responsive map sizing

## Performance Optimizations

1. **Image Optimization**: Next.js Image component with AVIF/WebP
2. **Lazy Loading**: Images and maps load on demand
3. **Code Splitting**: Automatic with Next.js App Router
4. **CDN Caching**: Static assets served from CDN
5. **Response Compression**: Gzip/Brotli enabled
6. **Font Optimization**: Next.js font optimization

## Notes

- **No Shared Components**: Do not import from `web-admin` package
- **Server Components Default**: Use `'use client'` only when necessary
- **ISR Over SSR**: Prefer ISR for better performance when possible
- **Pagination SEO**: Implement canonical + prev/next for paginated content
