'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

interface Block {
  id: string;
  type: 'HEADER' | 'FOOTER' | 'HOME_HERO';
  target: 'WEB_DIRECTORY' | 'WEB_ADMIN' | 'MOBILE_AGENT' | 'ALL';
  schemaVersion: number;
  settingsJson: Record<string, any>;
  isEnabled: boolean;
}

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: Block | null;
  onSave: () => void;
}

export function BlockDialog({
  open,
  onOpenChange,
  block,
  onSave,
}: BlockDialogProps) {
  const [formData, setFormData] = useState<{
    type: 'HEADER' | 'FOOTER' | 'HOME_HERO';
    target: 'WEB_DIRECTORY' | 'WEB_ADMIN' | 'MOBILE_AGENT' | 'ALL';
    schemaVersion: number;
    settingsJson: string;
    isEnabled: boolean;
  }>({
    type: 'HEADER',
    target: 'WEB_DIRECTORY',
    schemaVersion: 1,
    settingsJson: '{}',
    isEnabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (block) {
      setFormData({
        type: block.type,
        target: block.target,
        schemaVersion: block.schemaVersion,
        settingsJson: JSON.stringify(block.settingsJson, null, 2),
        isEnabled: block.isEnabled,
      });
    } else {
      setFormData({
        type: 'HEADER',
        target: 'WEB_DIRECTORY',
        schemaVersion: 1,
        settingsJson: '{}',
        isEnabled: true,
      });
    }
    setError('');
  }, [block, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate JSON
      let parsedSettings;
      try {
        parsedSettings = JSON.parse(formData.settingsJson);
      } catch {
        throw new Error('Invalid JSON in settings');
      }

      if (block) {
        // Update existing block
        await apiClient.put(`/settings/blocks/${block.id}`, {
          schemaVersion: formData.schemaVersion,
          settingsJson: parsedSettings,
          isEnabled: formData.isEnabled,
        });
      } else {
        // Create new block
        await apiClient.post('/settings/blocks', {
          type: formData.type,
          target: formData.target,
          schemaVersion: formData.schemaVersion,
          settingsJson: parsedSettings,
          isEnabled: formData.isEnabled,
        });
      }
      onSave();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to save block:', err);
      setError(err.message || 'Failed to save block');
    } finally {
      setLoading(false);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(formData.settingsJson);
      setFormData({
        ...formData,
        settingsJson: JSON.stringify(parsed, null, 2),
      });
      setError('');
    } catch {
      setError('Invalid JSON format');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {block ? 'Edit Block' : 'Create Block'}
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
              <Label htmlFor="type">Block Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as any,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                required
                disabled={!!block}
              >
                <option value="HEADER">Header</option>
                <option value="FOOTER">Footer</option>
                <option value="HOME_HERO">Home Hero</option>
              </select>
              {block && (
                <p className="text-xs text-muted-foreground mt-1">
                  Cannot be changed after creation
                </p>
              )}
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
                disabled={!!block}
              >
                <option value="WEB_DIRECTORY">Web Directory</option>
                <option value="WEB_ADMIN">Web Admin</option>
                <option value="MOBILE_AGENT">Mobile Agent</option>
                <option value="ALL">All Applications</option>
              </select>
              {block && (
                <p className="text-xs text-muted-foreground mt-1">
                  Cannot be changed after creation
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="schemaVersion">Schema Version</Label>
            <Input
              id="schemaVersion"
              type="number"
              min="1"
              value={formData.schemaVersion}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  schemaVersion: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="settingsJson">Settings JSON *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={formatJson}
              >
                Format JSON
              </Button>
            </div>
            <textarea
              id="settingsJson"
              value={formData.settingsJson}
              onChange={(e) =>
                setFormData({ ...formData, settingsJson: e.target.value })
              }
              className="flex min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-mono"
              placeholder='{"key": "value"}'
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter valid JSON configuration for this block
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isEnabled"
              checked={formData.isEnabled}
              onChange={(e) =>
                setFormData({ ...formData, isEnabled: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isEnabled" className="cursor-pointer">
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
              {loading ? 'Saving...' : block ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
