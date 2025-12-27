'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';

interface Agent {
  id: string;
  employeeCode: string;
  user: {
    email: string;
  };
  debtSummary?: {
    currentBalance: number;
  };
}

interface SettlementDialogProps {
  open: boolean;
  onClose: () => void;
  agent: Agent;
  onSuccess: () => void;
}

export function SettlementDialog({
  open,
  onClose,
  agent,
  onSuccess,
}: SettlementDialogProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentBalance = agent.debtSummary?.currentBalance || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const settlementAmount = parseFloat(amount);

    if (isNaN(settlementAmount) || settlementAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (settlementAmount > currentBalance) {
      setError(
        `Settlement amount cannot exceed current balance (${currentBalance.toFixed(2)} IQD)`
      );
      return;
    }

    try {
      setLoading(true);

      // Get current user ID (accountant)
      const userResponse = await apiClient.post('/auth/me');
      const accountantId = userResponse.data.id;

      await apiClient.post('/finance/settlements', {
        agentId: agent.id,
        amount: settlementAmount,
        accountantId,
        notes: notes || undefined,
      });

      onSuccess();
      setAmount('');
      setNotes('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process settlement');
    } finally {
      setLoading(false);
    }
  };

  const handleSetFullAmount = () => {
    setAmount(currentBalance.toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Process Settlement</h2>

        <div className="mb-4 p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">Agent</p>
          <p className="font-semibold">
            {agent.employeeCode} - {agent.user?.email}
          </p>
          <p className="text-sm text-gray-600 mt-2">Current Balance</p>
          <p className="text-2xl font-bold text-red-600">
            {currentBalance.toFixed(2)} IQD
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Settlement Amount (IQD)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={currentBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSetFullAmount}
                >
                  Full Amount
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this settlement..."
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Process Settlement'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
