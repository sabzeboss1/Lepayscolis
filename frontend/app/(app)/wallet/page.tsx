'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { KYCBlocker } from '@/components/features/KYCBlocker';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { useRealtimeWalletBalance } from '@/lib/hooks/useRealtimeWallet';
import type { Wallet, WalletTransaction, PaginatedResponse } from '@/lib/types/api';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Banknote,
  Clock,
  RefreshCw,
} from 'lucide-react';

type FilterType = 'all' | 'credit' | 'debit';

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'credit', label: 'Crédits' },
  { key: 'debit', label: 'Débits' },
];

function TransactionRow({ transaction, formatCurrency, formatDate }: {
  transaction: WalletTransaction;
  formatCurrency: (n: number) => string;
  formatDate: (s: string) => string;
}) {
  const isCredit = transaction.type === 'credit';
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-slate-100 last:border-0 group">
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isCredit ? 'bg-emerald-50' : 'bg-red-50'
        }`}
      >
        {isCredit ? (
          <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
        ) : (
          <ArrowUpRight className="w-5 h-5 text-red-500" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{transaction.description}</p>
        <p className="text-xs text-slate-500 mt-0.5">{formatDate(transaction.created_at)}</p>
      </div>

      {/* Amount */}
      <span
        className={`text-sm font-bold shrink-0 ${
          isCredit ? 'text-emerald-600' : 'text-red-500'
        }`}
      >
        {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
      </span>
    </div>
  );
}

export default function WalletPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [heldBalance, setHeldBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { balance: realtimeBalance } = useRealtimeWalletBalance();

  useEffect(() => {
    if (realtimeBalance !== null) {
      setBalance(realtimeBalance);
    }
  }, [realtimeBalance]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user, currentPage]);

  const fetchWalletData = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const walletResponse = await apiClient.get<{ data: Wallet }>(API_ENDPOINTS.wallet.balance);
      setBalance(walletResponse.data.balance);
      setHeldBalance(walletResponse.data.held_balance);
      setAvailableBalance(walletResponse.data.available_balance);
      setCurrency(walletResponse.data.currency);

      const transactionsResponse = await apiClient.get<PaginatedResponse<WalletTransaction>>(
        API_ENDPOINTS.wallet.transactions,
        { params: { page: currentPage, per_page: 10 } }
      );
      setTransactions(transactionsResponse.data);
      setTotalPages(transactionsResponse.meta.last_page);
    } catch (err) {
      const errorResponse = ErrorHandler.handle(err, locale);
      setError(errorResponse.message);
      ErrorHandler.log(err, { endpoint: 'wallet', method: 'GET' });
    } finally {
      setIsLoadingData(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const currencyCode = currency || 'EUR';
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTransactions =
    filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

  const creditSum = transactions
    .filter((t) => t.type === 'credit')
    .reduce((a, t) => a + t.amount, 0);
  const debitSum = transactions
    .filter((t) => t.type === 'debit')
    .reduce((a, t) => a + t.amount, 0);

  if (isLoading) {
    return (
      <KYCBlocker action="consulter votre portefeuille">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent mx-auto" />
            <p className="mt-3 text-sm text-slate-500">{t('common.loading')}</p>
          </div>
        </div>
      </KYCBlocker>
    );
  }

  if (!user) return null;

  return (
    <KYCBlocker action="consulter votre portefeuille">
      <div className="min-h-screen bg-slate-50">
        {/* Page header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <WalletIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 font-heading">Mon Portefeuille</h1>
                <p className="text-sm text-slate-500">Gérez vos gains et retraits</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Balance Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-800 text-white p-6 sm:p-8">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute top-10 -right-5 w-24 h-24 bg-orange-500/10 rounded-full" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                  <WalletIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-blue-200">Solde total</span>
              </div>
              <div className="text-4xl sm:text-5xl font-bold tracking-tight mt-2">
                {formatCurrency(balance)}
              </div>

              {/* Held balance indicator */}
              {heldBalance > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span className="text-blue-200">
                    {formatCurrency(heldBalance)} en attente
                  </span>
                  <span className="text-blue-300/60">•</span>
                  <span className="text-emerald-300 font-semibold">
                    {formatCurrency(availableBalance)} disponible
                  </span>
                </div>
              )}

              {/* Quick stats */}
              <div className="flex gap-6 mt-5 pt-5 border-t border-white/10">
                <div>
                  <div className="flex items-center gap-1 text-xs text-blue-300 mb-0.5">
                    <ArrowDownLeft className="w-3 h-3" />
                    Reçu
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    +{formatCurrency(creditSum)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-blue-300 mb-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    Envoyé
                  </div>
                  <span className="text-sm font-semibold text-red-400">
                    -{formatCurrency(debitSum)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-5">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/wallet/recharge')}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <TrendingUp className="w-4 h-4 mr-1.5" />
                  Recharger
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/wallet/withdraw')}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Banknote className="w-4 h-4 mr-1.5" />
                  Retirer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/wallet/withdrawals')}
                  className="text-white hover:bg-white/10 border border-white/20"
                >
                  Historique
                </Button>
              </div>
            </div>
          </div>

          {/* Transactions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header with filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Historique des transactions</h3>
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      filter === tab.key
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5">
              {isLoadingData ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
                  <span className="text-sm text-slate-400">Chargement...</span>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="py-14 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">Aucune transaction trouvée</p>
                </div>
              ) : (
                <>
                  <div>
                    {filteredTransactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between py-4 border-t border-slate-100">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Précédent
                      </button>
                      <span className="text-xs text-slate-500">
                        Page {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Suivant
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </KYCBlocker>
  );
}
