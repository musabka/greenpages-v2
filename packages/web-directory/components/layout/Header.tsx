import Link from 'next/link';
import { Block } from '@/types';

interface HeaderProps {
  block?: Block | null;
  locale: string;
}

export default function Header({ block, locale }: HeaderProps) {
  const isRTL = locale === 'ar';
  
  // Default settings if no block is provided or block is disabled
  const defaultSettings = {
    logo: {
      text: isRTL ? 'الصفحات الخضراء' : 'Green Pages',
      showIcon: true,
    },
    navigation: [
      { label: isRTL ? 'الرئيسية' : 'Home', href: '/' },
      { label: isRTL ? 'بحث' : 'Search', href: '/search' },
      { label: isRTL ? 'الأعمال' : 'Businesses', href: '/businesses' },
      { label: isRTL ? 'التصنيفات' : 'Categories', href: '/categories' },
      { label: isRTL ? 'عنا' : 'About', href: '/about' },
    ],
    showSearch: true,
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
  };

  const settings = block?.isEnabled ? { ...defaultSettings, ...block.settingsJson } : defaultSettings;

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b shadow-sm"
      style={{ 
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
          >
            {settings.logo.showIcon && (
              <svg 
                className="h-8 w-8 text-primary-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            )}
            <span>{settings.logo.text}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {settings.navigation.map((item: any, index: number) => (
              <Link
                key={index}
                href={item.href}
                className="text-sm font-medium hover:text-primary-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search Button (Desktop) */}
          {settings.showSearch && (
            <Link
              href="/search"
              className="hidden md:flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              aria-label={isRTL ? 'بحث' : 'Search'}
            >
              <svg 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              <span>{isRTL ? 'بحث' : 'Search'}</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isRTL ? 'القائمة' : 'Menu'}
          >
            <svg 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6h16M4 12h16M4 18h16" 
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation (Hidden by default, would need client-side state) */}
        <nav className="hidden md:hidden pb-4 space-y-2">
          {settings.navigation.map((item: any, index: number) => (
            <Link
              key={index}
              href={item.href}
              className="block px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {settings.showSearch && (
            <Link
              href="/search"
              className="w-full flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
              <span>{isRTL ? 'بحث' : 'Search'}</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
