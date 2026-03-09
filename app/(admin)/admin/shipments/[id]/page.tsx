'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, User, MapPin, Ban, AlertCircle, TrendingUp } from 'lucide-react';

interface Shipment {
  id: string;
  tracking_number: string;
  sender: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  recipient: {
    name: string;
    phone: string;
    address: string;
  };
  package_details: {
    description: string;
    weight: number;
    dimensions?: string;
    value: number;
  };
  trip: {
    id: string;
    origin: string;
    destination: string;
    traveler_name: string;
  };
  payment: {
    amount: number;
    status: string;
    method: string;
  };
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  status_history: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  created_at: string;
  delivery_date?: string;
  cancellation_reason?: string;
  dispute?: {
    reason: string;
    status: string;
    created_at: string;
  };
}

interface Analytics {
  delivery_time_days: number;
  on_time_delivery: boolean;
}

export default function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResolveDispute, setShowResolveDispute] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    params.then(p => setShipmentId(p.id));
  }, [params]);

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentDetails();
    }
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    if (!shipmentId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}`);
      const data = await response.json();
      setShipment(data.data.shipment);
      setAnalytics(data.data.analytics || null);
    } catch (error) {
      console.error('Failed to fetch shipment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!shipmentId || !resolutionNotes.trim() || resolutionNotes.length < 10) {
      return;
    }

    try {
      await fetch(`/api/admin/shipments/${shipmentId}/resolve-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_notes: resolutionNotes,
          refund_amount: refundAmount ? parseFloat(refundAmount) : null
        })
      });
      fetchShipmentDetails();
      setShowResolveDispute(false);
      setResolutionNotes('');
      setRefundAmount('');
    } catch (error) {
      console.error('Failed to resolve dispute:', error);
    }
  };

  const handleCancelShipment = async () => {
    if (!shipmentId || !cancelReason.trim() || cancelReason.length < 10) {
      return;
    }

    try {
      await fetch(`/api/admin/shipments/${shipmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });
      fetchShipmentDetails();
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel shipment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Shipment not found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pending',
      accepted: 'Accepted',
      in_transit: 'In Transit',
      delivered: 'Delivered',
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
            <h1 className="text-2xl font-bold text-gray-900">Shipment Details</h1>
            <p className="text-sm text-gray-600 mt-1 font-mono">{shipment.tracking_number}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {shipment.dispute && shipment.dispute.status === 'open' && (
            <button
              onClick={() => setShowResolveDispute(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Resolve Dispute
            </button>
          )}
          {shipment.status !== 'cancelled' && shipment.status !== 'delivered' && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              <Ban className="w-4 h-4 mr-2" />
              Cancel Shipment
            </button>
          )}
        </div>
      </div>

      {/* Dispute Alert */}
      {shipment.dispute && shipment.dispute.status === 'open' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Active Dispute</h3>
              <p className="text-sm text-red-700 mt-1">{shipment.dispute.reason}</p>
              <p className="text-xs text-red-600 mt-1">
                Reported on {new Date(shipment.dispute.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Package Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <div className="mt-1 text-sm text-gray-900">{shipment.package_details.description}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Weight</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Package className="w-4 h-4 mr-2 text-gray-400" />
                  {shipment.package_details.weight} kg
                </div>
              </div>
              {shipment.package_details.dimensions && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Dimensions</label>
                  <div className="mt-1 text-sm text-gray-900">{shipment.package_details.dimensions}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Declared Value</label>
                <div className="mt-1 text-sm text-gray-900">{formatCurrency(shipment.package_details.value)}</div>
              </div>
            </div>
          </div>

          {/* Sender & Recipient */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sender</h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 text-gray-400 mr-3" />
                  <button
                    onClick={() => router.push(`/admin/users/${shipment.sender.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {shipment.sender.name}
                  </button>
                </div>
                <div className="text-sm text-gray-900 ml-7">{shipment.sender.email}</div>
                <div className="text-sm text-gray-900 ml-7">{shipment.sender.phone}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipient</h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="font-medium text-gray-900">{shipment.recipient.name}</span>
                </div>
                <div className="text-sm text-gray-900 ml-7">{shipment.recipient.phone}</div>
                <div className="text-sm text-gray-900 ml-7">{shipment.recipient.address}</div>
              </div>
            </div>
          </div>

          {/* Trip Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Associated Trip</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-24">Route:</span>
                <button
                  onClick={() => router.push(`/admin/trips/${shipment.trip.id}`)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {shipment.trip.origin} → {shipment.trip.destination}
                </button>
              </div>
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-24">Traveler:</span>
                <span className="text-gray-900">{shipment.trip.traveler_name}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status History</h2>
            <div className="space-y-4">
              {shipment.status_history.map((item, index) => (
                <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(item.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-sm text-gray-600 mt-1">{item.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Current Status</label>
                <div className="mt-1">
                  {getStatusBadge(shipment.status)}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Created</label>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(shipment.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
              {shipment.delivery_date && (
                <div>
                  <label className="text-xs font-medium text-gray-500">Delivered</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(shipment.delivery_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Payment</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Amount</label>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {formatCurrency(shipment.payment.amount)}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    shipment.payment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {shipment.payment.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Method</label>
                <div className="mt-1 text-sm text-gray-900 capitalize">{shipment.payment.method}</div>
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
                  <label className="text-xs font-medium text-gray-500">Delivery Time</label>
                  <div className="mt-1 text-lg font-semibold text-gray-900">{analytics.delivery_time_days} days</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">On-Time Delivery</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      analytics.on_time_delivery ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {analytics.on_time_delivery ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resolve Dispute Modal */}
      {showResolveDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolve Dispute</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how the dispute was resolved (minimum 10 characters)..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <span className={`text-xs ${resolutionNotes.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                  {resolutionNotes.length} / 10 minimum
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Refund Amount (Optional)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max={shipment.payment.amount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowResolveDispute(false);
                  setResolutionNotes('');
                  setRefundAmount('');
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveDispute}
                disabled={resolutionNotes.length < 10}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resolve Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Shipment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Cancelling this shipment will process a refund according to the cancellation policy. Please provide a reason:
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
                  onClick={handleCancelShipment}
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
