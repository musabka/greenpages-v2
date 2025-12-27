/**
 * Permission System (RBAC UI-level)
 * Defines what each role can access in the admin panel
 */

import { UserRole } from './auth';

export enum Permission {
  // Geographic Management
  VIEW_GEOGRAPHY = 'view_geography',
  MANAGE_GEOGRAPHY = 'manage_geography',

  // Category Management
  VIEW_CATEGORIES = 'view_categories',
  MANAGE_CATEGORIES = 'manage_categories',

  // Business Management
  VIEW_BUSINESSES = 'view_businesses',
  MANAGE_BUSINESSES = 'manage_businesses',

  // Plans Management
  VIEW_PLANS = 'view_plans',
  MANAGE_PLANS = 'manage_plans',

  // Ads Management
  VIEW_ADS = 'view_ads',
  MANAGE_ADS = 'manage_ads',

  // Finance Management
  VIEW_FINANCE = 'view_finance',
  MANAGE_FINANCE = 'manage_finance',

  // Reviews Management
  VIEW_REVIEWS = 'view_reviews',
  MODERATE_REVIEWS = 'moderate_reviews',

  // Reports Management
  VIEW_REPORTS = 'view_reports',
  RESOLVE_REPORTS = 'resolve_reports',

  // Settings Management
  VIEW_SETTINGS = 'view_settings',
  MANAGE_SETTINGS = 'manage_settings',

  // Notifications
  SEND_NOTIFICATIONS = 'send_notifications',

  // Users Management
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
}

/**
 * Role-Permission mapping
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admins have all permissions
    Permission.VIEW_GEOGRAPHY,
    Permission.MANAGE_GEOGRAPHY,
    Permission.VIEW_CATEGORIES,
    Permission.MANAGE_CATEGORIES,
    Permission.VIEW_BUSINESSES,
    Permission.MANAGE_BUSINESSES,
    Permission.VIEW_PLANS,
    Permission.MANAGE_PLANS,
    Permission.VIEW_ADS,
    Permission.MANAGE_ADS,
    Permission.VIEW_FINANCE,
    Permission.MANAGE_FINANCE,
    Permission.VIEW_REVIEWS,
    Permission.MODERATE_REVIEWS,
    Permission.VIEW_REPORTS,
    Permission.RESOLVE_REPORTS,
    Permission.VIEW_SETTINGS,
    Permission.MANAGE_SETTINGS,
    Permission.SEND_NOTIFICATIONS,
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
  ],
  [UserRole.AGENT]: [
    // Agents have limited permissions
    Permission.VIEW_BUSINESSES,
    Permission.MANAGE_BUSINESSES,
    Permission.VIEW_FINANCE,
  ],
  [UserRole.USER]: [
    // Regular users have no admin permissions
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if user can access a route based on required permissions
 */
export function canAccessRoute(role: UserRole, requiredPermissions: Permission[]): boolean {
  if (requiredPermissions.length === 0) return true;

  const userPermissions = getRolePermissions(role);
  return requiredPermissions.some((permission) => userPermissions.includes(permission));
}
