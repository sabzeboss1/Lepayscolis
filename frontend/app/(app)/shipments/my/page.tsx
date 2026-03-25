'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserCard } from '@/components/ui/UserCard';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { Shipment, PaginatedResponse } from '@/lib/types/api';

type ShipmentStatus = 'all' | 'pending' | 'accepted' | 'paid' | 'in_transit' | 'delivered' | 'cancelled';
type SortOption = 'date' | 'weight' | 'status';

export default function MyShipmentsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');

  useEffect(() => {
    fetchMyShipments();
  }, []);

  const fetchMyShipments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<PaginatedResponse<Shipment>>(API_ENDPOINTS.shipments.my);
      setShipments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
      setError(ErrorHandler.handle(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelShipment = async (shipmentId: string) => {
    if (!confirm(t('common.confirm') + '?')) return;

    try {
      await apiClient.post(API_ENDPOINTS.shipments.cancel(shipmentId));
      // Refresh shipments list
      fetchMyShipments();
    } catch (err) {
      console.error('Failed to cancel shipment:', err);
      alert(ErrorHandler.handle(err));
    }
  };

  const handleEditShipment = (shipmentId: string) => {
    router.push(`/shipments/edit/${shipmentId}`);
  };

  const handleViewDetails = (shipmentId: string) => {
    router.push(`/shipments/${shipmentId}`);
  };

  const getFilteredAndSortedShipments = () => {
    let filtered = shipments;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(shipment => shipment.status === statusFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'weight':
          return b.weight - a.weight;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return sorted;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'held':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const filteredShipments = getFilteredAndSortedShipments();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('shipments.myShipments')}</h1>
        <Button
          variant="primary"
          onClick={() => router.push('/shipments/new')}
        >
          {t('shipments.create')}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('trips.filterResults')}
          </label>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'accepted', 'in_transit', 'delivered', 'cancelled'] as ShipmentStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? t('common.all') : t(`shipments.${status === 'in_transit' ? 'inTransit' : status}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('trips.sortBy')}
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">{t('trips.sortByDate')}</option>
            <option value="weight">{t('shipments.weight')}</option>
            <option value="status">{t('shipments.status')}</option>
          </select>
        </div>
      </div>

      {/* Shipments List */}
      {filteredShipments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">
            {statusFilter === 'all' 
              ? t('dashboard.noPendingShipments')
              : t('shipments.noShipmentsFound')
            }
          </p>
          <Button
            variant="primary"
            onClick={() => router.push('/shipments/new')}
          >
            {t('shipments.create')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredShipments.map((shipment) => (
            <Card key={shipment.id} className="p-6">
              <div className="flex flex-col gap-4">
                {/* Header with status badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">
                      {shipment.pickup_city} → {shipment.delivery_city}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                        shipment.status
                      )}`}
                    >
                      {t(`shipments.${shipment.status === 'in_transit' ? 'inTransit' : shipment.status}`)}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    €{shipment.price.toFixed(2)}
                  </span>
                </div>

                {/* Package details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{t('shipments.packageDetails')}</p>
                    <p className="text-gray-600">{shipment.description}</p>
                    <p className="text-gray-600">{shipment.weight} kg</p>
                    <p className="text-gray-600">{shipment.package_type}</p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">{t('shipments.pickup')}</p>
                    <p className="text-gray-600">{shipment.pickup_city}, {shipment.pickup_country}</p>
                    <p className="text-gray-600 text-xs">{shipment.pickup_address}</p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">{t('shipments.delivery')}</p>
                    <p className="text-gray-600">{shipment.delivery_city}, {shipment.delivery_country}</p>
                    <p className="text-gray-600 text-xs">{shipment.delivery_address}</p>
                  </div>
                </div>

                {/* Matched traveler */}
                {shipment.traveler && (
                  <div className="border-t pt-4">
                    <p className="font-medium text-gray-900 mb-2">{t('shipments.matchedTraveler')}</p>
                    <UserCard
                      user={shipment.traveler as any}
                      showContactButton={shipment.status !== 'cancelled' && shipment.status !== 'delivered'}
                      onClick={() => router.push(`/profile/${shipment.traveler?.id}`)}
                    />
                  </div>
                )}

                {/* Recipient info */}
                <div className="border-t pt-4">
                  <p className="font-medium text-gray-900 mb-2">{t('shipments.recipientInfo')}</p>
                  <p className="text-gray-600">{shipment.recipient_name}</p>
                  <p className="text-gray-600 text-sm">{shipment.recipient_phone}</p>
                </div>

                {/* Submission date */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {t('common.submit')}: {formatDate(shipment.created_at)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(shipment.id)}
                  >
                    {t('common.viewDetails')}
                  </Button>
                  
                  {shipment.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelShipment(shipment.id)}
                    >
                      {t('common.cancel')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
