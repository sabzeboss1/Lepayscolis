'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAdminCurrency } from '@/lib/hooks/useAdminCurrency';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import { apiClient } from '@/lib/api/client';

interface ShipmentRequest {
  id: string;
  sender: { id: string; name: string; email: string; avatar?: string };
  title: string;
  description: string;
  pickup_country: { id: number; name: string };
  pickup_city: { id: number; name: string };
  delivery_country: { id: number; name: string };
  delivery_city: { id: number; name: string };
  weight: number;
  estimated_value: number;
  currency_code: string;
  status: 'open' | 'assigned' | 'completed' | 'cancelled';
  verification_status?: 'pending' | 'verified' | 'rejected';
  bids_count: number;
  created_at: string;
}

interface ShipmentRequestFilterValues {
  [key: string]: string;
  search: string;
  status: string;
}

export default function ShipmentRequestsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { formatCurrency } = useAdminCurrency();
  const [shipmentRequests, setShipmentRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ShipmentRequestFilterValues>({
    search: '',
    status: ''
  });
  const [selectedRequest, setSelectedRequest] = useState<ShipmentRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchShipmentRequests();
  }, [currentPage, perPage, filters]);

  const fetchShipmentRequests = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: perPage,
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;

      const data = await apiClient.get<{ data: ShipmentRequest[]; meta: { total: number } }>(
        '/api/admin/shipment-requests',
        { params }
      );

      setShipmentRequests(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch shipment requests:', error);
      setShipmentRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request: ShipmentRequest) => {
    setSelectedRequest(request);
    setActionType('approve');
    setShowActionModal(true);
  };

  const handleReject = (request: ShipmentRequest) => {
    setSelectedRequest(request);
    setActionType('reject');
    setRejectReason('');
    setShowActionModal(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === 'reject' && rejectReason.length < 10) {
      alert('La raison du rejet doit contenir au moins 10 caractères');
      return;
    }

    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        await apiClient.post(`/api/admin/shipment-requests/${selectedRequest.id}/approve`);
      } else {
        await apiClient.post(`/api/admin/shipment-requests/${selectedRequest.id}/reject`, {
          reason: rejectReason
        });
      }
      
      setShowActionModal(false);
      setSelectedRequest(null);
      setActionType(null);
      setRejectReason('');
      fetchShipmentRequests();
    } catch (error) {
      console.error('Action failed:', error);
      alert('Une erreur est survenue');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const statusLabels: Record<string, string> = {
      open: 'Ouvert',
      assigned: 'Assigné',
      completed: 'Complété',
      cancelled: 'Annulé'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const columns: Column<ShipmentRequest>[] = [
    {
      key: 'sender',
      label: 'Expéditeur',
      render: (request) => (
        <div>
          <div className="font-medium text-gray-900">{request.sender?.name ?? 'Utilisateur supprimé'}</div>
          <div className="text-sm text-gray-500">{request.sender?.email}</div>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Titre',
      render: (request) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate">{request.title}</div>
          <div className="text-sm text-gray-500 truncate">{request.description}</div>
        </div>
      )
    },
    {
      key: 'route',
      label: 'Itinéraire',
      render: (request) => (
        <div className="text-sm text-gray-900">
          <div>{request.pickup_city?.name || '—'}, {request.pickup_country?.name || '—'}</div>
          <div className="text-gray-500">→</div>
          <div>{request.delivery_city?.name || '—'}, {request.delivery_country?.name || '—'}</div>
        </div>
      )
    },
    {
      key: 'weight',
      label: 'Poids',
      render: (request) => <span className="text-sm text-gray-900">{request.weight} kg</span>
    },
    {
      key: 'estimated_value',
      label: 'Valeur estimée',
      render: (request) => (
        <span className="text-sm text-gray-900">
          {formatCurrency(request.estimated_value, request.currency_code)}
        </span>
      )
    },
    {
      key: 'bids_count',
      label: 'Offres',
      render: (request) => <span className="text-sm text-gray-900">{request.bids_count}</span>
    },
    {
      key: 'status',
      label: 'Statut',
      render: (request) => getStatusBadge(request.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (request) => (
        <div className="flex gap-2">
          {request.status === 'open' && request.verification_status !== 'verified' && request.verification_status !== 'rejected' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(request);
                }}
                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
              >
                Approuver
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(request);
                }}
                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
              >
                Rejeter
              </button>
            </>
          )}
          {request.verification_status === 'verified' && (
            <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded">
              ✓ Approuvé
            </span>
          )}
          {request.verification_status === 'rejected' && (
            <span className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded">
              ✗ Rejeté
            </span>
          )}
        </div>
      )
    }
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'text' as const,
      key: 'search',
      label: 'Rechercher',
      placeholder: 'Rechercher par titre, description...'
    },
    {
      type: 'select' as const,
      key: 'status',
      label: 'Statut',
      options: [
        { value: 'open', label: 'Ouvert' },
        { value: 'assigned', label: 'Assigné' },
        { value: 'completed', label: 'Complété' },
        { value: 'cancelled', label: 'Annulé' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Annonces de colis</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gérer les annonces de colis publiées par les utilisateurs
          </p>
        </div>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={(newFilters) => {
          setFilters(newFilters as ShipmentRequestFilterValues);
          setCurrentPage(1);
        }}
        onReset={() => setFilters({ search: '', status: '' })}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={shipmentRequests}
        loading={loading}
        emptyMessage="Aucune annonce trouvée"
        onRowClick={(request) => {
          setSelectedRequest(request);
          setShowDetailsModal(true);
        }}
        getRowId={(request) => request.id}
      />

      {/* Pagination */}
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

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-3xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Détails de l'annonce</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Sender Info */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Expéditeur</h4>
                <div className="flex items-center gap-3">
                  {selectedRequest.sender?.avatar && (
                    <img
                      src={selectedRequest.sender.avatar}
                      alt={selectedRequest.sender?.name ?? ''}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{selectedRequest.sender?.name ?? 'Utilisateur supprimé'}</p>
                    <p className="text-sm text-gray-500">{selectedRequest.sender?.email}</p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Informations de l'annonce</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Titre</p>
                    <p className="font-medium text-gray-900">{selectedRequest.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-900">{selectedRequest.description}</p>
                  </div>
                </div>
              </div>

              {/* Route Info */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Itinéraire</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Départ</p>
                    <p className="font-medium text-gray-900">
                      {selectedRequest.pickup_city?.name || '—'}, {selectedRequest.pickup_country?.name || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium text-gray-900">
                      {selectedRequest.delivery_city?.name || '—'}, {selectedRequest.delivery_country?.name || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Package Info */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Informations du colis</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Poids</p>
                    <p className="font-medium text-gray-900">{selectedRequest.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valeur estimée</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(selectedRequest.estimated_value, selectedRequest.currency_code)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nombre d'offres</p>
                    <p className="font-medium text-gray-900">{selectedRequest.bids_count}</p>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Date de création</h4>
                <p className="text-gray-900">
                  {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Actions */}
              {selectedRequest.status === 'open' && (
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleApprove(selectedRequest);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleReject(selectedRequest);
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approuver l\'annonce' : 'Rejeter l\'annonce'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Titre:</span> {selectedRequest.title}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Expéditeur:</span> {selectedRequest.sender?.name ?? 'Utilisateur supprimé'}
              </p>
            </div>

            {actionType === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du rejet (minimum 10 caractères)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Expliquez pourquoi cette annonce est rejetée..."
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedRequest(null);
                  setActionType(null);
                  setRejectReason('');
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmAction}
                disabled={actionLoading || (actionType === 'reject' && rejectReason.length < 10)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading ? 'En cours...' : actionType === 'approve' ? 'Approuver' : 'Rejeter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
