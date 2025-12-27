import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // Get locale from cookie or accept-language header
  const locale = request.cookies.get('NEXT_LOCALE')?.value || 
                 request.headers.get('accept-language')?.split(',')[0].split('-')[0] || 
                 'ar';

  // Set locale cookie if not present
  const response = NextResponse.next();
  
  if (!request.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', locale, {
      maxAge: 31536000, // 1 year
      path: '/',
      sameSite: 'lax',
    });
  }

  // Set direction based on locale
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  response.headers.set('X-Locale', locale);
  response.headers.set('X-Direction', direction);
  
  // CRITICAL: Add Vary header to prevent cache poisoning
  // This ensures that cached responses are keyed by locale
  response.headers.set('Vary', 'Cookie, Accept-Language');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
