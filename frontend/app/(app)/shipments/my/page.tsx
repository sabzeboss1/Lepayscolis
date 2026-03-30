'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { UserCard } from '@/components/ui/UserCard';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { useUserCurrency } from '@/lib/hooks/useUserCurrency';
import { Shipment, PaginatedResponse } from '@/lib/types/api';
import {
  Package,
  Plus,
  ArrowRight,
  MapPin,
  Weight,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CircleDot,
  PackageOpen,
  Eye,
  AlertCircle,
} from 'lucide-react';

type ShipmentStatus = 'all' | 'pending' | 'accepted' | 'paid' | 'in_transit' | 'delivered' | 'cancelled';
type SortOption = 'date' | 'weight' | 'status';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  pending: {
    label: 'En attente',
    icon: <Clock className="w-3 h-3" />,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  accepted: {
    label: 'Accepté',
    icon: <CircleDot className="w-3 h-3" />,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  paid: {
    label: 'Payé',
    icon: <CheckCircle2 className="w-3 h-3" />,
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  in_transit: {
    label: 'En transit',
    icon: <Truck className="w-3 h-3" />,
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  delivered: {
    label: 'Livré',
    icon: <CheckCircle2 className="w-3 h-3" />,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  cancelled: {
    label: 'Annulé',
    icon: <XCircle className="w-3 h-3" />,
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, icon: null, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

const STATUS_FILTERS: { key: ShipmentStatus; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'pending', label: 'En attente' },
  { key: 'accepted', label: 'Accepté' },
  { key: 'in_transit', label: 'En transit' },
  { key: 'delivered', label: 'Livré' },
  { key: 'cancelled', label: 'Annulé' },
];

export default function MyShipmentsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { formatCurrency } = useUserCurrency();
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
      setError(ErrorHandler.handle(err).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelShipment = async (shipmentId: string) => {
    if (!confirm('Confirmer l\'annulation ?')) return;
    try {
      await apiClient.post(API_ENDPOINTS.shipments.cancel(shipmentId));
      fetchMyShipments();
    } catch (err) {
      alert(ErrorHandler.handle(err));
    }
  };

  const getFilteredAndSortedShipments = () => {
    let filtered = statusFilter !== 'all' ? shipments.filter((s) => s.status === statusFilter) : shipments;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'weight') return b.package_weight - a.package_weight;
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const filteredShipments = getFilteredAndSortedShipments();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 font-heading">Mes expéditions</h1>
                <p className="text-sm text-slate-500">{shipments.length} expédition{shipments.length !== 1 ? 's' : ''} au total</p>
              </div>
            </div>
            <Button variant="primary" onClick={() => router.push('/shipments/new')}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Nouvelle expédition</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Status filter - scrollable */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto flex-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  statusFilter === f.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="date">Par date</option>
            <option value="weight">Par poids</option>
            <option value="status">Par statut</option>
          </select>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-5 bg-slate-100 rounded-full w-28" />
                  <div className="h-5 bg-slate-100 rounded w-16" />
                </div>
                <div className="h-4 bg-slate-100 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredShipments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <PackageOpen className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-5">
              {statusFilter === 'all'
                ? "Vous n'avez pas encore d'expédition."
                : 'Aucune expédition trouvée pour ce statut.'}
            </p>
            <Button variant="primary" onClick={() => router.push('/shipments/new')}>
              <Plus className="w-4 h-4 mr-1.5" />
              Créer une expédition
            </Button>
          </div>
        )}

        {/* Shipments list */}
        {!isLoading && filteredShipments.length > 0 && (
          <div className="space-y-3">
            {filteredShipments.map((shipment) => (
              <div
                key={shipment.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-orange-200 hover:shadow-md transition-all duration-200"
              >
                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      {/* Route */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                          <span className="font-semibold text-slate-900 text-sm truncate">
                            {shipment.pickup_city}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-semibold text-slate-900 text-sm truncate">
                            {shipment.delivery_city}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={shipment.status} />
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <Weight className="w-3.5 h-3.5" />
                          {shipment.package_weight} kg
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xl font-bold text-orange-500">
                        {formatCurrency(shipment.price)}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(shipment.created_at)}</p>
                    </div>
                  </div>

                  {/* Package description */}
                  {shipment.package_description && (
                    <p className="text-xs text-slate-500 mb-4 truncate">{shipment.package_description}</p>
                  )}

                  {/* Location detail */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Collecte</p>
                      <p className="text-sm text-slate-800 font-medium">
                        {shipment.pickup_city}, {shipment.pickup_country}
                      </p>
                      {shipment.pickup_address && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{shipment.pickup_address}</p>
                      )}
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Livraison</p>
                      <p className="text-sm text-slate-800 font-medium">
                        {shipment.delivery_city}, {shipment.delivery_country}
                      </p>
                      {shipment.delivery_address && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{shipment.delivery_address}</p>
                      )}
                    </div>
                  </div>


                  {/* Traveler info */}
                  {shipment.traveler && (
                  <div className="border-t border-slate-100 pt-4 mb-4">
                    <p className="text-xs font-medium text-slate-500 mb-3">Voyageur assigné</p>
                    <UserCard
                      user={shipment.traveler as any}
                      showContactButton={!['cancelled', 'delivered'].includes(shipment.status)}
                      onClick={() => router.push(`/profile/${shipment.traveler?.id}`)}
                    />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/shipments/${shipment.id}`)}
                      className="flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Voir les détails
                    </Button>
                    {shipment.status === 'pending' && (
                      <button
                        onClick={() => handleCancelShipment(shipment.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors px-3 py-2"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
