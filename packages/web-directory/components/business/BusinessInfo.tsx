import { Business } from '@/types';

interface BusinessInfoProps {
  business: Business;
  locale: string;
  showWhatsApp: boolean;
  showWorkingHours: boolean;
  showWebsite: boolean;
  showEmail: boolean;
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function BusinessInfo({ 
  business, 
  locale, 
  showWhatsApp, 
  showWorkingHours,
  showWebsite,
  showEmail 
}: BusinessInfoProps) {
  const days = locale === 'ar' ? DAYS_AR : DAYS_EN;
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6">
        {locale === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
      </h2>
      
      <div className="space-y-4">
        {/* Phone */}
        {business.phone && (
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {locale === 'ar' ? 'الهاتف' : 'Phone'}
              </p>
              <a
                href={`tel:${business.phone}`}
                className="text-lg font-medium text-blue-600 hover:text-blue-700"
                dir="ltr"
              >
                {business.phone}
              </a>
            </div>
          </div>
        )}
        
        {/* Phone 2 */}
        {business.phone2 && (
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {locale === 'ar' ? 'هاتف إضافي' : 'Phone 2'}
              </p>
              <a
                href={`tel:${business.phone2}`}
                className="text-lg font-medium text-blue-600 hover:text-blue-700"
                dir="ltr"
              >
                {business.phone2}
              </a>
            </div>
          </div>
        )}
        
        {/* WhatsApp */}
        {showWhatsApp && business.whatsapp && (
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            <div>
              <p className="text-sm text-gray-600 mb-1">WhatsApp</p>
              <a
                href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-green-600 hover:text-green-700"
                dir="ltr"
              >
                {business.whatsapp}
              </a>
            </div>
          </div>
        )}
        
        {/* Email */}
        {showEmail && business.email && (
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </p>
              <a
                href={`mailto:${business.email}`}
                className="text-lg font-medium text-blue-600 hover:text-blue-700 break-all"
              >
                {business.email}
              </a>
            </div>
          </div>
        )}
        
        {/* Website */}
        {showWebsite && business.website && (
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
            <div>
              <p className="text-sm text-gray-600 mb-1">
                {locale === 'ar' ? 'الموقع الإلكتروني' : 'Website'}
              </p>
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium text-blue-600 hover:text-blue-700 break-all"
              >
                {business.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
        )}
        
        {/* Working Hours */}
        {showWorkingHours && business.workingHours && (
          <div className="flex items-start gap-3 pt-4 border-t">
            <svg
              className="w-6 h-6 text-gray-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">
                {locale === 'ar' ? 'ساعات العمل' : 'Working Hours'}
              </p>
              <div className="space-y-2">
                {DAY_KEYS.map((key, index) => {
                  const hours = (business.workingHours as any)?.[key];
                  if (!hours) return null;
                  
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-700 font-medium">{days[index]}</span>
                      <span className="text-gray-600" dir="ltr">
                        {hours.open} - {hours.close}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
