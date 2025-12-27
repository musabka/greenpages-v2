/**
 * Type definitions for Web Directory
 * 
 * These types should match the API responses from the backend.
 * Consider moving shared types to @green-pages/shared package.
 */

export interface Business {
  id: string;
  slug: string;
  name: string;
  description?: string;
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  phone2?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  workingHours?: WorkingHours;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  metaTitle?: string;
  metaDescription?: string;
  category: Category;
  district: District;
  images: BusinessImage[];
  subscription?: Subscription;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCard {
  id: string;
  slug: string;
  name: string;
  description?: string;
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  avgRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isVerified: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  district: {
    id: string;
    name: string;
  };
  primaryImage?: string;
  distance?: number;
}

export interface BusinessImage {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  parentId?: string;
  parent?: Category;
  children?: Category[];
}

export interface Governorate {
  id: string;
  slug: string;
  name: string;
  lat?: number;
  lng?: number;
}

export interface City {
  id: string;
  slug: string;
  name: string;
  lat?: number;
  lng?: number;
  governorateId: string;
  governorate?: Governorate;
}

export interface District {
  id: string;
  slug: string;
  name: string;
  lat?: number;
  lng?: number;
  cityId: string;
  city?: City;
}

export interface WorkingHours {
  [day: string]: {
    open: string;
    close: string;
  };
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  features: PlanFeature[];
}

export interface PlanFeature {
  key: string;
  value: string | number | boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  plan: Plan;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Review {
  id: string;
  rating: number;
  text?: string;
  user: {
    id: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Ad {
  id: string;
  campaignId: string;
  placement: AdPlacement;
  governorateId: string | null;
  cityId: string | null;
  districtId: string | null;
  categoryId: string | null;
  activeHoursStart: number | null;
  activeHoursEnd: number | null;
  impressions: number;
  clicks: number;
  isActive: boolean;
  business: BusinessCard;
}

export enum AdPlacement {
  SEARCH_SPONSORED = 'SEARCH_SPONSORED',
  HOME_HERO = 'HOME_HERO',
  CATEGORY_BANNER = 'CATEGORY_BANNER',
  PROFILE_SIDEBAR = 'PROFILE_SIDEBAR',
  MAP_PIN_HIGHLIGHT = 'MAP_PIN_HIGHLIGHT',
  SEARCH_AUTOCOMPLETE = 'SEARCH_AUTOCOMPLETE',
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SearchParams {
  query?: string;
  categoryId?: string;
  governorateId?: string;
  cityId?: string;
  districtId?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sortBy?: 'nearest' | 'newest' | 'featured' | 'rating';
  page?: number;
  limit?: number;
}

export interface FeatureToggle {
  key: string;
  value: boolean;
  description?: string;
}

export interface Block {
  type: BlockType;
  schemaVersion: number;
  settingsJson: any;
  isEnabled: boolean;
}

export enum BlockType {
  HEADER = 'header',
  FOOTER = 'footer',
  HOME_HERO = 'home_hero',
}

export interface GeoHierarchy {
  governorates: Array<
    Governorate & {
      cities: Array<
        City & {
          districts: District[];
        }
      >;
    }
  >;
}
