/**
 * Application constants
 */

export const SITE_CONFIG = {
  name: {
    ar: 'الصفحات الخضراء',
    en: 'Green Pages',
  },
  description: {
    ar: 'دليل رسمي موثوق للأنشطة التجارية والخدمية',
    en: 'Official trusted directory for businesses and services',
  },
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const;

export const MAP_CONFIG = {
  defaultCenter: {
    lat: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_CENTER_LAT) || 33.8869,
    lng: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_CENTER_LNG) || 35.5131,
  },
  defaultZoom: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM) || 8,
  tileLayer: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
} as const;

export const ISR_REVALIDATE = {
  business: Number(process.env.NEXT_PUBLIC_ISR_REVALIDATE_BUSINESS) || 3600,
  category: Number(process.env.NEXT_PUBLIC_ISR_REVALIDATE_CATEGORY) || 7200,
  home: Number(process.env.NEXT_PUBLIC_ISR_REVALIDATE_HOME) || 300,
} as const;

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
} as const;

export const SEARCH_CONFIG = {
  minQueryLength: 2,
  debounceMs: 300,
  defaultRadius: 10, // km
  maxRadius: 50, // km
} as const;

export const LOCALES = {
  ar: {
    code: 'ar',
    name: 'العربية',
    dir: 'rtl',
  },
  en: {
    code: 'en',
    name: 'English',
    dir: 'ltr',
  },
} as const;

export const RATING_CONFIG = {
  min: 1,
  max: 5,
  step: 1,
} as const;

export const AD_LABELS = {
  ar: 'إعلان',
  en: 'Ad',
} as const;
