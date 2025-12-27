'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { Upload, Trash2, Star, GripVertical } from 'lucide-react';

interface BusinessImage {
  id: string;
  objectKey: string;
  mimeType: string;
  size: number;
  sortOrder: number;
  isPrimary: boolean;
  url?: string;
}

interface BusinessFormImagesProps {
  businessId: string;
  onClose: () => void;
}

export function BusinessFormImages({
  businessId,
  onClose,
}: BusinessFormImagesProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadImages();
  }, [businessId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const business = await apiClient.get<any>(`/businesses/${businessId}?locale=ar`);
      // Sort by sortOrder explicitly (not array index)
      const sortedImages = (business.images || []).sort((a: BusinessImage, b: BusinessImage) => 
        a.sortOrder - b.sortOrder
      );
      setImages(sortedImages);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('الرجاء اختيار ملف صورة');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/businesses/${businessId}/images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      await loadImages();
      e.target.value = ''; // Reset input
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await apiClient.put(`/businesses/${businessId}/images/${imageId}/primary`, {});
      await loadImages();
    } catch (error) {
      console.error('Failed to set primary image:', error);
      alert('فشل تعيين الصورة الرئيسية');
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;

    try {
      await apiClient.delete(`/businesses/${businessId}/images/${imageId}`);
      await loadImages();
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('فشل حذف الصورة');
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    // Reorder locally for immediate feedback
    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    setDraggedIndex(null);
    
    // Save new order to server using explicit sortOrder
    try {
      setReordering(true);
      const imageIds = images.map(img => img.id);
      await apiClient.put(`/businesses/${businessId}/images/reorder`, { imageIds });
      await loadImages(); // Reload to get updated sortOrder from server
    } catch (error) {
      console.error('Failed to reorder images:', error);
      alert('فشل حفظ الترتيب الجديد');
      await loadImages(); // Reload original order on error
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {uploading ? 'جاري الرفع...' : 'انقر لرفع صورة'}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP, GIF (حد أقصى 5MB)
            </p>
          </div>
        </label>
      </div>

      {/* Images Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          لا توجد صور
        </div>
      ) : (
        <>
          {reordering && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              جاري حفظ الترتيب الجديد...
            </div>
          )}
          
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground mb-4">
            💡 اسحب الصور لإعادة ترتيبها. الترتيب يعتمد على sortOrder الصريح وليس موضع الصورة في القائمة.
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group border rounded-lg overflow-hidden cursor-move transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                }`}
              >
                {/* Drag Handle */}
                <div className="absolute top-2 left-2 z-10 bg-black/70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Sort Order Badge */}
                <div className="absolute top-2 left-10 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  #{image.sortOrder}
                </div>

                <div className="aspect-square bg-muted flex items-center justify-center">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      لا توجد معاينة
                    </div>
                  )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(image.id)}
                    disabled={image.isPrimary}
                    title="تعيين كصورة رئيسية"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        image.isPrimary ? 'fill-yellow-400 text-yellow-400' : ''
                      }`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(image.id)}
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-1 rounded">
                    رئيسية
                  </div>
                )}

                {/* Size Info */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {(image.size / 1024).toFixed(0)} KB
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onClose}>
          إغلاق
        </Button>
      </div>
    </div>
  );
}
