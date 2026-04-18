'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { apiClient } from '@/lib/api/client';
import {
  Package,
  MapPin,
  User,
  Clock,
  DollarSign,
  ArrowLeft,
  Plus,
  Eye,
  Search,
} from 'lucide-react';

interface ShipmentRequest {
  id: string;
  title: string;
  description: string;
  weight: number;
  max_budget: number;
  currency_code: string;
  status: string;
  pickup_country: { name: string };
  pickup_city: { name: string };
  delivery_country: { name: string };
  delivery_city: { name: string };
  needed_by: string | null;
  created_at: string;
  bids_count?: number;
  sender: { name: string; avatar?: string };
}

function RequestCard({ request, onClick }: { request: ShipmentRequest; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Ouverte
          </span>
          {request.bids_count !== undefined && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <User className="w-3 h-3" />
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
              <span>Max: <CurrencyDisplay amount={request.max_budget} currency={request.currency_code} className="!text-inherit" /></span>
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
          Par {request.sender.name}
        </div>
      </div>
    </div>
  );
}

export default function ShipmentRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await apiClient.get<{ data: ShipmentRequest[] }>('/api/shipment-requests');
        setRequests(response.data);
      } catch (error) {
        console.error('Failed to fetch shipment requests:', error);
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
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 font-heading">
                  Annonces d'expédition
                </h1>
                <p className="text-sm text-slate-500">Trouvez des colis à transporter lors de vos voyages</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/shipment-requests/my')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Mes annonces
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/shipment-requests/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Publier une annonce
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                  <div className="w-16 h-8 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune annonce d'expédition
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Il n'y a pas encore d'annonces d'expédition disponibles. 
              Soyez le premier à publier une annonce !
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