'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, CreditCard, Calendar, DollarSign, ExternalLink, RefreshCw } from 'lucide-react';

interface Payment {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  stripe_payment_id: string;
  stripe_customer_id?: string;
  method: 'card' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  shipment?: {
    id: string;
    tracking_number: string;
    sender_name: string;
    recipient_name: string;
  };
  card_details?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  created_at: string;
  completed_at?: string;
  refunded_at?: string;
  refund_reason?: string;
  failure_reason?: string;
}

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => {
    params.then(p => setPaymentId(p.id));
  }, [params]);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentDetails();
    }
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    if (!paymentId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`);
      const data = await response.json();
      setPayment(data.data);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!paymentId || !refundReason.trim() || refundReason.length < 10) {
      return;
    }

    try {
      await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason,
          amount: refundAmount ? parseFloat(refundAmount) : null
        })
      });
      fetchPaymentDetails();
      setShowRefundDialog(false);
      setRefundReason('');
      setRefundAmount('');
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  const openInStripe = () => {
    if (payment?.stripe_payment_id) {
      window.open(`https://dashboard.stripe.com/payments/${payment.stripe_payment_id}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Payment not found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      pending: 'Pending',
      completed: 'Completed',
      failed: 'Failed',
      refunded: 'Refunded'
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
            <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            <p className="text-sm text-gray-600 mt-1 font-mono">{payment.stripe_payment_id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openInStripe}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View in Stripe
          </button>
          {payment.status === 'completed' && (
            <button
              onClick={() => setShowRefundDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Process Refund
            </button>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <div className="mt-1 flex items-center text-lg font-semibold text-gray-900">
                  <DollarSign className="w-5 h-5 mr-2 text-gray-400" />
                  {formatCurrency(payment.amount)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Method</label>
                <div className="mt-1 text-sm text-gray-900 capitalize">{payment.method}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Stripe Payment ID</label>
                <div className="mt-1 text-sm text-gray-900 font-mono break-all">{payment.stripe_payment_id}</div>
              </div>
              {payment.stripe_customer_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Stripe Customer ID</label>
                  <div className="mt-1 text-sm text-gray-900 font-mono break-all">{payment.stripe_customer_id}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {new Date(payment.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              {payment.completed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Completed</label>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(payment.completed_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>

            {payment.card_details && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Card Details</h3>
                <div className="flex items-center space-x-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {payment.card_details.brand} •••• {payment.card_details.last4}
                    </div>
                    <div className="text-xs text-gray-500">
                      Expires {payment.card_details.exp_month}/{payment.card_details.exp_year}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-24">Name:</span>
                <button
                  onClick={() => router.push(`/admin/users/${payment.user.id}`)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {payment.user.name}
                </button>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 w-24 ml-7">Email:</span>
                <span className="text-gray-900">{payment.user.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 w-24 ml-7">Phone:</span>
                <span className="text-gray-900">{payment.user.phone}</span>
              </div>
            </div>
          </div>

          {/* Related Shipment */}
          {payment.shipment && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Shipment</h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">Tracking Number:</span>
                  <button
                    onClick={() => router.push(`/admin/shipments/${payment.shipment!.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-mono font-medium"
                  >
                    {payment.shipment.tracking_number}
                  </button>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">Sender:</span>
                  <span className="text-gray-900">{payment.shipment.sender_name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">Recipient:</span>
                  <span className="text-gray-900">{payment.shipment.recipient_name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Failure/Refund Info */}
          {payment.status === 'failed' && payment.failure_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-900 mb-2">Failure Reason</h3>
              <p className="text-sm text-red-700">{payment.failure_reason}</p>
            </div>
          )}

          {payment.status === 'refunded' && payment.refund_reason && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Refund Information</h3>
              <p className="text-sm text-gray-700 mb-2">{payment.refund_reason}</p>
              {payment.refunded_at && (
                <p className="text-xs text-gray-500">
                  Refunded on {new Date(payment.refunded_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Payment Status</label>
                <div className="mt-1">
                  {getStatusBadge(payment.status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Dialog */}
      {showRefundDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount (Optional)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`Full amount: ${formatCurrency(payment.amount)}`}
                  step="0.01"
                  min="0"
                  max={payment.amount}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for full refund
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Reason
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Explain why this refund is being processed (minimum 10 characters)..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <span className={`text-xs ${refundReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                  {refundReason.length} / 10 minimum
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowRefundDialog(false);
                  setRefundReason('');
                  setRefundAmount('');
                }}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={refundReason.length < 10}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
