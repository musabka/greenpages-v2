'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';
import { BusinessFormBasic } from './business-form-basic';
import { BusinessFormLocation } from './business-form-location';
import { BusinessFormTranslations } from './business-form-translations';
import { BusinessFormImages } from './business-form-images';
import { BusinessFormCreate } from './business-form-create';

interface BusinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string | null;
  onSave: () => void;
}

export function BusinessDialog({
  open,
  onOpenChange,
  businessId,
  onSave,
}: BusinessDialogProps) {
  const [loading, setLoading] = useState(false);
  const [business, setBusiness] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'translations' | 'images'>('basic');

  useEffect(() => {
    if (open && businessId) {
      loadBusiness();
      setActiveTab('basic');
    } else if (open && !businessId) {
      setBusiness(null);
      setActiveTab('basic');
    }
  }, [open, businessId]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/businesses/${businessId}?locale=ar`);
      setBusiness(data);
    } catch (error) {
      console.error('Failed to load business:', error);
      alert('فشل تحميل بيانات النشاط التجاري');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveComplete = () => {
    onSave();
  };

  // For create mode, use single form
  if (!businessId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة نشاط تجاري جديد</DialogTitle>
          </DialogHeader>
          <BusinessFormCreate
            onSave={handleSaveComplete}
            onCancel={() => onOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // For edit mode, use tabbed interface
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل النشاط التجاري</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'basic'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                المعلومات الأساسية
              </button>
              <button
                onClick={() => setActiveTab('location')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'location'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                الموقع
              </button>
              <button
                onClick={() => setActiveTab('translations')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'translations'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                الترجمات
              </button>
              <button
                onClick={() => setActiveTab('images')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'images'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                الصور
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'basic' && (
              <BusinessFormBasic
                business={business}
                businessId={businessId}
                onSave={handleSaveComplete}
                onCancel={() => onOpenChange(false)}
              />
            )}
            {activeTab === 'location' && (
              <BusinessFormLocation
                business={business}
                businessId={businessId}
                onSave={handleSaveComplete}
                onCancel={() => onOpenChange(false)}
              />
            )}
            {activeTab === 'translations' && (
              <BusinessFormTranslations
                business={business}
                businessId={businessId}
                onSave={handleSaveComplete}
                onCancel={() => onOpenChange(false)}
              />
            )}
            {activeTab === 'images' && (
              <BusinessFormImages
                businessId={businessId}
                onClose={() => onOpenChange(false)}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
