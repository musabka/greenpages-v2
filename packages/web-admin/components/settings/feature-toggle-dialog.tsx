'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

interface FeatureToggle {
  id: string;
  key: string;
  value: boolean;
  description: string | null;
  target: 'WEB_DIRECTORY' | 'WEB_ADMIN' | 'MOBILE_AGENT' | 'ALL';
}

interface FeatureToggleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toggle: FeatureToggle | null;
  onSave: () => void;
}

export function FeatureToggleDialog({
  open,
  onOpenChange,
  toggle,
  onSave,
}: FeatureToggleDialogProps) {
  const [formData, setFormData] = useState<{
    key: string;
    value: boolean;
    description: string;
    target: 'WEB_DIRECTORY' | 'WEB_ADMIN' | 'MOBILE_AGENT' | 'ALL';
  }>({
    key: '',
    value: false,
    description: '',
    target: 'ALL',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (toggle) {
      setFormData({
        key: toggle.key,
        value: toggle.value,
        description: toggle.description || '',
        target: toggle.target,
      });
    } else {
      setFormData({
        key: '',
        value: false,
        description: '',
        target: 'ALL',
      });
    }
    setError('');
  }, [toggle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (toggle) {
        // Update existing toggle
        await apiClient.put(`/settings/toggles/${toggle.key}`, {
          value: formData.value,
          description: formData.description || null,
          target: formData.target,
        });
      } else {
        // Create new toggle
        await apiClient.post('/settings/toggles', {
          key: formData.key,
          value: formData.value,
          description: formData.description || null,
          target: formData.target,
        });
      }
      onSave();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to save toggle:', err);
      setError(err.message || 'Failed to save feature toggle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {toggle ? 'Edit Feature Toggle' : 'Create Feature Toggle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="key">Key *</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="e.g., enable_whatsapp_display"
              required
              disabled={!!toggle}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use snake_case format. Cannot be changed after creation.
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this toggle"
            />
          </div>

          <div>
            <Label htmlFor="target">Target Application *</Label>
            <select
              id="target"
              value={formData.target}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  target: e.target.value as any,
                })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              required
            >
              <option value="ALL">All Applications</option>
              <option value="WEB_DIRECTORY">Web Directory</option>
              <option value="WEB_ADMIN">Web Admin</option>
              <option value="MOBILE_AGENT">Mobile Agent</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="value"
              checked={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="value" className="cursor-pointer">
              Enabled
            </Label>
          </div>

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
              {loading ? 'Saving...' : toggle ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
