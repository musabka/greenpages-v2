'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { AdminDataTable } from '@/components/data-table/admin-data-table';

interface LedgerEntry {
  id: string;
  type: 'DEBT' | 'SETTLEMENT';
  amount: number;
  balance: number;
  businessId?: string;
  businessName?: string;
  collectionType?: string;
  notes?: string;
  createdAt: string;
}

interface DebtSummary {
  agentId: string;
  totalDebt: number;
  debtCount: number;
  totalSettlements: number;
  currentBalance: number;
}

interface Agent {
  id: string;
  employeeCode: string;
  user: {
    email: string;
  };
}

export default function AgentLedgerPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, [agentId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all agents to find the specific one
      const agentsResponse = await apiClient.get('/finance/agents') as any;
      const allAgents = agentsResponse.data as any[];
      const foundAgent = allAgents.find((a: any) => a.id === agentId);
      
      if (foundAgent) {
        setAgent(foundAgent);
        setDebtSummary(foundAgent.debtSummary);
      }

      // Load ledger
      await loadLedger();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLedger = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await apiClient.get(
        `/finance/agents/${agentId}/ledger?${params.toString()}`
      ) as any;
      setLedgerEntries(response.data as LedgerEntry[]);
    } catch (error) {
      console.error('Failed to load ledger:', error);
    }
  };

  const handleFilterApply = () => {
    loadLedger();
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(() => loadLedger(), 0);
  };

  const columns = [
    {
      key: 'createdAt',
      title: 'Date',
      render: (entry: LedgerEntry) =>
        new Date(entry.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
    },
    {
      key: 'type',
      title: 'Type',
      render: (entry: LedgerEntry) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            entry.type === 'DEBT'
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {entry.type}
        </span>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (entry: LedgerEntry) => {
        if (entry.type === 'DEBT') {
          return (
            <div>
              <p className="font-medium">{entry.businessName}</p>
              <p className="text-xs text-gray-500">
                {entry.collectionType?.replace('_', ' ')}
              </p>
            </div>
          );
        } else {
          return (
            <div>
              <p className="font-medium">Settlement</p>
              {entry.notes && (
                <p className="text-xs text-gray-500">{entry.notes}</p>
              )}
            </div>
          );
        }
      },
    },
    {
      key: 'amount',
      title: 'Amount',
      render: (entry: LedgerEntry) => (
        <span
          className={`font-semibold ${
            entry.type === 'DEBT' ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {entry.type === 'DEBT' ? '+' : '-'}
          {entry.amount.toFixed(2)} IQD
        </span>
      ),
    },
    {
      key: 'balance',
      title: 'Balance',
      render: (entry: LedgerEntry) => (
        <span className="font-semibold">{entry.balance.toFixed(2)} IQD</span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push('/finance')}>
          ← Back to Finance
        </Button>
      </div>

      {agent && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Agent Ledger</h1>
          <p className="text-gray-600 mt-2">
            {agent.employeeCode} - {agent.user?.email}
          </p>
        </div>
      )}

      {debtSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total Collected</p>
            <p className="text-2xl font-bold">
              {debtSummary.totalDebt.toFixed(2)} IQD
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {debtSummary.debtCount} transactions
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-gray-600">Total Settled</p>
            <p className="text-2xl font-bold text-green-600">
              {debtSummary.totalSettlements.toFixed(2)} IQD
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className="text-2xl font-bold text-red-600">
              {debtSummary.currentBalance.toFixed(2)} IQD
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-lg font-semibold">
              {debtSummary.currentBalance > 0 ? (
                <span className="text-red-600">Outstanding</span>
              ) : (
                <span className="text-green-600">Settled</span>
              )}
            </p>
          </Card>
        </div>
      )}

      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleFilterApply}>Apply Filter</Button>
            <Button variant="outline" onClick={handleClearFilter}>
              Clear
            </Button>
          </div>
        </div>

        <AdminDataTable
          data={ledgerEntries}
          columns={columns}
          loading={loading}
        />
      </Card>
    </div>
  );
}
