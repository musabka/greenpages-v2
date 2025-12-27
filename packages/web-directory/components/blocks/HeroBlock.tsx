import Link from 'next/link';
import { Block } from '@/types';

interface HeroBlockProps {
  block?: Block | null;
  locale: string;
}

export default function HeroBlock({ block, locale }: HeroBlockProps) {
  const isRTL = locale === 'ar';
  
  // Default settings if no block is provided or block is disabled
  const defaultSettings = {
    title: isRTL ? 'اكتشف الأعمال المحلية' : 'Discover Local Businesses',
    subtitle: isRTL 
      ? 'دليلك الموثوق للعثور على أفضل الخدمات والأنشطة التجارية'
      : 'Your trusted guide to finding the best services and businesses',
    showSearchBar: true,
    searchPlaceholder: isRTL ? 'ابحث عن نشاط تجاري أو خدمة...' : 'Search for a business or service...',
    ctaButtons: [
      {
        label: isRTL ? 'تصفح الأعمال' : 'Browse Businesses',
        href: '/businesses',
        variant: 'primary',
      },
      {
        label: isRTL ? 'عرض التصنيفات' : 'View Categories',
        href: '/categories',
        variant: 'secondary',
      },
    ],
    backgroundImage: null,
    backgroundColor: '#f0fdf4',
    textColor: '#1f2937',
    height: 'medium', // small, medium, large
  };

  const settings = block?.isEnabled ? { ...defaultSettings, ...block.settingsJson } : defaultSettings;

  const heightClasses = {
    small: 'py-12 md:py-16',
    medium: 'py-16 md:py-24',
    large: 'py-24 md:py-32',
  };

  return (
    <section 
      className={`w-full ${heightClasses[settings.height as keyof typeof heightClasses] || heightClasses.medium}`}
      style={{
        backgroundColor: settings.backgroundColor,
        color: settings.textColor,
        backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            {settings.title}
          </h1>

          {/* Subtitle */}
          {settings.subtitle && (
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              {settings.subtitle}
            </p>
          )}

          {/* Search Bar */}
          {settings.showSearchBar && (
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder={settings.searchPlaceholder}
                  className="w-full px-6 py-4 pr-12 text-base border-2 border-gray-200 rounded-full focus:outline-none focus:border-primary-500 transition-colors"
                  style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                />
                <button
                  className="absolute top-1/2 -translate-y-1/2 bg-primary-600 text-white p-3 rounded-full hover:bg-primary-700 transition-colors"
                  style={{ [isRTL ? 'left' : 'right']: '8px' }}
                  aria-label={isRTL ? 'بحث' : 'Search'}
                >
                  <svg 
                    className="h-5 w-5" 
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
                </button>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          {settings.ctaButtons && settings.ctaButtons.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              {settings.ctaButtons.map((button: any, index: number) => (
                <Link
                  key={index}
                  href={button.href}
                  className={`
                    px-8 py-3 rounded-lg font-medium transition-all min-w-[200px] text-center
                    ${button.variant === 'primary' 
                      ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl' 
                      : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-primary-600 hover:text-primary-600'
                    }
                  `}
                >
                  {button.label}
                </Link>
              ))}
            </div>
          )}

          {/* Quick Stats (Optional) */}
          {settings.showStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 max-w-3xl mx-auto">
              {settings.stats?.map((stat: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
