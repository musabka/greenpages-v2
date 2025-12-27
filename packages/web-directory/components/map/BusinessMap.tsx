'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { BusinessCard } from '@/types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icon for featured businesses
const featuredIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom icon for verified businesses
const verifiedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface BusinessMapProps {
  businesses: BusinessCard[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (business: BusinessCard) => void;
}

// Component to fit map bounds to markers
function MapBounds({ businesses }: { businesses: BusinessCard[] }) {
  const map = useMap();

  useEffect(() => {
    if (businesses.length === 0) {
      // No businesses: do nothing
      return;
    } else if (businesses.length === 1) {
      // Single business: use setView with reasonable zoom instead of fitBounds
      const business = businesses[0];
      map.setView([business.lat, business.lng], 15, { animate: true });
    } else {
      // Multiple businesses: fit bounds with padding
      const bounds = L.latLngBounds(
        businesses.map((b) => [b.lat, b.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [businesses, map]);

  return null;
}

export function BusinessMap({
  businesses,
  center = [33.8886, 35.4955], // Default: Beirut, Lebanon
  zoom = 10,
  height = '500px',
  onMarkerClick,
}: BusinessMapProps) {
  const [mounted, setMounted] = useState(false);

  // Only render map on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-gray-500">جاري تحميل الخريطة...</div>
      </div>
    );
  }

  // If no businesses, show empty state
  if (businesses.length === 0) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🗺️</div>
          <p className="text-gray-600">لا توجد نتائج لعرضها على الخريطة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-sm border border-gray-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Free tile provider: OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds to show all markers */}
        <MapBounds businesses={businesses} />

        {/* Business markers */}
        {businesses.map((business) => {
          // Choose icon based on business status
          let icon = undefined;
          if (business.isFeatured) {
            icon = featuredIcon;
          } else if (business.isVerified) {
            icon = verifiedIcon;
          }

          return (
            <Marker
              key={business.id}
              position={[business.lat, business.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(business);
                  }
                },
              }}
            >
              <Popup maxWidth={280} minWidth={200}>
                <div className="min-w-[200px] max-w-[280px]" dir="rtl">
                  {/* Business Name with Badges */}
                  <h3 className="font-semibold text-base mb-1 flex items-center gap-1 flex-wrap break-words">
                    <span className="break-words">{business.name}</span>
                    {business.isVerified && (
                      <span className="text-green-600 flex-shrink-0" title="موثق">
                        ✓
                      </span>
                    )}
                    {business.isFeatured && (
                      <span className="text-yellow-600 flex-shrink-0" title="مميز">
                        ⭐
                      </span>
                    )}
                  </h3>
                  
                  {/* Category */}
                  <p className="text-sm text-gray-600 mb-2 break-words">
                    {business.category.name}
                  </p>

                  {/* Address - sanitized text only */}
                  {business.address && (
                    <p className="text-xs text-gray-500 mb-2 break-words line-clamp-2">
                      📍 {business.address}
                    </p>
                  )}

                  {/* Phone - sanitized text only */}
                  {business.phone && (
                    <p className="text-xs text-gray-700 mb-2 break-words" dir="ltr">
                      📞 {business.phone}
                    </p>
                  )}

                  {/* Rating */}
                  {business.avgRating > 0 && (
                    <div className="flex items-center gap-1 text-xs mb-3">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-medium">{business.avgRating.toFixed(1)}</span>
                      <span className="text-gray-500">({business.reviewCount})</span>
                    </div>
                  )}

                  {/* View Details Link - safe navigation */}
                  <a
                    href={`/business/${encodeURIComponent(business.slug)}`}
                    className="inline-block text-xs bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors tap-target"
                    onClick={(e) => {
                      // Ensure link is clickable and not blocked by popup
                      e.stopPropagation();
                    }}
                  >
                    عرض التفاصيل
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
