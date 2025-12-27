'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Ad } from '@/types';

interface ProfileSidebarAdProps {
  ad: Ad;
}

export function ProfileSidebarAd({ ad }: ProfileSidebarAdProps) {
  useEffect(() => {
    // Record impression when ad is displayed
    const recordImpression = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/ads/${ad.id}/impression`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to record ad impression:', error);
      }
    };

    recordImpression();
  }, [ad.id]);

  const handleClick = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/ads/${ad.id}/click`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to record ad click:', error);
    }
  };

  const { business } = ad;

  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      {/* Ad Label */}
      <div className="bg-yellow-400 text-gray-900 text-xs font-semibold px-3 py-1 text-center">
        إعلان
      </div>

      <Link
        href={`/business/${business.slug}`}
        onClick={handleClick}
        className="block"
      >
        {/* Image */}
        {business.primaryImage ? (
          <div className="relative h-40 w-full overflow-hidden bg-gray-200">
            <img
              src={business.primaryImage}
              alt={business.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
            {business.name}
          </h3>

          {business.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {business.description}
            </p>
          )}

          {/* Category */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="truncate">{business.category.name}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="truncate">{business.district.name}</span>
          </div>

          {/* Rating */}
          {business.avgRating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(business.avgRating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-600">
                ({business.reviewCount})
              </span>
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="bg-green-600 text-white text-center py-2 rounded-md hover:bg-green-700 transition-colors font-medium text-sm">
              عرض التفاصيل
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
