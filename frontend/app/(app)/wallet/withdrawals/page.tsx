'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import type { WithdrawalRequest, PaginatedResponse } from '@/lib/types/api';
import {
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Banknote,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type FilterType = 'all' | 'pending' | 'approved' | 'completed' | 'rejected';

const FILTER_TABS: { key: FilterType; label: string; activeClass: string }[] = [
  { key: 'all', label: 'Tout', activeClass: 'bg-white text-slate-900 shadow-sm' },
  { key: 'pending', label: 'En attente', activeClass: 'bg-white text-slate-900 shadow-sm' },
  { key: 'approved', label: 'Approuvé', activeClass: 'bg-white text-slate-900 shadow-sm' },
  { key: 'completed', label: 'Complété', activeClass: 'bg-white text-slate-900 shadow-sm' },
  { key: 'rejected', label: 'Rejeté', activeClass: 'bg-white text-slate-900 shadow-sm' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; iconBg: string; iconColor: string; badgeBg: string; badgeText: string; badgeBorder: string }> = {
  pending: {
    label: 'En attente',
    icon: <Clock className="w-5 h-5" />,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
  },
  approved: {
    label: 'Approuvé',
    icon: <CheckCircle2 className="w-5 h-5" />,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  processing: {
    label: 'En traitement',
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
  },
  completed: {
    label: 'Complété',
    icon: <CheckCircle2 className="w-5 h-5" />,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  rejected: {
    label: 'Rejeté',
    icon: <XCircle className="w-5 h-5" />,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    badgeBorder: 'border-red-200',
  },
  cancelled: {
    label: 'Annulé',
    icon: <XCircle className="w-5 h-5" />,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
  },
};

export default function WithdrawalsPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
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
      const params: Record<string, any> = { page: currentPage, per_page: 10 };
      if (filter !== 'all') params.status = filter;
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
    const confirmMessage =
      locale === 'en'
        ? 'Are you sure you want to cancel this withdrawal request?'
        : 'Êtes-vous sûr de vouloir annuler cette demande de retrait ?';
    if (!confirm(confirmMessage)) return;
    try {
      await apiClient.delete(API_ENDPOINTS.withdrawals.show(id));
      fetchWithdrawals();
    } catch (err) {
      const errorResponse = ErrorHandler.handle(err, locale);
      alert(errorResponse.message);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const filteredWithdrawals =
    filter === 'all' ? withdrawals : withdrawals.filter((w) => w.status === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.push('/wallet')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au portefeuille
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-heading">
                Mes demandes de retrait
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Suivez l'état de vos demandes de retrait
              </p>
            </div>
            <Button variant="primary" onClick={() => router.push('/wallet/withdraw')}>
              <Plus className="w-4 h-4 mr-1.5" />
              Nouvelle demande
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                filter === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
            <span className="text-sm text-slate-400">Chargement...</span>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Banknote className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-4">Aucune demande de retrait trouvée</p>
            <Button variant="primary" onClick={() => router.push('/wallet/withdraw')}>
              <Plus className="w-4 h-4 mr-1.5" />
              Créer une demande
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWithdrawals.map((withdrawal) => {
              const cfg = STATUS_CONFIG[withdrawal.status] ?? STATUS_CONFIG.pending;
              const anyWithdrawal = withdrawal as any;
              return (
                <div
                  key={withdrawal.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Status icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg} ${cfg.iconColor}`}>
                      {cfg.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top row */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-slate-900">
                            {formatCurrency(withdrawal.amount)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        {withdrawal.status === 'pending' && (
                          <button
                            onClick={() => handleCancelWithdrawal(withdrawal.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            Annuler
                          </button>
                        )}
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                        <div>
                          <p className="text-slate-400 mb-0.5">Demandé le</p>
                          <p className="text-slate-700 font-medium">
                            {formatDate(anyWithdrawal.requested_at ?? withdrawal.created_at)}
                          </p>
                        </div>
                        {anyWithdrawal.fee > 0 && (
                          <div>
                            <p className="text-slate-400 mb-0.5">Frais</p>
                            <p className="text-slate-700 font-medium">
                              {formatCurrency(anyWithdrawal.fee)}
                            </p>
                          </div>
                        )}
                        {anyWithdrawal.net_amount != null && (
                          <div>
                            <p className="text-slate-400 mb-0.5">Montant net</p>
                            <p className="font-semibold text-emerald-600">
                              {formatCurrency(anyWithdrawal.net_amount)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status notes */}
                      {withdrawal.status === 'pending' && (
                        <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                          Votre demande est en cours de traitement par un administrateur.
                        </div>
                      )}
                      {withdrawal.status === 'approved' && (
                        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                          Votre demande a été approuvée et sera traitée sous peu.
                        </div>
                      )}
                      {anyWithdrawal.rejection_reason && (
                        <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
                          <span className="font-semibold">Raison du rejet : </span>
                          {anyWithdrawal.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
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
          </div>
        )}
      </div>
    </div>
  );
}
