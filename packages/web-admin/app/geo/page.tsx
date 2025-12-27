'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GeoPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to hierarchy page as the default geo page
    router.push('/geo/hierarchy');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}
