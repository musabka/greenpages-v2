import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/api-client';
import { Business } from '@/types';
import { BusinessProfile } from '@/components/business/BusinessProfile';

// ISR: Revalidate every 1 hour (3600 seconds)
export const revalidate = 3600;

interface PageProps {
  params: {
    slug: string;
  };
}

// Helper function to detect locale from headers
async function getLocale(): Promise<string> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  if (acceptLanguage.includes('ar')) {
    return 'ar';
  }
  
  return 'ar';
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await getLocale();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    const business = await apiClient.getBusinessBySlug(params.slug, locale) as Business;
    
    const title = business.metaTitle || `${business.name} - ${business.category.name}`;
    const description = business.metaDescription || business.description || 
      `${business.name} في ${business.district.name}. ${business.category.name}`;
    
    const canonicalUrl = `${baseUrl}/business/${business.slug}`;
    const imageUrl = business.images.length > 0 ? business.images[0].url : undefined;
    
    return {
      title,
      description,
      keywords: [
        business.name,
        business.category.name,
        business.district.name,
        business.district.city?.name || '',
        business.district.city?.governorate?.name || '',
        'دليل',
        'أعمال',
      ].filter(Boolean),
      alternates: {
        canonical: canonicalUrl,
        languages: {
          'ar': `${baseUrl}/ar/business/${business.slug}`,
          'en': `${baseUrl}/en/business/${business.slug}`,
        },
      },
      openGraph: {
        title,
        description,
        type: 'website',
        locale: locale === 'ar' ? 'ar_LB' : 'en_US',
        alternateLocale: locale === 'ar' ? ['en_US'] : ['ar_LB'],
        url: canonicalUrl,
        siteName: 'الصفحات الخضراء | Green Pages',
        images: imageUrl ? [{
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: business.name,
        }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    return {
      title: 'Business Not Found',
      description: 'The requested business could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

// Generate JSON-LD structured data for LocalBusiness
function generateBusinessStructuredData(business: Business, locale: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const structuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/business/${business.slug}`,
    name: business.name,
    description: business.description,
    url: `${baseUrl}/business/${business.slug}`,
    telephone: business.phone,
    email: business.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: business.district.name,
      addressRegion: business.district.city?.name,
      addressCountry: 'LB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.lat,
      longitude: business.lng,
    },
  };
  
  // Add images
  if (business.images.length > 0) {
    structuredData.image = business.images.map(img => img.url);
  }
  
  // Add rating if available
  if (business.reviewCount > 0) {
    structuredData.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: business.avgRating,
      reviewCount: business.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }
  
  // Add opening hours if available
  if (business.workingHours) {
    const dayMap: Record<string, string> = {
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday',
      sun: 'Sunday',
    };
    
    const openingHours: string[] = [];
    Object.entries(business.workingHours).forEach(([day, hours]) => {
      if (hours && hours.open && hours.close) {
        openingHours.push(`${dayMap[day]} ${hours.open}-${hours.close}`);
      }
    });
    
    if (openingHours.length > 0) {
      structuredData.openingHoursSpecification = openingHours.map(spec => {
        const [dayOfWeek, times] = spec.split(' ');
        const [opens, closes] = times.split('-');
        return {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek,
          opens,
          closes,
        };
      });
    }
  }
  
  return structuredData;
}

// Generate BreadcrumbList structured data
function generateBreadcrumbStructuredData(business: Business) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الصفحة الرئيسية',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: business.category.name,
        item: `${baseUrl}/category/${business.category.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: business.name,
        item: `${baseUrl}/business/${business.slug}`,
      },
    ],
  };
}

// Generate Review schema for businesses with multiple reviews
async function generateReviewsStructuredData(business: Business, locale: string) {
  // Only generate if business has 3+ reviews
  if (business.reviewCount < 3) {
    return null;
  }
  
  try {
    // Fetch recent reviews
    const reviewsResponse = await apiClient.getBusinessReviews(
      business.id,
      1,
      5, // Get top 5 reviews
      locale
    ) as any;
    
    if (!reviewsResponse.data || reviewsResponse.data.length === 0) {
      return null;
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: reviewsResponse.data.map((review: any, index: number) => ({
        '@type': 'Review',
        position: index + 1,
        author: {
          '@type': 'Person',
          name: review.user?.name || 'مستخدم',
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: review.text,
        datePublished: review.createdAt,
        itemReviewed: {
          '@type': 'LocalBusiness',
          name: business.name,
          url: `${baseUrl}/business/${business.slug}`,
        },
      })),
    };
  } catch (error) {
    console.error('Error fetching reviews for schema:', error);
    return null;
  }
}

export default async function BusinessPage({ params }: PageProps) {
  const locale = await getLocale();
  
  let business: Business;
  
  try {
    business = await apiClient.getBusinessBySlug(params.slug, locale) as Business;
  } catch (error) {
    notFound();
  }
  
  const businessStructuredData = generateBusinessStructuredData(business, locale);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(business);
  const reviewsStructuredData = await generateReviewsStructuredData(business, locale);
  
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(businessStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      {reviewsStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(reviewsStructuredData),
          }}
        />
      )}
      
      <BusinessProfile business={business} locale={locale} />
    </>
  );
}
