'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Ad } from '@/types';

interface AdBannerProps {
  ad: Ad;
  className?: string;
}

export function AdBanner({ ad, className = '' }: AdBannerProps) {
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

  return (
    <div className={`relative ${className}`}>
      {/* Ad Label */}
      <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-semibold px-2 py-1 rounded z-10">
        إعلان
      </div>

      <Link
        href={`/business/${ad.business.slug}`}
        onClick={handleClick}
        className="block"
      >
        <div className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            {ad.business.primaryImage && (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                <img
                  src={ad.business.primaryImage}
                  alt={ad.business.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                {ad.business.name}
              </h3>
              {ad.business.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {ad.business.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {ad.business.district.name}
                </span>
                {ad.business.category && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    {ad.business.category.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
