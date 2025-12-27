'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BusinessImage } from '@/types';

interface BusinessGalleryProps {
  images: BusinessImage[];
  businessName: string;
}

export function BusinessGallery({ images, businessName }: BusinessGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  
  if (images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg
            className="w-24 h-24 mx-auto mb-4"
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
          <p className="text-lg">لا توجد صور</p>
        </div>
      </div>
    );
  }
  
  const mainImage = images[selectedIndex];
  
  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div 
          className="relative w-full h-96 md:h-[500px] bg-gray-200 rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => setShowLightbox(true)}
        >
          <Image
            src={mainImage.url}
            alt={`${businessName} - صورة ${selectedIndex + 1}`}
            fill
            priority={selectedIndex === 0}
            loading={selectedIndex === 0 ? undefined : 'lazy'}
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </div>
        </div>
        
        {/* Thumbnail Grid */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={`relative h-20 md:h-24 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <Image
                  src={image.url}
                  alt={`${businessName} - صورة مصغرة ${index + 1}`}
                  fill
                  loading="lazy"
                  className="object-cover"
                  sizes="(max-width: 768px) 25vw, 150px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Lightbox */}
      {showLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            onClick={() => setShowLightbox(false)}
            aria-label="إغلاق"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          
          {/* Previous Button */}
          {selectedIndex > 0 && (
            <button
              className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex - 1);
              }}
              aria-label="السابق"
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          
          {/* Image */}
          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={mainImage.url}
              alt={`${businessName} - صورة ${selectedIndex + 1}`}
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
              priority
            />
          </div>
          
          {/* Next Button */}
          {selectedIndex < images.length - 1 && (
            <button
              className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(selectedIndex + 1);
              }}
              aria-label="التالي"
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
          
          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-lg bg-black bg-opacity-50 px-4 py-2 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
