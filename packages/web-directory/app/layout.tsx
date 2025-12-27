import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import { headers } from 'next/headers';
import './globals.css';
import { Header, Footer } from '@/components/layout';
import { apiClient } from '@/lib/api-client';
import { Block } from '@/types';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: {
    default: 'الصفحات الخضراء | Green Pages',
    template: '%s | الصفحات الخضراء',
  },
  description: 'دليل رسمي موثوق للأنشطة التجارية والخدمية في لبنان - Official trusted directory for businesses and services in Lebanon',
  keywords: [
    'دليل',
    'أعمال',
    'خدمات',
    'تجارة',
    'لبنان',
    'directory',
    'business',
    'services',
    'Lebanon',
    'الصفحات الخضراء',
    'Green Pages',
  ],
  authors: [{ name: 'Green Pages', url: process.env.NEXT_PUBLIC_SITE_URL }],
  creator: 'Green Pages',
  publisher: 'Green Pages',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'ar': '/ar',
      'en': '/en',
      'ar-LB': '/ar',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_LB',
    alternateLocale: ['en_US'],
    url: '/',
    siteName: 'الصفحات الخضراء | Green Pages',
    title: 'الصفحات الخضراء | Green Pages',
    description: 'دليل رسمي موثوق للأنشطة التجارية والخدمية في لبنان',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'الصفحات الخضراء | Green Pages',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'الصفحات الخضراء | Green Pages',
    description: 'دليل رسمي موثوق للأنشطة التجارية والخدمية في لبنان',
    images: ['/twitter-image.png'],
    creator: '@greenpages', // Update with actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  verification: {
    // Add verification codes when available
    // google: 'google-site-verification-code',
    // yandex: 'yandex-verification-code',
    // bing: 'bing-verification-code',
  },
  category: 'business',
};

// Helper function to detect locale from headers
async function getLocale(): Promise<string> {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Check if Arabic is preferred
  if (acceptLanguage.includes('ar')) {
    return 'ar';
  }
  
  // Default to Arabic (primary language)
  return 'ar';
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const isRTL = locale === 'ar';
  
  // Fetch blocks from API
  let headerBlock: Block | null = null;
  let footerBlock: Block | null = null;
  
  try {
    const response = await apiClient.getBlock('HEADER', 'WEB_DIRECTORY');
    headerBlock = response as Block;
  } catch (error) {
    console.error('Failed to fetch header block:', error);
  }
  
  try {
    const response = await apiClient.getBlock('FOOTER', 'WEB_DIRECTORY');
    footerBlock = response as Block;
  } catch (error) {
    console.error('Failed to fetch footer block:', error);
  }

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <body className={`${inter.variable} ${cairo.variable} ${isRTL ? 'font-arabic' : 'font-sans'} antialiased`}>
        <div className="flex flex-col min-h-screen">
          <Header block={headerBlock} locale={locale} />
          <main className="flex-1">
            {children}
          </main>
          <Footer block={footerBlock} locale={locale} />
        </div>
      </body>
    </html>
  );
}
