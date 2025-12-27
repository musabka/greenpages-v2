/**
 * API Client for Web Directory
 * 
 * This client is designed for Server Components (SSR/ISR).
 * For Client Components, create a separate client with different caching strategy.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
  locale?: string;
  revalidate?: number | false;
  tags?: string[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { locale = 'ar', revalidate, tags, ...fetchOptions } = options;

    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept-Language': locale,
      ...fetchOptions.headers,
    };

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      next: {
        revalidate,
        tags,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Business endpoints
  async getBusinessById(id: string, locale: string = 'ar') {
    return this.request(`/businesses/${id}`, {
      locale,
      revalidate: 3600, // 1 hour
      tags: [`business-${id}`],
    });
  }

  async getBusinessBySlug(slug: string, locale: string = 'ar') {
    return this.request(`/businesses/slug/${slug}`, {
      locale,
      revalidate: 3600, // 1 hour
      tags: [`business-slug-${slug}`],
    });
  }

  async searchBusinesses(params: {
    query?: string;
    categoryId?: string;
    governorateId?: string;
    cityId?: string;
    districtId?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    sortBy?: 'nearest' | 'newest' | 'featured' | 'rating';
    page?: number;
    limit?: number;
    locale?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    return this.request(`/businesses/search?${searchParams.toString()}`, {
      locale: params.locale,
      revalidate: 0, // Always fresh for search results (SSR)
    });
  }

  // Category endpoints
  async getCategories(locale: string = 'ar') {
    return this.request('/categories', {
      locale,
      revalidate: 7200, // 2 hours
      tags: ['categories'],
    });
  }

  async getCategoryBySlug(slug: string, locale: string = 'ar') {
    return this.request(`/categories/slug/${slug}`, {
      locale,
      revalidate: 7200, // 2 hours
      tags: [`category-${slug}`],
    });
  }

  // Geographic endpoints
  async getGeoHierarchy(locale: string = 'ar') {
    return this.request('/geo/hierarchy', {
      locale,
      revalidate: 86400, // 24 hours
      tags: ['geo-hierarchy'],
    });
  }

  async getGovernorates(locale: string = 'ar') {
    return this.request('/geo/governorates', {
      locale,
      revalidate: 86400, // 24 hours
      tags: ['governorates'],
    });
  }

  // Reviews endpoints
  async getBusinessReviews(
    businessId: string,
    page: number = 1,
    limit: number = 10,
    locale: string = 'ar'
  ) {
    return this.request(
      `/reviews/business?businessId=${businessId}&page=${page}&limit=${limit}`,
      {
        locale,
        revalidate: 300, // 5 minutes
        tags: [`reviews-${businessId}`],
      }
    );
  }

  async createReview(
    businessId: string,
    rating: number,
    text: string | undefined,
    token: string,
    locale: string = 'ar'
  ) {
    return this.request('/reviews', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ businessId, rating, text }),
      locale,
      revalidate: 0,
    });
  }

  // Ads endpoints
  async getAdsForPlacement(
    placement: string,
    context: {
      governorateId?: string;
      cityId?: string;
      districtId?: string;
      categoryId?: string;
      deviceType: 'mobile' | 'tablet' | 'desktop';
    },
    locale: string = 'ar'
  ) {
    const searchParams = new URLSearchParams();
    searchParams.append('placement', placement);
    searchParams.append('deviceType', context.deviceType);
    
    if (context.governorateId) searchParams.append('governorateId', context.governorateId);
    if (context.cityId) searchParams.append('cityId', context.cityId);
    if (context.districtId) searchParams.append('districtId', context.districtId);
    if (context.categoryId) searchParams.append('categoryId', context.categoryId);

    return this.request(`/ads/placement?${searchParams.toString()}`, {
      locale,
      revalidate: 0, // Always fresh for ads
    });
  }

  // Settings endpoints
  async getFeatureToggles() {
    return this.request('/settings/toggles', {
      revalidate: 300, // 5 minutes
      tags: ['feature-toggles'],
    });
  }

  async getBlock(type: string, target: string = 'WEB_DIRECTORY') {
    return this.request(`/settings/blocks/${type}/${target}`, {
      revalidate: 300, // 5 minutes
      tags: [`block-${type}-${target}`],
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
