'use client';

import { useState } from 'react';

interface ReportIssueButtonProps {
  businessId: string;
  businessName: string;
  locale: string;
}

const REPORT_TYPES = [
  { value: 'WRONG_PHONE', labelAr: 'رقم هاتف خاطئ', labelEn: 'Wrong Phone' },
  { value: 'WRONG_LOCATION', labelAr: 'موقع خاطئ', labelEn: 'Wrong Location' },
  { value: 'CLOSED_BUSINESS', labelAr: 'نشاط مغلق', labelEn: 'Closed Business' },
  { value: 'WRONG_INFO', labelAr: 'معلومات خاطئة', labelEn: 'Wrong Information' },
  { value: 'SPAM', labelAr: 'محتوى غير مناسب', labelEn: 'Spam' },
];

export function ReportIssueButton({ businessId, businessName, locale }: ReportIssueButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportType) {
      setError(locale === 'ar' ? 'الرجاء اختيار نوع البلاغ' : 'Please select report type');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      
      // Note: This requires authentication. For now, we'll show a message.
      // In a real implementation, you'd need to handle authentication first.
      const response = await fetch(`${API_BASE_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale,
          // 'Authorization': `Bearer ${token}`, // Would need auth token
        },
        body: JSON.stringify({
          businessId,
          type: reportType,
          description: description || undefined,
        }),
      });
      
      if (response.status === 401) {
        setError(locale === 'ar' 
          ? 'يجب تسجيل الدخول للإبلاغ عن مشكلة' 
          : 'You must be logged in to report an issue'
        );
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to submit report');
      }
      
      setSuccess(true);
      setTimeout(() => {
        setShowDialog(false);
        setSuccess(false);
        setReportType('');
        setDescription('');
      }, 2000);
    } catch (err) {
      setError(locale === 'ar' 
        ? 'فشل إرسال البلاغ. الرجاء المحاولة مرة أخرى.' 
        : 'Failed to submit report. Please try again.'
      );
      console.error('Error submitting report:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        {locale === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report Issue'}
      </button>
      
      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                {locale === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report Issue'}
              </h3>
              <button
                onClick={() => setShowDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {locale === 'ar' 
                ? `الإبلاغ عن مشكلة في: ${businessName}`
                : `Report an issue with: ${businessName}`
              }
            </p>
            
            {success ? (
              <div className="py-8 text-center">
                <svg
                  className="w-16 h-16 text-green-500 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-green-600 font-medium">
                  {locale === 'ar' ? 'تم إرسال البلاغ بنجاح' : 'Report submitted successfully'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'ar' ? 'نوع المشكلة' : 'Issue Type'}
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">
                      {locale === 'ar' ? 'اختر نوع المشكلة' : 'Select issue type'}
                    </option>
                    {REPORT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {locale === 'ar' ? type.labelAr : type.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === 'ar' ? 'الوصف (اختياري)' : 'Description (optional)'}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={locale === 'ar' 
                      ? 'أضف تفاصيل إضافية...'
                      : 'Add additional details...'
                    }
                  />
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDialog(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting 
                      ? (locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
                      : (locale === 'ar' ? 'إرسال البلاغ' : 'Submit Report')
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
