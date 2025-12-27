'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Ad } from '@/types';

interface SponsoredBusinessCardProps {
  ad: Ad;
}

export function SponsoredBusinessCard({ ad }: SponsoredBusinessCardProps) {
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
    <div className="relative">
      {/* Sponsored Label */}
      <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-semibold px-2 py-1 rounded z-10">
        مُعلن
      </div>

      <Link
        href={`/business/${business.slug}`}
        onClick={handleClick}
        className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border-2 border-yellow-200"
      >
        {/* Image */}
        {business.primaryImage ? (
          <div className="relative h-48 w-full overflow-hidden bg-gray-200">
            <img
              src={business.primaryImage}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
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
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
            {business.name}
          </h3>

          {business.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {business.description}
            </p>
          )}

          {/* Category & Location */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="truncate">{business.category.name}</span>
          </div>

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
            <div className="flex items-center gap-2">
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
              <span className="text-sm text-gray-600">
                ({business.reviewCount})
              </span>
            </div>
          )}

          {/* Phone */}
          {business.phone && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="font-medium">{business.phone}</span>
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
