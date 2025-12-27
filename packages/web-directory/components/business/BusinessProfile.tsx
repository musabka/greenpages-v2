'use client';

import { useState, useEffect } from 'react';
import { Business, Ad } from '@/types';
import { BusinessGallery } from './BusinessGallery';
import { BusinessInfo } from './BusinessInfo';
import { BusinessReviews } from './BusinessReviews';
import { BusinessMap } from '../map/BusinessMap';
import { ReportIssueButton } from './ReportIssueButton';
import { ProfileSidebarAd } from '../ads';

interface BusinessProfileProps {
  business: Business;
  locale: string;
}

export function BusinessProfile({ business, locale }: BusinessProfileProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [sidebarAds, setSidebarAds] = useState<Ad[]>([]);
  
  // Fetch sidebar ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const searchParams = new URLSearchParams();
        searchParams.append('placement', 'PROFILE_SIDEBAR');
        searchParams.append('deviceType', 'desktop'); // TODO: Detect device type
        if (business.district.cityId) searchParams.append('cityId', business.district.cityId);
        if (business.district.city?.governorateId) searchParams.append('governorateId', business.district.city.governorateId);
        if (business.categoryId) searchParams.append('categoryId', business.categoryId);
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/ads/placement?${searchParams.toString()}`
        );
        
        if (response.ok) {
          const ads = await response.json();
          setSidebarAds(ads || []);
        }
      } catch (error) {
        console.error('Failed to fetch sidebar ads:', error);
      }
    };
    
    fetchAds();
  }, [business.id, business.categoryId, business.district.cityId, business.district.city?.governorateId]);
  
  // Check plan features for visibility
  const planFeatures = business.subscription?.plan?.features || [];
  const featureMap = planFeatures.reduce((acc, feature) => {
    acc[feature.key] = feature.value;
    return acc;
  }, {} as Record<string, any>);
  
  const showWhatsApp = featureMap['show_whatsapp'] !== false;
  const showWorkingHours = featureMap['show_working_hours'] !== false;
  const showWebsite = featureMap['show_website'] !== false;
  const showEmail = featureMap['show_email'] !== false;
  const maxImages = parseInt(featureMap['max_images'] || '10', 10);
  
  // Filter images based on plan
  const visibleImages = business.images.slice(0, maxImages);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Images */}
      <section className="bg-white">
        <div className="container mx-auto px-4 py-6">
          <BusinessGallery images={visibleImages} businessName={business.name} />
        </div>
      </section>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {business.name}
                    </h1>
                    {business.isVerified && (
                      <span className="text-blue-500" title={locale === 'ar' ? 'موثق' : 'Verified'}>
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                    {business.isFeatured && (
                      <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        {locale === 'ar' ? 'مميز' : 'Featured'}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-lg text-gray-600 mb-2">{business.category.name}</p>
                  
                  {/* Rating */}
                  {business.reviewCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.round(business.avgRating)
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
                      <span className="text-lg font-semibold">{business.avgRating.toFixed(1)}</span>
                      <span className="text-gray-500">
                        ({business.reviewCount} {locale === 'ar' ? 'تقييم' : 'reviews'})
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Report Issue Button */}
                <ReportIssueButton 
                  businessId={business.id} 
                  businessName={business.name}
                  locale={locale}
                />
              </div>
              
              {/* Description */}
              {business.description && (
                <p className="text-gray-700 leading-relaxed">{business.description}</p>
              )}
            </div>
            
            {/* Business Info */}
            <BusinessInfo 
              business={business}
              locale={locale}
              showWhatsApp={showWhatsApp}
              showWorkingHours={showWorkingHours}
              showWebsite={showWebsite}
              showEmail={showEmail}
            />
            
            {/* Reviews Section */}
            <BusinessReviews 
              businessId={business.id}
              locale={locale}
            />
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-semibold mb-4">
                {locale === 'ar' ? 'الموقع' : 'Location'}
              </h2>
              <div className="h-64 rounded-lg overflow-hidden">
                <BusinessMap
                  businesses={[{
                    id: business.id,
                    slug: business.slug,
                    name: business.name,
                    lat: business.lat,
                    lng: business.lng,
                    category: {
                      id: business.category.id,
                      name: business.category.name,
                      slug: business.category.slug,
                    },
                    district: {
                      id: business.district.id,
                      name: business.district.name,
                    },
                    avgRating: business.avgRating,
                    reviewCount: business.reviewCount,
                    isFeatured: business.isFeatured,
                    isVerified: business.isVerified,
                  }]}
                  center={[business.lat, business.lng]}
                  zoom={15}
                />
              </div>
              {business.address && (
                <p className="mt-3 text-sm text-gray-600">
                  {business.address}, {business.district.name}
                </p>
              )}
            </div>
            
            {/* Sidebar Ads */}
            {sidebarAds.length > 0 && (
              <div className="space-y-4">
                {sidebarAds.slice(0, 2).map((ad) => (
                  <ProfileSidebarAd key={ad.id} ad={ad} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: business.name,
            description: business.description,
            image: visibleImages.map(img => img.url),
            address: {
              '@type': 'PostalAddress',
              addressLocality: business.district.name,
              addressCountry: 'LB',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: business.lat,
              longitude: business.lng,
            },
            telephone: business.phone,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            aggregateRating: business.reviewCount > 0 ? {
              '@type': 'AggregateRating',
              ratingValue: business.avgRating,
              reviewCount: business.reviewCount,
              bestRating: 5,
              worstRating: 1,
            } : undefined,
          }),
        }}
      />
      
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: locale === 'ar' ? 'الرئيسية' : 'Home',
                item: typeof window !== 'undefined' ? window.location.origin : undefined,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: business.category.name,
                item: typeof window !== 'undefined' 
                  ? `${window.location.origin}/category/${business.category.slug}`
                  : undefined,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: business.name,
                item: typeof window !== 'undefined' ? window.location.href : undefined,
              },
            ],
          }),
        }}
      />
    </div>
  );
}
