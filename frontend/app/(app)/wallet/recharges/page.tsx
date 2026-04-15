'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { useUserCurrency } from '@/lib/hooks/useUserCurrency';
import {
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader,
  Wallet,
} from 'lucide-react';

interface RechargeRequest {
  id: string;
  amount: number;
  currency_code: string;
  payment_method: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
}

export default function RechargeRequestsPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { formatCurrency } = useUserCurrency();
  
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ data: RechargeRequest[] }>('/api/recharge-requests');
      setRequests(response.data);
    } catch (err) {
      const errorResponse = ErrorHandler.handle(err, locale);
      setError(errorResponse.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En cours',
      completed: 'Complétée',
      rejected: 'Rejetée',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      direct_payment: 'Paiement direct',
      bank_transfer: 'Virement bancaire',
      mobile_money: 'Mobile Money',
    };
    return labels[method] || method;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 font-heading">
                  Mes demandes de recharge
                </h1>
                <p className="text-sm text-slate-500">
                  {requests.length} demande{requests.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button variant="primary" onClick={() => router.push('/wallet/recharge')}>
              <Plus className="w-4 h-4 mr-1.5" />
              Nouvelle demande
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-4">Aucune demande de recharge trouvée</p>
            <Button variant="primary" onClick={() => router.push('/wallet/recharge')}>
              <Plus className="w-4 h-4 mr-1.5" />
              Créer une demande
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(request.amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getPaymentMethodLabel(request.payment_method)}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {getStatusLabel(request.status)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span>
                    Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  {request.processed_at && (
                    <span>
                      Traité le {new Date(request.processed_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                {request.admin_notes && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs font-medium text-slate-700 mb-1">Note de l'administrateur :</p>
                    <p className="text-xs text-slate-600">{request.admin_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
