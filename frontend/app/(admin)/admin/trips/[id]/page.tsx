'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ban, MapPin, Calendar, User, Package, TrendingUp } from 'lucide-react';

interface Trip {
  id: string;
  traveler: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  origin: string;
  destination: string;
  departure_date: string;
  arrival_date: string;
  available_space: number;
  price_per_kg: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  cancellation_reason?: string;
}

interface Shipment {
  id: string;
  tracking_number: string;
  sender_name: string;
  recipient_name: string;
  weight: number;
  status: string;
  price: number;
}

interface Analytics {
  total_shipments: number;
  total_revenue: number;
  completion_rate: number;
  average_rating: number;
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [tripId, setTripId] = useState<string | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    params.then(p => setTripId(p.id));
  }, [params]);

  useEffect(() => {
    if (tripId) {
      fetchTripDetails();
    }
  }, [tripId]);

  const fetchTripDetails = async () => {
    if (!tripId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/trips/${tripId}`);
      const data = await response.json();
      setTrip(data.data.trip);
      setShipments(data.data.shipments || []);
      setAnalytics(data.data.analytics || null);
    } catch (error) {
      console.error('Failed to fetch trip details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!tripId || !cancelReason.trim() || cancelReason.length < 10) {
      return;
    }

    try {
      await fetch(`/api/admin/trips/${tripId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      fetchTripDetails();
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel trip:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Trip not found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      upcoming: 'Upcoming',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {trip.origin} → {trip.destination}
            </h1>
            <p className="text-sm text-gray-600 mt-1">Trip ID: {trip.id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {trip.status === 'upcoming' && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancel Trip
            </button>
          )}
        </div>
      </div>

      {/* Trip Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Origin</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {trip.origin}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Destination</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {trip.destination}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Departure Date</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(trip.departure_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Arrival Date</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(trip.arrival_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Available Space</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Package className="w-4 h-4 mr-2 text-gray-400" />
                  {trip.available_space} kg
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Price per kg</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  {formatCurrency(trip.price_per_kg)}
                </div>
              </div>
            </div>

            {trip.status === 'cancelled' && trip.cancellation_reason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900">Cancellation Reason</p>
                <p className="text-sm text-red-700 mt-1">{trip.cancellation_reason}</p>
              </div>
            )}
          </div>

          {/* Traveler Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Traveler Information</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-24">Name:</span>
                <button
                  onClick={() => router.push(`/admin/users/${trip.traveler.id}`)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {trip.traveler.name}
                </button>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 w-24 ml-7">Email:</span>
                <span className="text-gray-900">{trip.traveler.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 w-24 ml-7">Phone:</span>
                <span className="text-gray-900">{trip.traveler.phone}</span>
              </div>
            </div>
          </div>

          {/* Associated Shipments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Associated Shipments ({shipments.length})
            </h2>
            {shipments.length === 0 ? (
              <p className="text-sm text-gray-500">No shipments associated with this trip</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sender</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shipments.map((shipment) => (
                      <tr
                        key={shipment.id}
                        onClick={() => router.push(`/admin/shipments/${shipment.id}`)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{shipment.tracking_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{shipment.sender_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{shipment.recipient_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{shipment.weight} kg</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {shipment.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(shipment.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Trip Status</label>
                <div className="mt-1">
                  {getStatusBadge(trip.status)}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Created</label>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(trip.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Analytics */}
          {analytics && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Total Shipments</label>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{analytics.total_shipments}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Total Revenue</label>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(analytics.total_revenue)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Completion Rate</label>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{analytics.completion_rate}%</div>
                </div>
                {analytics.average_rating > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Average Rating</label>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {analytics.average_rating.toFixed(1)} / 5.0
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Trip</h3>
            <p className="text-sm text-gray-600 mb-4">
              Cancelling this trip will also cancel all associated shipments and process refunds. Please provide a reason:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (minimum 10 characters)..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <span className={`text-xs ${cancelReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                {cancelReason.length} / 10 minimum
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelTrip}
                  disabled={cancelReason.length < 10}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
