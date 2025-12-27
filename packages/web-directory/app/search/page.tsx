import { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchForm } from '@/components/search/SearchForm';
import { SearchFilters } from '@/components/search/SearchFilters';

interface SearchPageProps {
  searchParams: {
    query?: string;
    categoryId?: string;
    governorateId?: string;
    cityId?: string;
    districtId?: string;
    sortBy?: 'nearest' | 'newest' | 'featured' | 'rating';
    page?: string;
  };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const query = searchParams.query || '';
  
  // Base title and description
  let title = 'البحث - الصفحات الخضراء';
  let description = 'ابحث عن الأنشطة التجارية والخدمية في لبنان';
  
  if (query) {
    title = `نتائج البحث عن "${query}" - الصفحات الخضراء`;
    description = `نتائج البحث عن ${query} في دليل الأنشطة التجارية والخدمية`;
  }
  
  if (page > 1) {
    title = `${title} - صفحة ${page}`;
  }
  
  // Deep pagination SEO: noindex for pages 4+
  const robots = page >= 4 
    ? { index: false, follow: true }
    : { index: true, follow: true };
  
  // Build canonical URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenpages.lb';
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (searchParams.categoryId) params.set('categoryId', searchParams.categoryId);
  if (searchParams.governorateId) params.set('governorateId', searchParams.governorateId);
  if (searchParams.cityId) params.set('cityId', searchParams.cityId);
  if (searchParams.districtId) params.set('districtId', searchParams.districtId);
  if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy);
  if (page > 1) params.set('page', page.toString());
  
  const canonical = `${baseUrl}/search${params.toString() ? `?${params.toString()}` : ''}`;
  
  return {
    title,
    description,
    robots,
    alternates: {
      canonical,
      languages: {
        'ar': `${baseUrl}/ar/search${params.toString() ? `?${params.toString()}` : ''}`,
        'en': `${baseUrl}/en/search${params.toString() ? `?${params.toString()}` : ''}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'ar_LB',
      alternateLocale: ['en_US'],
      url: canonical,
      siteName: 'الصفحات الخضراء | Green Pages',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

// Generate BreadcrumbList structured data for search page
function generateSearchBreadcrumbData(query?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const items: any[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'الصفحة الرئيسية',
      item: baseUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'البحث',
      item: `${baseUrl}/search`,
    },
  ];
  
  if (query) {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: `نتائج البحث عن "${query}"`,
      item: `${baseUrl}/search?query=${encodeURIComponent(query)}`,
    });
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

// Generate FAQPage schema for search page
function generateSearchFAQSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'كيف يمكنني البحث عن نشاط تجاري؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'يمكنك استخدام شريط البحث في الأعلى للبحث عن الأنشطة التجارية بالاسم أو الفئة أو الموقع. يمكنك أيضاً استخدام الفلاتر الجانبية لتضييق نطاق البحث حسب المحافظة أو المدينة أو الفئة.',
        },
      },
      {
        '@type': 'Question',
        name: 'كيف يمكنني تصفية نتائج البحث؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'استخدم الفلاتر الموجودة في الشريط الجانبي لتصفية النتائج حسب الفئة، المحافظة، المدينة، أو الحي. يمكنك أيضاً ترتيب النتائج حسب الأقرب، الأحدث، أو المميز.',
        },
      },
      {
        '@type': 'Question',
        name: 'ما هي الأعمال المميزة؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'الأعمال المميزة هي الأنشطة التجارية التي اشتركت في باقات مدفوعة للحصول على ظهور أفضل في نتائج البحث وميزات إضافية مثل عرض الصور والمعلومات التفصيلية.',
        },
      },
      {
        '@type': 'Question',
        name: 'كيف يمكنني الاتصال بنشاط تجاري؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'انقر على بطاقة النشاط التجاري لعرض التفاصيل الكاملة بما في ذلك رقم الهاتف، الواتساب، البريد الإلكتروني، والموقع الإلكتروني إن وجد.',
        },
      },
      {
        '@type': 'Question',
        name: 'هل يمكنني ترك تقييم للأعمال؟',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'نعم، يمكنك ترك تقييم ومراجعة للأنشطة التجارية بعد تسجيل الدخول. التقييمات تساعد المستخدمين الآخرين في اتخاذ قرارات مستنيرة.',
        },
      },
    ],
  };
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  
  // Build prev/next URLs for link tags
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenpages.lb';
  const params = new URLSearchParams();
  if (searchParams.query) params.set('query', searchParams.query);
  if (searchParams.categoryId) params.set('categoryId', searchParams.categoryId);
  if (searchParams.governorateId) params.set('governorateId', searchParams.governorateId);
  if (searchParams.cityId) params.set('cityId', searchParams.cityId);
  if (searchParams.districtId) params.set('districtId', searchParams.districtId);
  if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy);
  
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page + 1;
  
  const prevParams = new URLSearchParams(params);
  const nextParams = new URLSearchParams(params);
  
  if (prevPage) {
    if (prevPage > 1) {
      prevParams.set('page', prevPage.toString());
    }
  }
  nextParams.set('page', nextPage.toString());
  
  const prevUrl = prevPage ? `${baseUrl}/search?${prevParams.toString()}` : null;
  const nextUrl = `${baseUrl}/search?${nextParams.toString()}`;
  
  const breadcrumbData = generateSearchBreadcrumbData(searchParams.query);
  const faqData = generateSearchFAQSchema();
  
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqData),
        }}
      />
      
      {/* SEO: Pagination links */}
      {prevUrl && (
        <link rel="prev" href={prevUrl} />
      )}
      <link rel="next" href={nextUrl} />
      
      <div className="min-h-screen bg-gray-50">
        {/* Search Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              البحث في الدليل
            </h1>
            <Suspense fallback={<div className="h-12 bg-gray-100 rounded animate-pulse" />}>
              <SearchForm initialQuery={searchParams.query} />
            </Suspense>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
                <h2 className="text-lg font-semibold mb-4">تصفية النتائج</h2>
                <Suspense fallback={<div className="space-y-4">
                  <div className="h-10 bg-gray-100 rounded animate-pulse" />
                  <div className="h-10 bg-gray-100 rounded animate-pulse" />
                  <div className="h-10 bg-gray-100 rounded animate-pulse" />
                </div>}>
                  <SearchFilters
                    categoryId={searchParams.categoryId}
                    governorateId={searchParams.governorateId}
                    cityId={searchParams.cityId}
                    districtId={searchParams.districtId}
                    sortBy={searchParams.sortBy}
                  />
                </Suspense>
              </div>
            </aside>

            {/* Results */}
            <main className="lg:col-span-3">
              <Suspense fallback={
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <article key={i} className="bg-white rounded-lg shadow-sm p-6 h-48 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </article>
                  ))}
                </div>
              }>
                <SearchResults
                  query={searchParams.query}
                  categoryId={searchParams.categoryId}
                  governorateId={searchParams.governorateId}
                  cityId={searchParams.cityId}
                  districtId={searchParams.districtId}
                  sortBy={searchParams.sortBy}
                  page={searchParams.page ? parseInt(searchParams.page) : 1}
                />
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
