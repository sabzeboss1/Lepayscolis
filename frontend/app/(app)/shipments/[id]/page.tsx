'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import type { Shipment, Trip } from '@/lib/types/api';
import {
  Package,
  MapPin,
  Weight,
  Ruler,
  User,
  ArrowLeft,
  MessageCircle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function ShipmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [shipmentRes, tripsRes] = await Promise.all([
        apiClient.get<{ data: Shipment }>(`/api/shipments/${params.id}`),
        apiClient.get<{ data: Trip[] }>('/api/trips/my'),
      ]);
      setShipment(shipmentRes.data);
      
      // Filter only active trips with enough capacity
      const activeTrips = (tripsRes.data || []).filter(
        (t: Trip) => t.status === 'active' && t.available_weight >= shipmentRes.data.package_weight
      );
      setMyTrips(activeTrips);
      if (activeTrips.length > 0) setSelectedTripId(activeTrips[0].id);
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedTripId) {
      setError('Veuillez sélectionner un voyage');
      return;
    }

    setAccepting(true);
    setError('');
    try {
      await apiClient.post(`/api/shipments/${params.id}/accept`, {
        trip_id: selectedTripId,
      });
      router.push('/shipments/my');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'acceptation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!shipment) return null;

  const canAccept = shipment.status === 'pending' && !shipment.traveler_id && user?.id !== shipment.sender_id;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Détails du colis</h1>
              <p className="text-sm text-slate-500">Expédition #{shipment.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Itinéraire</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{shipment.pickup_city}, {shipment.pickup_country}</p>
                  <p className="text-xs text-slate-500">{shipment.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{shipment.delivery_city}, {shipment.delivery_country}</p>
                  <p className="text-xs text-slate-500">{shipment.delivery_address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Détails du colis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">{shipment.package_weight} kg</span>
              </div>
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">
                  {shipment.package_length}×{shipment.package_width}×{shipment.package_height} cm
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-700 mt-3">{shipment.package_description}</p>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Expéditeur</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{shipment.sender.name}</p>
                <p className="text-xs text-slate-500">Note: {shipment.sender.rating.toFixed(1)} ⭐</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Montant du paiement</span>
              <span className="text-2xl font-bold text-orange-600">€{shipment.payment_amount.toFixed(2)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Vous recevrez 85% (€{(shipment.payment_amount * 0.85).toFixed(2)})</p>
          </div>
        </div>

        {canAccept && myTrips.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Sélectionnez votre voyage</h3>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
            >
              {myTrips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.departure_city} → {trip.arrival_city} ({new Date(trip.departure_date).toLocaleDateString()})
                </option>
              ))}
            </select>

            <Button
              onClick={handleAccept}
              disabled={accepting}
              loading={accepting}
              className="w-full !bg-emerald-500 hover:!bg-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Accepter ce colis
            </Button>
          </div>
        )}

        {canAccept && myTrips.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
            <p className="text-sm text-amber-900 mb-3">Vous devez créer un voyage pour accepter ce colis</p>
            <Button
              onClick={() => router.push('/trips/new')}
              variant="primary"
              size="sm"
              className="!bg-orange-500 hover:!bg-orange-600"
            >
              Créer un voyage
            </Button>
          </div>
        )}

        <Button
          onClick={() => router.push(`/messages?user=${shipment.sender_id}`)}
          variant="outline"
          className="w-full"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Contacter l'expéditeur
        </Button>
      </div>
    </div>
  );
}
