'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import type { WithdrawalRequest, PaginatedResponse } from '@/lib/types/api';

export default function WithdrawalsPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
    }
  }, [user, currentPage, filter]);

  const fetchWithdrawals = async () => {
    setIsLoadingData(true);
    setError(null);
    
    try {
      const params: any = {
        page: currentPage,
        per_page: 10,
      };
      
      if (filter !== 'all') {
        params.status = filter;
      }
      
      const response = await apiClient.get<PaginatedResponse<WithdrawalRequest>>(
        API_ENDPOINTS.withdrawals.list,
        { params }
      );
      
      setWithdrawals(response.data);
      setTotalPages(response.meta.last_page);
    } catch (err) {
      const errorResponse = ErrorHandler.handle(err, locale);
      setError(errorResponse.message);
      ErrorHandler.log(err, { endpoint: 'withdrawals', method: 'GET' });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCancelWithdrawal = async (id: string) => {
    const confirmMessage = locale === 'en' 
      ? 'Are you sure you want to cancel this withdrawal request?'
      : 'Êtes-vous sûr de vouloir annuler cette demande de retrait ?';
      
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await apiClient.delete(API_ENDPOINTS.withdrawals.show(id));
      
      // Refresh the list
      fetchWithdrawals();
    } catch (err) {
      const errorResponse = ErrorHandler.handle(err, locale);
      alert(errorResponse.message);
      ErrorHandler.log(err, { endpoint: `withdrawals/${id}`, method: 'DELETE' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
      style: 'currency',
      currency: 'EUR',
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

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        label: locale === 'en' ? 'Pending' : 'En attente' 
      },
      approved: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        label: locale === 'en' ? 'Approved' : 'Approuvé' 
      },
      processing: { 
        bg: 'bg-purple-100', 
        text: 'text-purple-800', 
        label: locale === 'en' ? 'Processing' : 'En traitement' 
      },
      completed: { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        label: locale === 'en' ? 'Completed' : 'Complété' 
      },
      rejected: { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        label: locale === 'en' ? 'Rejected' : 'Rejeté' 
      },
      cancelled: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-800', 
        label: locale === 'en' ? 'Cancelled' : 'Annulé' 
      }
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'approved':
      case 'processing':
        return (
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'completed':
        return (
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'rejected':
        return (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const filteredWithdrawals = filter === 'all' 
    ? withdrawals 
    : withdrawals.filter(w => w.status === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/wallet')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour au portefeuille
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes demandes de retrait</h1>
            <p className="text-gray-600 mt-2">Suivez l'état de vos demandes de retrait</p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/wallet/withdraw')}
          >
            Nouvelle demande
          </Button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tout
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En attente
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'approved'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Approuvé
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Complété
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'rejected'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Rejeté
        </button>
      </div>

      {/* Withdrawals List */}
      {isLoadingData ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : filteredWithdrawals.length === 0 ? (
        <Card className="p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 mb-4">Aucune demande de retrait trouvée</p>
          <Button
            variant="primary"
            onClick={() => router.push('/wallet/withdraw')}
          >
            Créer une demande
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredWithdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {getStatusIcon(withdrawal.status)}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatCurrency(withdrawal.amount)}
                        </h3>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      {withdrawal.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelWithdrawal(withdrawal.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Annuler
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Demandé le</p>
                        <p className="text-gray-900 font-medium">{formatDate(withdrawal.created_at)}</p>
                      </div>

                      <div>
                        <p className="text-gray-500">Montant</p>
                        <p className="text-green-600 font-semibold">{formatCurrency(withdrawal.amount)}</p>
                      </div>
                    </div>

                    {withdrawal.processed_at && (
                      <div className="mt-3 text-sm">
                        <p className="text-gray-500">
                          Traité le {formatDate(withdrawal.processed_at)}
                        </p>
                      </div>
                    )}

                    {withdrawal.admin_notes && withdrawal.status === 'rejected' && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-800 mb-1">Raison du rejet :</p>
                        <p className="text-sm text-red-700">{withdrawal.admin_notes}</p>
                      </div>
                    )}

                    {withdrawal.status === 'pending' && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-700">
                          Votre demande est en cours de traitement par un administrateur.
                        </p>
                      </div>
                    )}

                    {withdrawal.status === 'approved' && (
                      <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-700">
                          Votre demande a été approuvée et sera traitée sous peu.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
