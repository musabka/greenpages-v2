# Web Directory Implementation Notes

## Task 23.1: Setup Next.js Directory Project ✅

### Completed

1. **Project Configuration**
   - ✅ Next.js 16.1.1 (latest stable as of Dec 22, 2025)
   - ✅ React 19.0.0
   - ✅ TypeScript 5.7.2
   - ✅ Tailwind CSS 3.4.17
   - ✅ App Router architecture

2. **Core Files Created**
   - ✅ `next.config.js` - Next.js configuration with i18n, image optimization, security headers
   - ✅ `tailwind.config.ts` - Tailwind configuration with custom theme
   - ✅ `postcss.config.js` - PostCSS configuration
   - ✅ `.env.example` - Environment variables template
   - ✅ `.gitignore` - Git ignore rules

3. **App Router Structure**
   - ✅ `app/layout.tsx` - Root layout with metadata and SEO
   - ✅ `app/page.tsx` - Home page with ISR (5 min revalidation)
   - ✅ `app/globals.css` - Global styles with RTL support
   - ✅ `app/robots.ts` - Dynamic robots.txt generation
   - ✅ `app/sitemap.ts` - Dynamic sitemap.xml generation

4. **Library Files**
   - ✅ `lib/api-client.ts` - API client for Server Components with ISR support
   - ✅ `lib/utils.ts` - Utility functions (formatting, distance calculation, structured data)
   - ✅ `lib/constants.ts` - Application constants and configuration

5. **Type Definitions**
   - ✅ `types/index.ts` - TypeScript interfaces matching API responses

6. **Middleware**
   - ✅ `middleware.ts` - Locale detection and cookie management

7. **Documentation**
   - ✅ `README.md` - Comprehensive project documentation
   - ✅ `IMPLEMENTATION_NOTES.md` - This file
   - ✅ `VERSION_UPDATE.md` - Next.js 16.1.1 update notes

### Architecture Decisions

#### 0. Next.js 16.1.1 Updates
- **i18n**: Removed from next.config.js (not supported in App Router)
- **Middleware**: Renamed to `proxy.ts` (new convention in Next.js 16)
- **CSS**: Fixed @import order and Tailwind classes
- **Build**: Successfully builds with Turbopack

#### 1. Server Components First
- **Default**: All components are Server Components
- **Client Components**: Only for interactive features (map, forms, notifications)
- **Reason**: Better SEO, faster initial load, reduced JavaScript bundle

#### 2. ISR Strategy
```typescript
// Business pages: 1 hour revalidation
export const revalidate = 3600;

// Category pages: 2 hours revalidation
export const revalidate = 7200;

// Home page: 5 minutes revalidation
export const revalidate = 300;

// Search results: SSR (always fresh)
export const revalidate = 0;
```

#### 3. No Code Sharing with Admin
- **Principle**: Web Directory and Web Admin are completely separate
- **Reason**: Different rendering strategies, different UX patterns
- **Implementation**: No imports from `@green-pages/web-admin`

#### 4. API Client Design
- **Server Components**: Use `apiClient` with ISR caching
- **Client Components**: Will create separate client with different caching strategy
- **Caching**: Leverages Next.js 15 fetch cache with tags for revalidation

#### 5. SEO Optimization
- **Meta Tags**: Comprehensive metadata in layout and pages
- **Structured Data**: Utility functions ready for JSON-LD implementation
- **Sitemap**: Dynamic generation (to be populated with API data)
- **Robots.txt**: Dynamic generation with proper directives

### Next Steps (Task 23.2)

1. **Implement Responsive Layout**
   - Create Header component (Server Component)
   - Create Footer component (Server Component)
   - Create Hero block component
   - Implement mobile-first responsive design
   - Add RTL/LTR layout switching

2. **Implement Block System**
   - Fetch blocks from API
   - Render blocks based on settings
   - Support header, footer, home_hero blocks

3. **Language Switcher**
   - Client Component for language selection
   - Cookie-based locale persistence
   - Page reload with new locale

### Dependencies Added

```json
{
  "clsx": "^2.1.1",           // Class name utility
  "tailwind-merge": "^2.5.5"  // Tailwind class merging
}
```

### Environment Variables

All environment variables are documented in `.env.example`:
- API URL
- Site configuration
- Map configuration
- ISR revalidation times
- Feature flags

### Performance Considerations

1. **Image Optimization**: Using Next.js Image component with AVIF/WebP
2. **Font Optimization**: Using Next.js font optimization
3. **Code Splitting**: Automatic with App Router
4. **Lazy Loading**: Will implement for images and maps
5. **CDN Caching**: Static assets ready for CDN

### SEO Checklist

- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph tags
- ✅ Twitter Card tags
- ✅ Canonical URLs
- ✅ robots.txt
- ✅ sitemap.xml
- ✅ Semantic HTML5 structure
- ⏳ Structured data (JSON-LD) - Ready for implementation
- ⏳ hreflang tags - Ready for implementation
- ⏳ Dynamic sitemap with API data

### Testing Notes

- Unit tests will be added for utility functions
- Integration tests will be added for API client
- E2E tests will be added for critical user flows

### Known Issues / TODOs

1. Need to populate sitemap with dynamic data from API
2. Need to implement actual business/category pages
3. Need to implement search functionality
4. Need to implement map integration
5. Need to implement ad display
6. Need to implement review system

### References

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [App Router Documentation](https://nextjs.org/docs/app)
- [ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [SEO Best Practices](https://nextjs.org/learn/seo/introduction-to-seo)
- [Next.js 16.1 Release Notes](https://nextjs.org/blog/next-16-1)
