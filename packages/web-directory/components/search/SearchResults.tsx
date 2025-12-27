'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api-client';
import { BusinessCard } from '@/components/business/BusinessCard';
import { SponsoredBusinessCard } from '@/components/ads';
import { Pagination } from '@/components/search/Pagination';
import type { PaginatedResult, BusinessCard as BusinessCardType, Ad } from '@/types';

// Lazy load map component only when needed (performance optimization)
const BusinessMap = dynamic(
  () => import('@/components/map').then((mod) => mod.BusinessMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: '600px' }}>
        <div className="text-gray-500">جاري تحميل الخريطة...</div>
      </div>
    ),
  }
);

interface SearchResultsProps {
  query?: string;
  categoryId?: string;
  governorateId?: string;
  cityId?: string;
  districtId?: string;
  sortBy?: 'nearest' | 'newest' | 'featured' | 'rating';
  page?: number;
}

// Client component wrapper for view toggle
function SearchResultsClient({
  results,
  sponsoredAds,
  error,
}: {
  results: PaginatedResult<BusinessCardType> | null;
  sponsoredAds: Ad[];
  error: string | null;
}) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-red-600 mb-2">⚠️</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!results || results.data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
        <p className="text-gray-600 mb-4">
          لم نتمكن من العثور على أي نتائج تطابق بحثك.
        </p>
        <p className="text-sm text-gray-500">
          جرب تعديل معايير البحث أو إزالة بعض الفلاتر.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results Header with View Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between flex-wrap gap-4">
        <p className="text-gray-600">
          تم العثور على <span className="font-semibold text-gray-900">{results.meta.total}</span> نتيجة
        </p>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 قائمة
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🗺️ خريطة
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <BusinessMap businesses={results.data} height="600px" />
          <p className="text-xs text-gray-500 mt-2 text-center">
            انقر على العلامات لعرض تفاصيل النشاط التجاري
          </p>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {/* Sponsored Ads - Show at top of first page */}
            {sponsoredAds.length > 0 && (
              <>
                {sponsoredAds.map((ad) => (
                  <SponsoredBusinessCard key={ad.id} ad={ad} />
                ))}
                
                {/* Separator */}
                <div className="border-t-2 border-gray-200 my-2">
                  <p className="text-center text-sm text-gray-500 -mt-3 bg-gray-50 inline-block px-4">
                    النتائج العضوية
                  </p>
                </div>
              </>
            )}

            {/* Regular Results */}
            {results.data.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>

          {/* Pagination */}
          {results.meta.totalPages > 1 && (
            <Pagination
              currentPage={results.meta.page}
              totalPages={results.meta.totalPages}
              total={results.meta.total}
            />
          )}
        </>
      )}
    </div>
  );
}

export async function SearchResults({
  query,
  categoryId,
  governorateId,
  cityId,
  districtId,
  sortBy = 'newest',
  page = 1,
}: SearchResultsProps) {
  let results: PaginatedResult<BusinessCardType> | null = null;
  let sponsoredAds: Ad[] = [];
  let error: string | null = null;

  try {
    // Fetch search results
    const response = await apiClient.searchBusinesses({
      query,
      categoryId,
      governorateId,
      cityId,
      districtId,
      sortBy,
      page,
      limit: 20,
      locale: 'ar',
    });

    results = response as PaginatedResult<BusinessCardType>;

    // Fetch sponsored ads only on first page
    if (page === 1) {
      try {
        const adsResponse = await apiClient.getAdsForPlacement(
          'SEARCH_SPONSORED',
          {
            governorateId,
            cityId,
            districtId,
            categoryId,
            deviceType: 'desktop', // TODO: Detect device type
          },
          'ar'
        );
        sponsoredAds = (adsResponse as Ad[]) || [];
      } catch (adsError) {
        console.error('Failed to fetch sponsored ads:', adsError);
        // Don't fail the whole page if ads fail
      }
    }
  } catch (err) {
    console.error('Search error:', err);
    error = 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.';
  }

  return <SearchResultsClient results={results} sponsoredAds={sponsoredAds} error={error} />;
}
