import Link from 'next/link';
import type { BusinessCard as BusinessCardType } from '@/types';

interface BusinessCardProps {
  business: BusinessCardType;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const {
    slug,
    name,
    description,
    address,
    phone,
    avgRating,
    reviewCount,
    isFeatured,
    isVerified,
    category,
    district,
    primaryImage,
    distance,
  } = business;

  return (
    <Link
      href={`/business/${slug}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-48 h-48 md:h-auto bg-gray-200 flex-shrink-0">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16"
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
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  {name}
                </h3>
                {isVerified && (
                  <span className="text-blue-500" title="موثق">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
                {isFeatured && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                    مميز
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600">{category.name}</p>
            </div>

            {/* Rating */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-yellow-500">★</span>
                <span className="font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-gray-500">({reviewCount})</span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {description}
            </p>
          )}

          {/* Location & Contact */}
          <div className="space-y-1 text-sm text-gray-600">
            {address && (
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{address}, {district.name}</span>
              </div>
            )}
            
            {phone && (
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span dir="ltr">{phone}</span>
              </div>
            )}

            {distance !== undefined && (
              <div className="flex items-center gap-2 text-green-600">
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span>
                  {distance < 1000
                    ? `${Math.round(distance)} م`
                    : `${(distance / 1000).toFixed(1)} كم`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
