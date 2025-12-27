import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'الصفحة غير موجودة - 404',
  description: 'الصفحة التي تبحث عنها غير موجودة',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          الصفحة غير موجودة
        </h2>
        <p className="text-gray-600 mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            العودة للصفحة الرئيسية
          </Link>
          <Link
            href="/search"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            البحث في الدليل
          </Link>
        </div>
      </div>
    </div>
  );
}
