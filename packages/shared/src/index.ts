// Shared types and contracts for Green Pages

// User Roles
export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  USER = 'USER',
}

// Ad Placements
export enum AdPlacement {
  SEARCH_SPONSORED = 'SEARCH_SPONSORED',
  HOME_HERO = 'HOME_HERO',
  CATEGORY_BANNER = 'CATEGORY_BANNER',
  PROFILE_SIDEBAR = 'PROFILE_SIDEBAR',
  MAP_PIN_HIGHLIGHT = 'MAP_PIN_HIGHLIGHT',
  SEARCH_AUTOCOMPLETE = 'SEARCH_AUTOCOMPLETE',
}

// Collection Types
export enum CollectionType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  AD_PAYMENT = 'AD_PAYMENT',
}

// Review Status
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Reward Actions
export enum RewardAction {
  SUBMIT_REVIEW = 'SUBMIT_REVIEW',
  REPORT_WRONG_PHONE = 'REPORT_WRONG_PHONE',
  REPORT_CLOSED_BUSINESS = 'REPORT_CLOSED_BUSINESS',
  FIRST_REVIEW_OF_DAY = 'FIRST_REVIEW_OF_DAY',
  VERIFIED_REPORT = 'VERIFIED_REPORT',
}

// Report Types
export enum ReportType {
  WRONG_PHONE = 'WRONG_PHONE',
  WRONG_LOCATION = 'WRONG_LOCATION',
  CLOSED_BUSINESS = 'CLOSED_BUSINESS',
  WRONG_INFO = 'WRONG_INFO',
  SPAM = 'SPAM',
}

// Report Status
export enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

// Notification Types
export enum NotificationType {
  SUBSCRIPTION_EXPIRY = 'SUBSCRIPTION_EXPIRY',
  REVIEW_REPLY = 'REVIEW_REPLY',
  REPORT_RESOLVED = 'REPORT_RESOLVED',
  POINTS_EARNED = 'POINTS_EARNED',
  SYSTEM = 'SYSTEM',
}

// App Targets
export enum AppTarget {
  WEB_DIRECTORY = 'WEB_DIRECTORY',
  WEB_ADMIN = 'WEB_ADMIN',
  MOBILE_AGENT = 'MOBILE_AGENT',
  ALL = 'ALL',
}

// Block Types
export enum BlockType {
  HEADER = 'HEADER',
  FOOTER = 'FOOTER',
  HOME_HERO = 'HOME_HERO',
}

// Supported Locales
export const SUPPORTED_LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
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

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path: string;
}

// Token Pair
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Bounding Box for geo queries
export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Working Hours
export interface WorkingHours {
  [day: string]: {
    open: string;
    close: string;
  } | null;
}
