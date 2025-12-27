'use client';

import { useState, useEffect } from 'react';
import { Review } from '@/types';

interface BusinessReviewsProps {
  businessId: string;
  locale: string;
}

interface PaginatedReviews {
  data: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function BusinessReviews({ businessId, locale }: BusinessReviewsProps) {
  const [reviews, setReviews] = useState<PaginatedReviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    fetchReviews(currentPage);
  }, [businessId, currentPage]);
  
  const fetchReviews = async (page: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(
        `${API_BASE_URL}/reviews/business?businessId=${businessId}&page=${page}&limit=10`,
        {
          headers: {
            'Accept-Language': locale,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      setError(locale === 'ar' ? 'فشل تحميل التقييمات' : 'Failed to load reviews');
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !reviews) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">
          {locale === 'ar' ? 'التقييمات' : 'Reviews'}
        </h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">
          {locale === 'ar' ? 'التقييمات' : 'Reviews'}
        </h2>
        <div className="text-center py-8 text-red-600">{error}</div>
      </div>
    );
  }
  
  if (!reviews || reviews.data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">
          {locale === 'ar' ? 'التقييمات' : 'Reviews'}
        </h2>
        <div className="text-center py-8 text-gray-500">
          {locale === 'ar' ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6">
        {locale === 'ar' ? 'التقييمات' : 'Reviews'} ({reviews.total})
      </h2>
      
      <div className="space-y-6">
        {reviews.data.map((review) => (
          <div key={review.id} className="border-b pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* User Avatar Placeholder */}
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                
                <div>
                  <p className="font-medium text-gray-900">
                    {review.user?.name || (locale === 'ar' ? 'مستخدم' : 'User')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString(
                      locale === 'ar' ? 'ar-LB' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </p>
                </div>
              </div>
              
              {/* Rating Stars */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            
            {/* Review Text */}
            {review.text && (
              <p className="text-gray-700 leading-relaxed">{review.text}</p>
            )}
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {reviews.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8 pt-6 border-t">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locale === 'ar' ? 'السابق' : 'Previous'}
          </button>
          
          <span className="px-4 py-2 text-gray-700">
            {locale === 'ar' 
              ? `صفحة ${currentPage} من ${reviews.totalPages}`
              : `Page ${currentPage} of ${reviews.totalPages}`
            }
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === reviews.totalPages}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locale === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
