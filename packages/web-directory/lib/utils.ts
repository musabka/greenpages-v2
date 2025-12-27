import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 8) {
    // Lebanese landline: XX XXX XXX
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})/, '$1 $2 $3');
  } else if (cleaned.length === 10) {
    // Lebanese mobile: XXX XXX XXX
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  return phone;
}

/**
 * Generate WhatsApp link
 */
export function getWhatsAppLink(phone: string, message?: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const baseUrl = 'https://wa.me/';
  const url = `${baseUrl}${cleaned}`;
  
  if (message) {
    return `${url}?text=${encodeURIComponent(message)}`;
  }
  
  return url;
}

/**
 * Format working hours for display
 */
export function formatWorkingHours(hours: Record<string, { open: string; close: string }>): string {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const dayNames: Record<string, string> = {
    mon: 'الإثنين',
    tue: 'الثلاثاء',
    wed: 'الأربعاء',
    thu: 'الخميس',
    fri: 'الجمعة',
    sat: 'السبت',
    sun: 'الأحد',
  };

  return days
    .filter((day) => hours[day])
    .map((day) => {
      const { open, close } = hours[day];
      return `${dayNames[day]}: ${open} - ${close}`;
    })
    .join('\n');
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Generate structured data (JSON-LD) for business
 */
export function generateBusinessStructuredData(business: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    image: business.images?.[0]?.url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.district?.name,
      addressRegion: business.city?.name,
      addressCountry: 'LB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.lat,
      longitude: business.lng,
    },
    telephone: business.phone,
    url: business.website,
    aggregateRating: business.avgRating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: business.avgRating,
      reviewCount: business.reviewCount,
    } : undefined,
    openingHoursSpecification: business.workingHours
      ? Object.entries(business.workingHours).map(([day, hours]: [string, any]) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: day,
          opens: hours.open,
          closes: hours.close,
        }))
      : undefined,
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

/**
 * Get device type from user agent
 */
export function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}
