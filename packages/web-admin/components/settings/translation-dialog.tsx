'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

interface Translation {
  id: string;
  namespace: string;
  key: string;
  locale: string;
  value: string;
}

interface TranslationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  translation: Translation | null;
  onSave: () => void;
}

export function TranslationDialog({
  open,
  onOpenChange,
  translation,
  onSave,
}: TranslationDialogProps) {
  const [formData, setFormData] = useState({
    namespace: '',
    key: '',
    locale: 'ar' as const,
    value: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (translation) {
      setFormData({
        namespace: translation.namespace,
        key: translation.key,
        locale: translation.locale as any,
        value: translation.value,
      });
    } else {
      setFormData({
        namespace: '',
        key: '',
        locale: 'ar',
        value: '',
      });
    }
    setError('');
  }, [translation, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (translation) {
        // Update existing translation
        await apiClient.put(
          `/i18n/translations/${translation.namespace}/${translation.key}/${translation.locale}`,
          {
            value: formData.value,
          }
        );
      } else {
        // Create new translation
        await apiClient.post('/i18n/translations', {
          namespace: formData.namespace,
          key: formData.key,
          locale: formData.locale,
          value: formData.value,
        });
      }
      onSave();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to save translation:', err);
      setError(err.message || 'Failed to save translation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {translation ? 'Edit Translation' : 'Create Translation'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="namespace">Namespace *</Label>
              <Input
                id="namespace"
                value={formData.namespace}
                onChange={(e) =>
                  setFormData({ ...formData, namespace: e.target.value })
                }
                placeholder="e.g., common, business, category"
                required
                disabled={!!translation}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Groups related translations together
              </p>
            </div>

            <div>
              <Label htmlFor="locale">Locale *</Label>
              <select
                id="locale"
                value={formData.locale}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    locale: e.target.value as any,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                required
                disabled={!!translation}
              >
                <option value="ar">🇸🇦 Arabic (ar)</option>
                <option value="en">🇬🇧 English (en)</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="key">Key *</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="e.g., welcome_message, button_submit"
              required
              disabled={!!translation}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use snake_case format. Cannot be changed after creation.
            </p>
          </div>

          <div>
            <Label htmlFor="value">Value *</Label>
            <textarea
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              placeholder="Enter the translated text..."
              required
              dir={formData.locale === 'ar' ? 'rtl' : 'ltr'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Supports parameter interpolation: {`{{paramName}}`}
            </p>
          </div>

          {translation && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-sm">
              <strong>Note:</strong> Namespace, key, and locale cannot be changed. To modify
              these, delete this translation and create a new one.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : translation ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
