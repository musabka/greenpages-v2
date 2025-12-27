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
import { Plus, Edit, Trash2, Languages, ArrowLeft, Download, Upload } from 'lucide-react';
import { TranslationDialog } from '@/components/settings/translation-dialog';

interface Translation {
  id: string;
  namespace: string;
  key: string;
  locale: string;
  value: string;
  updatedAt: string;
}

interface TranslationListResponse {
  data: Translation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function TranslationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [namespaceFilter, setNamespaceFilter] = useState('');
  const [localeFilter, setLocaleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadTranslations();
  }, [router, page, namespaceFilter, localeFilter]);

  const loadTranslations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (namespaceFilter) params.append('namespace', namespaceFilter);
      if (localeFilter) params.append('locale', localeFilter);

      const data = await apiClient.get<TranslationListResponse>(
        `/i18n/translations/list?${params.toString()}`
      );
      setTranslations(data.data);
      setTotalPages(data.meta.totalPages);
    } catch (error) {
      console.error('Failed to load translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTranslation(null);
    setDialogOpen(true);
  };

  const handleEdit = (translation: Translation) => {
    setEditingTranslation(translation);
    setDialogOpen(true);
  };

  const handleDelete = async (translation: Translation) => {
    if (!confirm('Are you sure you want to delete this translation?')) return;

    try {
      await apiClient.delete(
        `/i18n/translations/${translation.namespace}/${translation.key}/${translation.locale}`
      );
      await loadTranslations();
    } catch (error: any) {
      console.error('Failed to delete translation:', error);
      alert(error.message || 'Failed to delete translation');
    }
  };

  const handleSave = async () => {
    setDialogOpen(false);
    await loadTranslations();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ locale: localeFilter || 'ar' });
      if (namespaceFilter) params.append('namespace', namespaceFilter);

      const data = await apiClient.get<any>(`/i18n/translations?${params.toString()}`);
      
      const blob = new Blob([JSON.stringify(data.translations, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translations-${localeFilter || 'ar'}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export translations:', error);
      alert('Failed to export translations');
    }
  };

  const filteredTranslations = translations.filter(
    (translation) =>
      translation.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      translation.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocaleFlag = (locale: string) => {
    const flags: Record<string, string> = {
      ar: '🇸🇦',
      en: '🇬🇧',
    };
    return flags[locale] || '🌐';
  };

  const columns = [
    {
      key: 'namespace',
      title: 'Namespace',
      render: (translation: Translation) => (
        <span className="font-mono text-sm text-blue-600">{translation.namespace}</span>
      ),
    },
    {
      key: 'key',
      title: 'Key',
      render: (translation: Translation) => (
        <span className="font-mono text-sm">{translation.key}</span>
      ),
    },
    {
      key: 'locale',
      title: 'Locale',
      render: (translation: Translation) => (
        <span className="inline-flex items-center gap-1">
          <span>{getLocaleFlag(translation.locale)}</span>
          <span className="font-semibold">{translation.locale.toUpperCase()}</span>
        </span>
      ),
    },
    {
      key: 'value',
      title: 'Value',
      render: (translation: Translation) => (
        <span className="text-sm max-w-md truncate block" title={translation.value}>
          {translation.value}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      render: (translation: Translation) => (
        <span className="text-sm text-muted-foreground">
          {new Date(translation.updatedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (translation: Translation) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(translation)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(translation)}
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
              <h1 className="text-3xl font-bold">Translations</h1>
              <p className="text-muted-foreground">
                Manage multi-language content
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="ml-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="ml-2 h-4 w-4" />
              Add Translation
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by key or value..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="namespace">Namespace</Label>
              <Input
                id="namespace"
                placeholder="Filter by namespace..."
                value={namespaceFilter}
                onChange={(e) => {
                  setNamespaceFilter(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <Label htmlFor="locale">Locale</Label>
              <select
                id="locale"
                value={localeFilter}
                onChange={(e) => {
                  setLocaleFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">All Locales</option>
                <option value="ar">🇸🇦 Arabic (ar)</option>
                <option value="en">🇬🇧 English (en)</option>
              </select>
            </div>
          </div>

          <AdminDataTable
            data={filteredTranslations}
            columns={columns}
            loading={loading}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </div>

      <TranslationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        translation={editingTranslation}
        onSave={handleSave}
      />
    </AdminLayout>
  );
}
