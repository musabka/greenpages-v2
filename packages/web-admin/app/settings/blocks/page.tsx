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
import { Plus, Edit, Trash2, Layout, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { BlockDialog } from '@/components/settings/block-dialog';

interface Block {
  id: string;
  type: 'HEADER' | 'FOOTER' | 'HOME_HERO';
  target: 'WEB_DIRECTORY' | 'WEB_ADMIN' | 'MOBILE_AGENT' | 'ALL';
  schemaVersion: number;
  settingsJson: Record<string, any>;
  isEnabled: boolean;
  updatedAt: string;
}

export default function BlocksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadBlocks();
  }, [router]);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<Block[]>('/settings/blocks');
      setBlocks(data);
    } catch (error) {
      console.error('Failed to load blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBlock(null);
    setDialogOpen(true);
  };

  const handleEdit = (block: Block) => {
    setEditingBlock(block);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this block?')) return;

    try {
      await apiClient.delete(`/settings/blocks/${id}`);
      await loadBlocks();
    } catch (error: any) {
      console.error('Failed to delete block:', error);
      alert(error.message || 'Failed to delete block');
    }
  };

  const handleToggleEnabled = async (block: Block) => {
    try {
      await apiClient.put(`/settings/blocks/${block.id}`, {
        isEnabled: !block.isEnabled,
      });
      await loadBlocks();
    } catch (error: any) {
      console.error('Failed to toggle block:', error);
      alert(error.message || 'Failed to update block');
    }
  };

  const handleSave = async () => {
    setDialogOpen(false);
    await loadBlocks();
  };

  const filteredBlocks = blocks.filter(
    (block) =>
      block.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBlockTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      HEADER: 'Header',
      FOOTER: 'Footer',
      HOME_HERO: 'Home Hero',
    };
    return labels[type] || type;
  };

  const columns = [
    {
      key: 'type',
      title: 'Type',
      render: (block: Block) => (
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{getBlockTypeLabel(block.type)}</span>
        </div>
      ),
    },
    {
      key: 'target',
      title: 'Target',
      render: (block: Block) => (
        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
          {block.target}
        </span>
      ),
    },
    {
      key: 'schemaVersion',
      title: 'Version',
      render: (block: Block) => (
        <span className="text-sm text-muted-foreground">v{block.schemaVersion}</span>
      ),
    },
    {
      key: 'isEnabled',
      title: 'Status',
      render: (block: Block) => (
        <button
          onClick={() => handleToggleEnabled(block)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {block.isEnabled ? (
            <>
              <Eye className="h-5 w-5 text-green-600" />
              <span className="text-green-600 font-semibold">Enabled</span>
            </>
          ) : (
            <>
              <EyeOff className="h-5 w-5 text-gray-400" />
              <span className="text-gray-500">Disabled</span>
            </>
          )}
        </button>
      ),
    },
    {
      key: 'settingsJson',
      title: 'Settings',
      render: (block: Block) => (
        <span className="text-sm text-muted-foreground">
          {Object.keys(block.settingsJson).length} properties
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      render: (block: Block) => (
        <span className="text-sm text-muted-foreground">
          {new Date(block.updatedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (block: Block) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(block)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(block.id)}
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
              <h1 className="text-3xl font-bold">UI Blocks</h1>
              <p className="text-muted-foreground">
                Customize header, footer, and hero blocks
              </p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="ml-2 h-4 w-4" />
            Add Block
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <Label htmlFor="search">Search Blocks</Label>
            <Input
              id="search"
              placeholder="Search by type or target..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <AdminDataTable
            data={filteredBlocks}
            columns={columns}
            loading={loading}
          />
        </Card>
      </div>

      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        block={editingBlock}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
