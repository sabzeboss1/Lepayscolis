'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import TablePagination from '@/components/admin/TablePagination';

interface WalletDetails {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  balance: number;
  total_credits: number;
  total_debits: number;
  total_adjustments: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'adjustment';
  amount: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

export default function WalletDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [showAdjustBalance, setShowAdjustBalance] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  useEffect(() => {
    params.then(p => setUserId(p.userId));
  }, [params]);

  useEffect(() => {
    if (userId) {
      fetchWalletDetails();
    }
  }, [userId, currentPage, perPage]);

  const fetchWalletDetails = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const params_query = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString()
      });

      const response = await fetch(`/api/admin/wallets/${userId}?${params_query}`);
      const data = await response.json();
      
      setWallet(data.data.wallet);
      setTransactions(data.data.transactions);
      setTotal(data.meta.total);
    } catch (error) {
      console.error('Failed to fetch wallet details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!userId || !adjustmentAmount || parseFloat(adjustmentAmount) === 0 || !adjustmentReason.trim() || adjustmentReason.length < 10) {
      return;
    }

    try {
      await fetch(`/api/admin/wallets/${userId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(adjustmentAmount),
          reason: adjustmentReason
        })
      });
      fetchWalletDetails();
      setShowAdjustBalance(false);
      setAdjustmentAmount('');
      setAdjustmentReason('');
    } catch (error) {
      console.error('Failed to adjust balance:', error);
    }
  };

  if (loading && !wallet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Wallet not found</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'debit':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'adjustment':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'credit':
        return 'text-green-600';
      case 'debit':
        return 'text-red-600';
      case 'adjustment':
        return 'text-blue-600';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{wallet.user.name}'s Wallet</h1>
            <p className="text-sm text-gray-600 mt-1">{wallet.user.email}</p>
          </div>
        </div>

        <button
          onClick={() => setShowAdjustBalance(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Adjust Balance
        </button>
      </div>

      {/* Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Balance</p>
              <p className={`text-2xl font-bold mt-2 ${
                wallet.balance > 0 ? 'text-green-600' : wallet.balance < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {formatCurrency(wallet.balance)}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Credits</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(wallet.total_credits)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Debits</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(wallet.total_debits)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Adjustments</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(wallet.total_adjustments)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">No transactions found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTransactionIcon(transaction.type)}
                        <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'debit' ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{transaction.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.reference_type && transaction.reference_id ? (
                        <span className="text-sm text-gray-500">
                          {transaction.reference_type} #{transaction.reference_id.substring(0, 8)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {new Date(transaction.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > perPage && (
        <TablePagination
          currentPage={currentPage}
          totalPages={Math.ceil(total / perPage)}
          totalItems={total}
          itemsPerPage={perPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newPerPage: number) => {
            setPerPage(newPerPage);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Adjust Balance Modal */}
      {showAdjustBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjust Balance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment Amount
                </label>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="Enter amount (positive to add, negative to subtract)"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current balance: {formatCurrency(wallet.balance)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Adjustment
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Explain why this adjustment is being made (minimum 10 characters)..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <span className={`text-xs ${adjustmentReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                  {adjustmentReason.length} / 10 minimum
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowAdjustBalance(false);
                  setAdjustmentAmount('');
                  setAdjustmentReason('');
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustBalance}
                disabled={!adjustmentAmount || parseFloat(adjustmentAmount) === 0 || adjustmentReason.length < 10}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adjust Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
