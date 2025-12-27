import { Metadata } from 'next';
import { headers } from 'next/headers';
import { HeroBlock } from '@/components/blocks';
import { AdBanner } from '@/components/ads';
import { apiClient } from '@/lib/api-client';
import { Block, Ad } from '@/types';

export const metadata: Metadata = {
  title: 'الصفحة الرئيسية',
  description: 'دليل رسمي موثوق للأنشطة التجارية والخدمية في لبنان',
  alternates: {
    canonical: '/',
    languages: {
      'ar': '/ar',
      'en': '/en',
    },
  },
};

// ISR: Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

// Helper function to detect locale from headers
async function getLocale(): Promise<string> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Check if Arabic is preferred
  if (acceptLanguage.includes('ar')) {
    return 'ar';
  }
  
  // Default to Arabic (primary language)
  return 'ar';
}

// Generate Organization and WebSite structured data
function generateHomeStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'الصفحات الخضراء | Green Pages',
    alternateName: 'Green Pages Lebanon',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'دليل رسمي موثوق للأنشطة التجارية والخدمية في لبنان',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'LB',
    },
    sameAs: [
      // Add social media links when available
      // 'https://facebook.com/greenpages',
      // 'https://twitter.com/greenpages',
      // 'https://instagram.com/greenpages',
    ],
  };
  
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'الصفحات الخضراء | Green Pages',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?query={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  
  return { organizationData, websiteData };
}

export default async function HomePage() {
  const locale = await getLocale();
  
  // Fetch hero block from API
  let heroBlock: Block | null = null;
  let heroAds: Ad[] = [];
  
  try {
    const response = await apiClient.getBlock('HOME_HERO', 'WEB_DIRECTORY');
    heroBlock = response as Block;
  } catch (error) {
    console.error('Failed to fetch hero block:', error);
  }
  
  // Fetch hero ads
  try {
    const adsResponse = await apiClient.getAdsForPlacement(
      'HOME_HERO',
      {
        deviceType: 'desktop', // TODO: Detect device type
      },
      locale
    );
    heroAds = (adsResponse as Ad[]) || [];
  } catch (error) {
    console.error('Failed to fetch hero ads:', error);
  }
  
  const { organizationData, websiteData } = generateHomeStructuredData();

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData),
        }}
      />
      
      <HeroBlock block={heroBlock} locale={locale} />
      
      {/* Hero Ads Section */}
      {heroAds.length > 0 && (
        <section className="py-6 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heroAds.slice(0, 3).map((ad) => (
                <AdBanner key={ad.id} ad={ad} />
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Featured Categories Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {locale === 'ar' ? 'التصنيفات الشائعة' : 'Popular Categories'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Category cards will be added in future tasks */}
            <div className="text-center text-gray-500 col-span-full py-8">
              {locale === 'ar' ? 'التصنيفات قريباً...' : 'Categories coming soon...'}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {locale === 'ar' ? 'الأعمال المميزة' : 'Featured Businesses'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Business cards will be added in future tasks */}
            <div className="text-center text-gray-500 col-span-full py-8">
              {locale === 'ar' ? 'الأعمال قريباً...' : 'Businesses coming soon...'}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
