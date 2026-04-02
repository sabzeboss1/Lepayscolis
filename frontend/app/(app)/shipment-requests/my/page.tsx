'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useUserCurrency } from '@/lib/hooks/useUserCurrency';
import { apiClient } from '@/lib/api/client';
import {
  Package,
  Plus,
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Users,
} from 'lucide-react';

interface ShipmentRequest {
  id: string;
  title: string;
  description: string;
  weight: number;
  max_budget: number;
  currency_code: string;
  status: 'open' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  pickup_country: { name: string };
  pickup_city: { name: string };
  delivery_country: { name: string };
  delivery_city: { name: string };
  needed_by: string | null;
  created_at: string;
  bids_count?: number;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
        <div className="w-16 h-8 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

function RequestCard({ request, onClick }: { request: ShipmentRequest; onClick: () => void }) {
  const { formatCurrency } = useUserCurrency();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Ouverte';
      case 'assigned': return 'Assignée';
      case 'in_transit': return 'En transit';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
            {request.title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>{request.pickup_city.name}, {request.pickup_country.name}</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>{request.delivery_city.name}, {request.delivery_country.name}</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{request.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
            {getStatusText(request.status)}
          </span>
          {request.bids_count !== undefined && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="w-3 h-3" />
              <span>{request.bids_count} soumission{request.bids_count !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span>{request.weight} kg</span>
          </div>
          {request.max_budget && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>Max: {formatCurrency(request.max_budget, request.currency_code)}</span>
            </div>
          )}
          {request.needed_by && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Avant le {new Date(request.needed_by).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Publié le {new Date(request.created_at).toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
}

export default function MyShipmentRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        console.log('Fetching user shipment requests...');
        const response = await apiClient.get<{ data: ShipmentRequest[] }>('/api/shipment-requests/my/requests');
        console.log('Received shipment requests:', response);
        setRequests(response.data);
      } catch (err) {
        console.error('Failed to fetch shipment requests:', err);
        setError('Erreur lors du chargement de vos annonces');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 font-heading">
                  Mes annonces d'expédition
                </h1>
                <p className="text-sm text-slate-500">
                  {requests.length} annonce{requests.length !== 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push('/shipment-requests/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle annonce
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune annonce d'expédition
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Vous n'avez pas encore publié d'annonce d'expédition. 
              Créez-en une pour que les voyageurs puissent soumissionner.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/shipment-requests/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Publier une annonce
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onClick={() => router.push(`/shipment-requests/${request.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}