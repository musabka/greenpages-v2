'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { AdminDataTable } from '@/components/data-table/admin-data-table';
import { SettlementDialog } from '@/components/finance/settlement-dialog';

interface Agent {
  id: string;
  employeeCode: string;
  user: {
    email: string;
  };
}

interface DebtSummary {
  agentId: string;
  totalDebt: number;
  debtCount: number;
  totalSettlements: number;
  currentBalance: number;
}

interface AgentWithDebt extends Agent {
  debtSummary?: DebtSummary;
}

export default function FinancePage() {
  const [agents, setAgents] = useState<AgentWithDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithDebt | null>(null);
  const [showSettlementDialog, setShowSettlementDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      // Fetch all agents with debt summaries
      const response = await apiClient.get('/finance/agents') as any;
      setAgents(response.data as AgentWithDebt[]);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettlementSuccess = () => {
    setShowSettlementDialog(false);
    setSelectedAgent(null);
    loadAgents();
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'employeeCode',
      title: 'Employee Code',
      render: (agent: AgentWithDebt) => agent.employeeCode || 'N/A',
    },
    {
      key: 'email',
      title: 'Email',
      render: (agent: AgentWithDebt) => agent.user?.email || 'N/A',
    },
    {
      key: 'totalDebt',
      title: 'Total Collected',
      render: (agent: AgentWithDebt) =>
        `${agent.debtSummary?.totalDebt.toFixed(2) || '0.00'} IQD`,
    },
    {
      key: 'totalSettlements',
      title: 'Total Settled',
      render: (agent: AgentWithDebt) =>
        `${agent.debtSummary?.totalSettlements.toFixed(2) || '0.00'} IQD`,
    },
    {
      key: 'currentBalance',
      title: 'Current Balance',
      render: (agent: AgentWithDebt) => {
        const balance = agent.debtSummary?.currentBalance || 0;
        return (
          <span className={balance > 0 ? 'text-red-600 font-semibold' : ''}>
            {balance.toFixed(2)} IQD
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (agent: AgentWithDebt) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              window.location.href = `/finance/agents/${agent.id}/ledger`;
            }}
          >
            View Ledger
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedAgent(agent);
              setShowSettlementDialog(true);
            }}
            disabled={!agent.debtSummary || agent.debtSummary.currentBalance <= 0}
          >
            Process Settlement
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Finance Management</h1>
        <p className="text-gray-600 mt-2">
          Manage agent debts, settlements, and financial records
        </p>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <Label htmlFor="search">Search Agents</Label>
          <Input
            id="search"
            placeholder="Search by employee code or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <AdminDataTable
          data={filteredAgents}
          columns={columns}
          loading={loading}
        />
      </Card>

      {selectedAgent && (
        <SettlementDialog
          open={showSettlementDialog}
          onClose={() => {
            setShowSettlementDialog(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          onSuccess={handleSettlementSuccess}
        />
      )}
    </div>
  );
}
