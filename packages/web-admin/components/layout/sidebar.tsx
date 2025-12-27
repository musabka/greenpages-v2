'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MapPin,
  FolderTree,
  Building2,
  CreditCard,
  Megaphone,
  DollarSign,
  Star,
  Flag,
  Settings,
  Bell,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Permission } from '@/lib/permissions';
import { useState } from 'react';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: 'لوحة التحكم',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'البيانات الجغرافية',
    icon: MapPin,
    permission: Permission.VIEW_GEOGRAPHY,
    children: [
      {
        title: 'المحافظات',
        href: '/geo/governorates',
        icon: MapPin,
      },
      {
        title: 'المدن',
        href: '/geo/cities',
        icon: MapPin,
      },
      {
        title: 'الأحياء',
        href: '/geo/districts',
        icon: MapPin,
      },
      {
        title: 'التسلسل الجغرافي',
        href: '/geo/hierarchy',
        icon: FolderTree,
      },
    ],
  },
  {
    title: 'التصنيفات',
    href: '/categories',
    icon: FolderTree,
    permission: Permission.VIEW_CATEGORIES,
  },
  {
    title: 'الأنشطة التجارية',
    href: '/businesses',
    icon: Building2,
    permission: Permission.VIEW_BUSINESSES,
  },
  {
    title: 'الباقات',
    href: '/plans',
    icon: CreditCard,
    permission: Permission.VIEW_PLANS,
  },
  {
    title: 'الإعلانات',
    href: '/ads',
    icon: Megaphone,
    permission: Permission.VIEW_ADS,
  },
  {
    title: 'المالية',
    href: '/finance',
    icon: DollarSign,
    permission: Permission.VIEW_FINANCE,
  },
  {
    title: 'المراجعات',
    href: '/reviews',
    icon: Star,
    permission: Permission.VIEW_REVIEWS,
  },
  {
    title: 'البلاغات',
    href: '/reports',
    icon: Flag,
    permission: Permission.VIEW_REPORTS,
  },
  {
    title: 'الإشعارات',
    href: '/notifications',
    icon: Bell,
    permission: Permission.SEND_NOTIFICATIONS,
  },
  {
    title: 'المستخدمون',
    href: '/users',
    icon: Users,
    permission: Permission.VIEW_USERS,
  },
  {
    title: 'الإعدادات',
    href: '/settings',
    icon: Settings,
    permission: Permission.VIEW_SETTINGS,
  },
];

interface SidebarProps {
  userPermissions: Permission[];
}

export function Sidebar({ userPermissions }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Filter nav items based on user permissions
  const filteredNavItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return userPermissions.includes(item.permission);
  });

  const toggleExpanded = (title: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedItems(newExpanded);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.title);
    const isActive = item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`));
    const isChildActive = hasChildren && item.children?.some(
      (child) => child.href && (pathname === child.href || pathname.startsWith(`${child.href}/`))
    );

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isChildActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="flex-1 text-right">{item.title}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && item.children && (
            <div className="mr-4 mt-1 space-y-1 border-r pr-2">
              {item.children.map((child) => {
                const ChildIcon = child.icon;
                const isChildItemActive = child.href && (pathname === child.href || pathname.startsWith(`${child.href}/`));
                
                return (
                  <Link
                    key={child.href}
                    href={child.href!}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isChildItemActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <ChildIcon className="h-4 w-4" />
                    <span>{child.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href!}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{item.title}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 border-l bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              GP
            </div>
            <span className="text-lg font-bold">الصفحات الخضراء</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {filteredNavItems.map(renderNavItem)}
        </nav>
      </div>
    </aside>
  );
}
