'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import { useTranslation } from '@/lib/i18n';
import { useAdminCurrency } from '@/lib/hooks/useAdminCurrency';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, XCircle, Loader, Eye } from 'lucide-react';

interface RechargeRequest {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  amount: number;
  currency_code: string;
  payment_method: string;
  payment_details?: Record<string, string>;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  processed_at?: string;
  processed_by?: {
    name: string;
  };
}

interface FilterValues {
  [key: string]: string;
  status: string;
  search: string;
}

export default function AdminRechargeRequestsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { formatCurrency } = useAdminCurrency();
  
  const [requests, setRequests] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<FilterValues>({ status: '', search: '' });
  const [selectedRequest, setSelectedRequest] = useState<RechargeRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'complete' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, perPage, filters]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: perPage,
      };

      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const response = await apiClient.get<any>(API_ENDPOINTS.admin.rechargeRequests.list, { params });
      setRequests(Array.isArray(response.data) ? response.data : []);
      setTotal(response.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch recharge requests:', error);
      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters as FilterValues);
    setCurrentPage(1);
  };

  const handleAction = (request: RechargeRequest, type: 'complete' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNotes('');
    setShowModal(true);
  };

  const handleMarkProcessing = async (request: RechargeRequest) => {
    try {
      await apiClient.post(API_ENDPOINTS.admin.rechargeRequests.processing(request.id));
      fetchRequests();
    } catch (error) {
      console.error('Failed to mark as processing:', error);
    }
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsProcessing(true);
    try {
      if (actionType === 'complete') {
        await apiClient.post(API_ENDPOINTS.admin.rechargeRequests.complete(selectedRequest.id), {
          admin_notes: adminNotes,
        });
      } else {
        await apiClient.post(API_ENDPOINTS.admin.rechargeRequests.reject(selectedRequest.id), {
          admin_notes: adminNotes,
        });
      }
      setShowModal(false);
      fetchRequests();
    } catch (error) {
      console.error('Failed to process request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En cours',
      completed: 'Complétée',
      rejected: 'Rejetée',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      direct_payment: 'Paiement direct',
      bank_transfer: 'Virement bancaire',
      mobile_money: 'Mobile Money',
    };
    return labels[method] || method;
  };

  const renderContactInfo = (request: RechargeRequest) => {
    const details = request.payment_details || {};
    const method = request.payment_method;

    if (!details || Object.keys(details).length === 0) {
      return <span className="text-xs text-gray-400">Non renseigné</span>;
    }

    return (
      <div className="text-xs space-y-1">
        {method === 'direct_payment' && (
          <>
            {details.phone && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-600">📞</span>
                <a href={`tel:${details.phone}`} className="text-blue-600 hover:underline">
                  {details.phone}
                </a>
              </div>
            )}
            {details.preferred_contact_time && (
              <div className="text-gray-600">
                <span className="font-medium">⏰</span> {details.preferred_contact_time}
              </div>
            )}
          </>
        )}
        {method === 'bank_transfer' && (
          <>
            {details.bank_name && (
              <div className="text-gray-600">
                <span className="font-medium">🏦</span> {details.bank_name}
              </div>
            )}
            {details.account_holder && (
              <div className="text-gray-600">
                <span className="font-medium">👤</span> {details.account_holder}
              </div>
            )}
            {details.reference && (
              <div className="text-gray-600">
                <span className="font-medium">🔖</span> {details.reference}
              </div>
            )}
          </>
        )}
        {method === 'mobile_money' && (
          <>
            {details.provider && (
              <div className="text-gray-600">
                <span className="font-medium">📱</span> {details.provider}
              </div>
            )}
            {details.phone_number && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-600">📞</span>
                <a href={`tel:${details.phone_number}`} className="text-blue-600 hover:underline">
                  {details.phone_number}
                </a>
              </div>
            )}
            {details.account_name && (
              <div className="text-gray-600">
                <span className="font-medium">👤</span> {details.account_name}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const columns: Column<RechargeRequest>[] = [
    {
      key: 'user',
      label: 'Utilisateur',
      render: (request) => (
        <div>
          <div className="font-medium text-gray-900">{request.user?.name ?? 'Utilisateur supprimé'}</div>
          <div className="text-sm text-gray-500">{request.user?.email}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (request) => (
        <span className="font-semibold text-emerald-600">
          {formatCurrency(request.amount, request.currency_code)}
        </span>
      ),
    },
    {
      key: 'payment_method',
      label: 'Méthode',
      render: (request) => (
        <span className="text-sm text-gray-700">{getPaymentMethodLabel(request.payment_method)}</span>
      ),
    },
    {
      key: 'contact_info',
      label: 'Informations de contact',
      render: (request) => renderContactInfo(request),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (request) => getStatusBadge(request.status),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (request) => (
        <span className="text-sm text-gray-500">
          {new Date(request.created_at).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (request) => (
        <div className="flex items-center gap-2">
          {request.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMarkProcessing(request)}
                className="text-blue-600 hover:bg-blue-50"
              >
                <Loader className="w-4 h-4 mr-1" />
                Traiter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAction(request, 'complete')}
                className="text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Valider
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAction(request, 'reject')}
                className="text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejeter
              </Button>
            </>
          )}
          {request.status === 'processing' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAction(request, 'complete')}
                className="text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Valider
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAction(request, 'reject')}
                className="text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejeter
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => request.user && router.push(`/admin/wallets/${request.user.id}`)}
            className="text-gray-600 hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'select',
      key: 'status',
      label: 'Statut',
      options: [
        { value: '', label: 'Tous' },
        { value: 'pending', label: 'En attente' },
        { value: 'processing', label: 'En cours' },
        { value: 'completed', label: 'Complétées' },
        { value: 'rejected', label: 'Rejetées' },
      ],
    },
    {
      type: 'text',
      key: 'search',
      label: 'Rechercher',
      placeholder: 'Nom ou email...',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Demandes de recharge</h1>
        <p className="text-sm text-gray-600 mt-1">Gérer les demandes de recharge des utilisateurs</p>
      </div>

      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => { setFilters({ status: '', search: '' }); setCurrentPage(1); }}
      />

      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        emptyMessage="Aucune demande de recharge trouvée"
        getRowId={(request) => request.id}
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={Math.ceil(total / perPage)}
        itemsPerPage={perPage}
        totalItems={total}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newPerPage: number) => {
          setPerPage(newPerPage);
          setCurrentPage(1);
        }}
      />

      {/* Action Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'complete' ? 'Valider la recharge' : 'Rejeter la demande'}
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Utilisateur</p>
                <p className="font-medium text-gray-900">{selectedRequest.user?.name ?? 'Utilisateur supprimé'}</p>
                <p className="text-sm text-gray-500">{selectedRequest.user?.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Montant</p>
                <p className="font-bold text-emerald-600">
                  {formatCurrency(selectedRequest.amount, selectedRequest.currency_code)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Méthode de paiement</p>
                <p className="text-sm font-medium text-gray-900">
                  {getPaymentMethodLabel(selectedRequest.payment_method)}
                </p>
              </div>

              {/* Contact Information */}
              {selectedRequest.payment_details && Object.keys(selectedRequest.payment_details).length > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 font-medium">Informations de contact</p>
                  {renderContactInfo(selectedRequest)}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes {actionType === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={actionType === 'complete' ? 'Notes optionnelles...' : 'Raison du rejet (obligatoire)'}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isProcessing}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={confirmAction}
                disabled={isProcessing || (actionType === 'reject' && !adminNotes)}
                loading={isProcessing}
                className={actionType === 'complete' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {actionType === 'complete' ? 'Valider et créditer' : 'Rejeter'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
