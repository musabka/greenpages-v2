'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { AdminDataTable } from '@/components/data-table/admin-data-table';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react';
import { FeatureToggleDialog } from '@/components/settings/feature-toggle-dialog';

interface FeatureToggle {
  id: string;
  key: string;
  value: boolean;
  description: string | null;
  target: 'WEB_DIRECTORY' | 'WEB_ADMIN' | 'MOBILE_AGENT' | 'ALL';
  updatedAt: string;
}

export default function FeatureTogglesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingToggle, setEditingToggle] = useState<FeatureToggle | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadToggles();
  }, [router]);

  const loadToggles = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<FeatureToggle[]>('/settings/toggles');
      setToggles(data);
    } catch (error) {
      console.error('Failed to load feature toggles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingToggle(null);
    setDialogOpen(true);
  };

  const handleEdit = (toggle: FeatureToggle) => {
    setEditingToggle(toggle);
    setDialogOpen(true);
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this feature toggle?')) return;

    try {
      await apiClient.delete(`/settings/toggles/${key}`);
      await loadToggles();
    } catch (error: any) {
      console.error('Failed to delete toggle:', error);
      alert(error.message || 'Failed to delete feature toggle');
    }
  };

  const handleToggleValue = async (toggle: FeatureToggle) => {
    try {
      await apiClient.put(`/settings/toggles/${toggle.key}`, {
        value: !toggle.value,
      });
      await loadToggles();
    } catch (error: any) {
      console.error('Failed to toggle value:', error);
      alert(error.message || 'Failed to update feature toggle');
    }
  };

  const handleSave = async () => {
    setDialogOpen(false);
    await loadToggles();
  };

  const filteredToggles = toggles.filter(
    (toggle) =>
      toggle.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toggle.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'key',
      title: 'Key',
      render: (toggle: FeatureToggle) => (
        <span className="font-mono text-sm">{toggle.key}</span>
      ),
    },
    {
      key: 'value',
      title: 'Status',
      render: (toggle: FeatureToggle) => (
        <button
          onClick={() => handleToggleValue(toggle)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {toggle.value ? (
            <>
              <ToggleRight className="h-6 w-6 text-green-600" />
              <span className="text-green-600 font-semibold">Enabled</span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-6 w-6 text-gray-400" />
              <span className="text-gray-500">Disabled</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (toggle: FeatureToggle) => (
        <span className="text-sm text-muted-foreground">
          {toggle.description || 'No description'}
        </span>
      ),
    },
    {
      key: 'target',
      title: 'Target',
      render: (toggle: FeatureToggle) => (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {toggle.target}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      render: (toggle: FeatureToggle) => (
        <span className="text-sm text-muted-foreground">
          {new Date(toggle.updatedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (toggle: FeatureToggle) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(toggle)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(toggle.key)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/settings')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Feature Toggles</h1>
              <p className="text-muted-foreground">
                Enable or disable features without code changes
              </p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="ml-2 h-4 w-4" />
            Add Toggle
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <Label htmlFor="search">Search Toggles</Label>
            <Input
              id="search"
              placeholder="Search by key or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <AdminDataTable
            data={filteredToggles}
            columns={columns}
            loading={loading}
          />
        </Card>
      </div>

      <FeatureToggleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        toggle={editingToggle}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
