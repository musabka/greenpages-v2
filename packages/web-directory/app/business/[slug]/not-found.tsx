import Link from 'next/link';

export default function BusinessNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          النشاط التجاري غير موجود
        </h2>
        <p className="text-gray-600 mb-8">
          عذراً، لم نتمكن من العثور على النشاط التجاري المطلوب.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
