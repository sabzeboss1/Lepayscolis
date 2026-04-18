'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, DollarSign, X } from 'lucide-react';
import TablePagination from '@/components/admin/TablePagination';
import { useTranslation } from '@/lib/i18n';
import { useAdminCurrency } from '@/lib/hooks/useAdminCurrency';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
}

interface WalletDetails {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  balance: number;
  currency_code: string;
  total_credits: number;
  total_debits: number;
  total_adjustments: number;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'adjustment' | 'refund';
  amount: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  balance_after: number;
  created_at: string;
}

export default function WalletDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustCurrency, setAdjustCurrency] = useState('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const data = await apiClient.get<any>(API_ENDPOINTS.currencies.list);
        setCurrencies(data.data ?? []);
      } catch {
        // keep empty
      }
    };
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (userId) fetchWalletDetails();
  }, [userId, currentPage, perPage]);

  const fetchWalletDetails = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: perPage,
      };

      const data = await apiClient.get<any>(API_ENDPOINTS.admin.wallets.show(userId), { params });
      setWallet({
        user: data.data.user,
        balance: data.data.wallet.balance,
        currency_code: data.data.wallet.currency_code,
        total_credits: data.data.aggregates?.total_credits ?? 0,
        total_debits: data.data.aggregates?.total_debits ?? 0,
        total_adjustments: data.data.aggregates?.total_adjustments ?? 0,
      });
      if (!adjustCurrency) {
        setAdjustCurrency(defaultCurrency);
      }
      setTransactions(data.data.transactions ?? []);
      setTotal(data.meta?.total ?? 0);
    } catch (error) {
      console.error('Failed to fetch wallet details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!userId || !adjustAmount || parseFloat(adjustAmount) <= 0 || adjustReason.length < 10) return;

    setAdjusting(true);
    setAdjustError(null);
    try {
      await apiClient.post<any>(API_ENDPOINTS.admin.wallets.adjust(userId), {
        amount: parseFloat(adjustAmount),
        type: adjustType,
        reason: adjustReason,
        currency_code: adjustCurrency,
      });

      fetchWalletDetails();
      closeAdjustModal();
    } catch (error: any) {
      setAdjustError(error.message);
    } finally {
      setAdjusting(false);
    }
  };

  const closeAdjustModal = () => {
    setShowAdjustModal(false);
    setAdjustType('credit');
    setAdjustAmount('');
    setAdjustReason('');
    setAdjustCurrency(defaultCurrency);
    setAdjustError(null);
  };

  const getConvertedPreview = (): { amount: number; rate: number } | null => {
    if (!adjustAmount || !adjustCurrency || !wallet) return null;
    if (adjustCurrency === wallet.currency_code) return null;

    const fromRate = currencies.find((c) => c.code === adjustCurrency)?.exchange_rate;
    const toRate = currencies.find((c) => c.code === wallet.currency_code)?.exchange_rate;
    if (!fromRate || !toRate) return null;

    const rate = toRate / fromRate;
    return { amount: Math.round(parseFloat(adjustAmount) * rate * 100) / 100, rate: Math.round(rate * 1000000) / 1000000 };
  };

  const { formatCurrency, defaultCurrency } = useAdminCurrency();

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      credit: t('admin.wallets.detail.credit'),
      debit: t('admin.wallets.detail.debit'),
      adjustment: t('admin.wallets.detail.adjustment'),
      refund: t('admin.wallets.detail.refund'),
    };
    return map[type] || type;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit':
      case 'refund':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'debit':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'adjustment':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'credit':
      case 'refund':
        return 'text-green-600';
      case 'debit':
        return 'text-red-600';
      case 'adjustment':
        return 'text-blue-600';
      default:
        return 'text-gray-900';
    }
  };

  if (loading && !wallet) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!wallet || !wallet.user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('admin.wallets.detail.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/wallets')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('admin.wallets.detail.title', { name: wallet.user.name })}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{wallet.user.email}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdjustModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          {t('admin.wallets.detail.adjustBalance')}
        </button>
      </div>

      {/* Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('admin.wallets.detail.currentBalance')}</p>
              <p className={`text-2xl font-bold mt-2 ${
                wallet.balance > 0 ? 'text-green-600' : wallet.balance < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {formatCurrency(wallet.balance, wallet.currency_code)}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('admin.wallets.detail.totalCredits')}</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(wallet.total_credits, wallet.currency_code)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('admin.wallets.detail.totalDebits')}</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(wallet.total_debits, wallet.currency_code)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('admin.wallets.detail.totalAdjustments')}</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(wallet.total_adjustments, wallet.currency_code)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.wallets.detail.transactionHistory')}</h2>
        </div>
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">{t('admin.wallets.noTransactions')}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.wallets.detail.type')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.wallets.detail.amount')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.wallets.detail.description')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.wallets.detail.reference')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.wallets.detail.date')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(tx.type)}
                        <span className="ml-2 text-sm font-medium text-gray-900">{getTypeLabel(tx.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getTypeColor(tx.type)}`}>
                        {tx.type === 'debit' ? '-' : '+'}{formatCurrency(Math.abs(tx.amount), wallet.currency_code)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{tx.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.reference_type && tx.reference_id ? (
                        <span className="text-sm text-gray-500">
                          {tx.reference_type} #{tx.reference_id.substring(0, 8)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
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
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.wallets.detail.adjustBalance')}</h3>
              <button onClick={closeAdjustModal}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            {adjustError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {adjustError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.wallets.detail.adjustmentType')}
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as 'credit' | 'debit')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="credit">{t('admin.wallets.detail.typeCredit')}</option>
                  <option value="debit">{t('admin.wallets.detail.typeDebit')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.wallets.detail.adjustmentAmount')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={adjustCurrency}
                    onChange={(e) => setAdjustCurrency(e.target.value)}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.wallets.detail.currentBalance')}: {formatCurrency(wallet.balance, wallet.currency_code)}
                  {' '}({wallet.currency_code})
                </p>
                {(() => {
                  const preview = getConvertedPreview();
                  if (!preview) return null;
                  return (
                    <p className="text-xs text-blue-600 mt-1">
                      ≈ {formatCurrency(preview.amount, wallet.currency_code)} {wallet.currency_code} ({t('admin.wallets.detail.exchangeRate')}: {preview.rate})
                    </p>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.wallets.detail.reason')}
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder={t('admin.wallets.detail.reasonPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <span className={`text-xs ${adjustReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                  {t('admin.wallets.detail.reasonMinChars', { count: adjustReason.length })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={closeAdjustModal}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAdjustBalance}
                disabled={adjusting || !adjustAmount || parseFloat(adjustAmount) <= 0 || adjustReason.length < 10}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {adjusting ? t('admin.wallets.detail.adjusting') : t('admin.wallets.detail.confirmAdjust')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
