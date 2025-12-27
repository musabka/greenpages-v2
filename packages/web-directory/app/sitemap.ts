import { MetadataRoute } from 'next';
import { apiClient } from '@/lib/api-client';

// Make sitemap dynamic to avoid build-time API calls
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar`,
          en: `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar/search`,
          en: `${baseUrl}/en/search`,
        },
      },
    },
  ];

  // Fetch businesses for dynamic pages
  let businessPages: MetadataRoute.Sitemap = [];
  try {
    // Fetch all businesses (paginated)
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 10) { // Limit to 10 pages (1000 businesses)
      const response = await apiClient.searchBusinesses({
        page,
        limit: 100,
        locale: 'ar',
      }) as any;
      
      const businesses = response.data.map((business: any) => ({
        url: `${baseUrl}/business/${business.slug}`,
        lastModified: new Date(business.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: business.isFeatured ? 0.9 : 0.7,
        alternates: {
          languages: {
            ar: `${baseUrl}/ar/business/${business.slug}`,
            en: `${baseUrl}/en/business/${business.slug}`,
          },
        },
      }));
      
      businessPages = [...businessPages, ...businesses];
      
      // Check if there are more pages
      hasMore = response.meta.page < response.meta.totalPages;
      page++;
    }
  } catch (error) {
    console.error('Error fetching businesses for sitemap:', error);
  }

  // Fetch categories for dynamic pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await apiClient.getCategories('ar') as any[];
    
    categoryPages = categories.map((category: any) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar/category/${category.slug}`,
          en: `${baseUrl}/en/category/${category.slug}`,
        },
      },
    }));
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  // Fetch governorates for location pages
  let locationPages: MetadataRoute.Sitemap = [];
  try {
    const governorates = await apiClient.getGovernorates('ar') as any[];
    
    // Add governorate pages
    const governoratePages = governorates.map((gov: any) => ({
      url: `${baseUrl}/location/${gov.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: {
        languages: {
          ar: `${baseUrl}/ar/location/${gov.slug}`,
          en: `${baseUrl}/en/location/${gov.slug}`,
        },
      },
    }));
    
    locationPages = [...locationPages, ...governoratePages];
    
    // Add city pages (if cities are available)
    for (const gov of governorates) {
      if (gov.cities && gov.cities.length > 0) {
        const cityPages = gov.cities.map((city: any) => ({
          url: `${baseUrl}/location/${gov.slug}/${city.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
          alternates: {
            languages: {
              ar: `${baseUrl}/ar/location/${gov.slug}/${city.slug}`,
              en: `${baseUrl}/en/location/${gov.slug}/${city.slug}`,
            },
          },
        }));
        
        locationPages = [...locationPages, ...cityPages];
      }
    }
  } catch (error) {
    console.error('Error fetching locations for sitemap:', error);
  }

  return [...staticPages, ...businessPages, ...categoryPages, ...locationPages];
}
