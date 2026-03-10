'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KYCBlocker } from '@/components/features/KYCBlocker';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { useRealtimeWalletBalance } from '@/lib/hooks/useRealtimeWallet';
import type { Wallet, WalletTransaction, PaginatedResponse } from '@/lib/types/api';

export default function WalletPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Real-time balance updates via WebSocket
  const { balance: realtimeBalance } = useRealtimeWalletBalance();

  // Update balance when WebSocket receives update
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
      // Fetch wallet balance
      const walletResponse = await apiClient.get<{ data: Wallet }>(
        API_ENDPOINTS.wallet.balance
      );
      setBalance(walletResponse.data.balance);
      setCurrency(walletResponse.data.currency);
      
      // Fetch transactions with pagination
      const transactionsResponse = await apiClient.get<PaginatedResponse<WalletTransaction>>(
        API_ENDPOINTS.wallet.transactions,
        {
          params: {
            page: currentPage,
            per_page: 10,
          }
        }
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
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'debit':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'credit':
        return locale === 'en' ? 'Credit' : 'Crédit';
      case 'debit':
        return locale === 'en' ? 'Debit' : 'Débit';
      default:
        return type;
    }
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  if (isLoading) {
    return (
      <KYCBlocker action="consulter votre portefeuille">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </KYCBlocker>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <KYCBlocker action="consulter votre portefeuille">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {locale === 'en' ? 'My Wallet' : 'Mon Portefeuille'}
        </h1>
        <p className="text-gray-600 mt-2">
          {locale === 'en' ? 'Manage your earnings and withdrawal requests' : 'Gérez vos gains et demandes de retrait'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Balance Card */}
      <Card className="mb-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-2">
                {locale === 'en' ? 'Available balance' : 'Solde disponible'}
              </p>
              <h2 className="text-4xl font-bold">{formatCurrency(balance)}</h2>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <Button
              variant="outline"
              className="bg-white text-blue-600 hover:bg-blue-50 border-0"
              onClick={() => router.push('/wallet/withdraw')}
            >
              {locale === 'en' ? 'Request withdrawal' : 'Demander un retrait'}
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:bg-white hover:bg-opacity-10"
              onClick={() => router.push('/wallet/withdrawals')}
            >
              {locale === 'en' ? 'My withdrawals' : 'Mes retraits'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions Section */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {locale === 'en' ? 'Transaction history' : 'Historique des transactions'}
            </h3>
            
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {locale === 'en' ? 'All' : 'Tout'}
              </button>
              <button
                onClick={() => setFilter('credit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'credit'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {locale === 'en' ? 'Credits' : 'Crédits'}
              </button>
              <button
                onClick={() => setFilter('debit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'debit'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {locale === 'en' ? 'Debits' : 'Débits'}
              </button>
            </div>
          </div>

          {isLoadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500">
                {locale === 'en' ? 'No transactions found' : 'Aucune transaction trouvée'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {getTransactionIcon(transaction.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {getTransactionLabel(transaction.type)}
                          </span>
                          <span className={`text-sm font-semibold ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(transaction.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    {locale === 'en' ? 'Previous' : 'Précédent'}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {locale === 'en' ? `Page ${currentPage} of ${totalPages}` : `Page ${currentPage} sur ${totalPages}`}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {locale === 'en' ? 'Next' : 'Suivant'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
    </KYCBlocker>
  );
}
