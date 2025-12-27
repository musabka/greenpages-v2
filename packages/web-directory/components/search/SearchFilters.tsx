'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Category, Governorate, City, District } from '@/types';

interface SearchFiltersProps {
  categoryId?: string;
  governorateId?: string;
  cityId?: string;
  districtId?: string;
  sortBy?: string;
}

export function SearchFilters({
  categoryId,
  governorateId,
  cityId,
  districtId,
  sortBy,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoriesData, governoratesData] = await Promise.all([
          apiClient.getCategories('ar'),
          apiClient.getGovernorates('ar'),
        ]);
        
        setCategories(categoriesData as Category[]);
        setGovernorates(governoratesData as Governorate[]);
      } catch (error) {
        console.error('Failed to load filters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilters();
  }, []);

  // Check for geolocation availability
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setHasLocation(true);
    }
  }, []);

  // Load cities when governorate changes
  useEffect(() => {
    if (governorateId) {
      // In a real implementation, fetch cities for the selected governorate
      // For now, we'll leave this empty as the API endpoint needs to be checked
      setCities([]);
      setDistricts([]);
    } else {
      setCities([]);
      setDistricts([]);
    }
  }, [governorateId]);

  // Load districts when city changes
  useEffect(() => {
    if (cityId) {
      // In a real implementation, fetch districts for the selected city
      setDistricts([]);
    } else {
      setDistricts([]);
    }
  }, [cityId]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset dependent filters
    if (key === 'governorateId') {
      params.delete('cityId');
      params.delete('districtId');
    } else if (key === 'cityId') {
      params.delete('districtId');
    }
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    router.push(`/search?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort By */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ترتيب حسب
        </label>
        <select
          value={sortBy || 'newest'}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="newest">الأحدث</option>
          <option value="featured">المميزة</option>
          <option value="rating">الأعلى تقييماً</option>
          {hasLocation && (
            <option value="nearest">الأقرب (يتطلب الموقع)</option>
          )}
        </select>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الفئة
        </label>
        <select
          value={categoryId || ''}
          onChange={(e) => updateFilter('categoryId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">جميع الفئات</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Governorate Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          المحافظة
        </label>
        <select
          value={governorateId || ''}
          onChange={(e) => updateFilter('governorateId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">جميع المحافظات</option>
          {governorates.map((gov) => (
            <option key={gov.id} value={gov.id}>
              {gov.name}
            </option>
          ))}
        </select>
      </div>

      {/* City Filter - Only show if governorate is selected */}
      {governorateId && cities.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            المدينة
          </label>
          <select
            value={cityId || ''}
            onChange={(e) => updateFilter('cityId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">جميع المدن</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* District Filter - Only show if city is selected */}
      {cityId && districts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الحي
          </label>
          <select
            value={districtId || ''}
            onChange={(e) => updateFilter('districtId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">جميع الأحياء</option>
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Clear Filters Button */}
      {(categoryId || governorateId || cityId || districtId || sortBy) && (
        <button
          onClick={() => router.push('/search')}
          className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          مسح جميع الفلاتر
        </button>
      )}
    </div>
  );
}
