'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, CreditCard, Calendar, DollarSign, ExternalLink, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface PaymentDetail {
  id: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  payee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  amount: number;
  base_amount?: number;
  sender_fee?: number;
  traveler_fee?: number;
  platform_fee?: number;
  traveler_amount?: number;
  currency?: string;
  amount_formatted?: string;
  transaction_id?: string;
  payment_method?: string;
  status: string;
  shipment?: {
    id: string;
    tracking_number?: string;
    status?: string;
  } | null;
  escrowed_at?: string;
  released_at?: string;
  created_at: string;
  updated_at?: string;
}

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  useEffect(() => {
    params.then(p => setPaymentId(p.id));
  }, [params]);

  useEffect(() => {
    if (paymentId) fetchPaymentDetails();
  }, [paymentId]);

  const fetchPaymentDetails = async () => {
    if (!paymentId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setPayment(data.data);
    } catch (err) {
      console.error('Failed to fetch payment details:', err);
      setError(t('admin.payments.detail.notFound'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!paymentId || !refundReason.trim() || refundReason.length < 10) return;
    setRefundSubmitting(true);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: refundReason,
          ...(refundAmount ? { amount: parseFloat(refundAmount) } : {}),
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to process refund');
      }
      fetchPaymentDetails();
      setShowRefundDialog(false);
      setRefundReason('');
      setRefundAmount('');
    } catch (err: any) {
      console.error('Failed to process refund:', err);
      setError(err.message);
    } finally {
      setRefundSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      escrowed: 'bg-blue-100 text-blue-800',
      released: 'bg-emerald-100 text-emerald-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {t(`admin.payments.statuses.${status}`)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error}</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:text-blue-800">
          {t('common.back')}
        </button>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('admin.payments.detail.notFound')}</p>
      </div>
    );
  }

  const currency = payment.currency || 'EUR';

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
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.payments.detail.title')}</h1>
            {payment.transaction_id && (
              <p className="text-sm text-gray-600 mt-1 font-mono">{payment.transaction_id}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {payment.transaction_id && (
            <button
              onClick={() => window.open(`https://dashboard.stripe.com/payments/${payment.transaction_id}`, '_blank')}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('admin.payments.detail.viewInStripe')}
            </button>
          )}
          {payment.status === 'completed' && (
            <button
              onClick={() => setShowRefundDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('admin.payments.detail.processRefund')}
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Payment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.payments.detail.transactionInfo')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.payments.detail.amount')}</label>
                <div className="mt-1 flex items-center text-lg font-semibold text-gray-900">
                  <DollarSign className="w-5 h-5 mr-2 text-gray-400" />
                  {payment.amount_formatted || formatCurrency(payment.amount, currency)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.payments.detail.paymentMethod')}</label>
                <div className="mt-1 text-sm text-gray-900 capitalize">
                  {payment.payment_method?.replace(/_/g, ' ') || 'N/A'}
                </div>
              </div>
              {payment.transaction_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('admin.payments.detail.transactionId')}</label>
                  <div className="mt-1 text-sm text-gray-900 font-mono break-all">{payment.transaction_id}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.payments.detail.currency')}</label>
                <div className="mt-1 text-sm text-gray-900">{currency}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t('admin.payments.detail.created')}</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {formatDate(payment.created_at)}
                </div>
              </div>
              {payment.escrowed_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('admin.payments.detail.escrowed')}</label>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(payment.escrowed_at)}
                  </div>
                </div>
              )}
              {payment.released_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t('admin.payments.detail.released')}</label>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(payment.released_at)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fee Breakdown */}
          {(payment.base_amount || payment.sender_fee || payment.traveler_fee || payment.platform_fee) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.payments.detail.feeBreakdown')}</h2>
              <div className="space-y-3">
                {payment.base_amount != null && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('admin.payments.detail.baseAmount')}</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(payment.base_amount, currency)}</span>
                  </div>
                )}
                {payment.sender_fee != null && payment.sender_fee > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('admin.payments.detail.senderFee')}</span>
                    <span className="text-gray-900">{formatCurrency(payment.sender_fee, currency)}</span>
                  </div>
                )}
                {payment.traveler_fee != null && payment.traveler_fee > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('admin.payments.detail.travelerFee')}</span>
                    <span className="text-gray-900">{formatCurrency(payment.traveler_fee, currency)}</span>
                  </div>
                )}
                {payment.platform_fee != null && payment.platform_fee > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('admin.payments.detail.platformFee')}</span>
                    <span className="text-gray-900">{formatCurrency(payment.platform_fee, currency)}</span>
                  </div>
                )}
                {payment.traveler_amount != null && (
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
                    <span className="text-gray-900 font-semibold">{t('admin.payments.detail.travelerAmount')}</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(payment.traveler_amount, currency)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payer Info */}
          {payment.user && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.payments.detail.payerInfo')}</h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-24">{t('admin.payments.detail.name')}:</span>
                  <button
                    onClick={() => router.push(`/admin/users/${payment.user!.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {payment.user.name}
                  </button>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-24 ml-7">{t('admin.payments.detail.email')}:</span>
                  <span className="text-gray-900">{payment.user.email}</span>
                </div>
                {payment.user.phone && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-24 ml-7">{t('admin.payments.detail.phone')}:</span>
                    <span className="text-gray-900">{payment.user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payee Info */}
          {payment.payee && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.payments.detail.payeeInfo')}</h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-24">{t('admin.payments.detail.name')}:</span>
                  <button
                    onClick={() => router.push(`/admin/users/${payment.payee!.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {payment.payee.name}
                  </button>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-24 ml-7">{t('admin.payments.detail.email')}:</span>
                  <span className="text-gray-900">{payment.payee.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Related Shipment */}
          {payment.shipment && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.payments.detail.relatedShipment')}</h2>
              <div className="space-y-3">
                {payment.shipment.tracking_number && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-32">{t('admin.payments.detail.trackingNumber')}:</span>
                    <button
                      onClick={() => router.push(`/admin/shipments/${payment.shipment!.id}`)}
                      className="text-blue-600 hover:text-blue-800 font-mono font-medium"
                    >
                      {payment.shipment.tracking_number}
                    </button>
                  </div>
                )}
                {payment.shipment.status && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-32">{t('admin.payments.detail.shipmentStatus')}:</span>
                    <span className="text-gray-900 capitalize">{payment.shipment.status}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('admin.payments.detail.statusLabel')}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">{t('admin.payments.detail.paymentStatus')}</label>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !refundSubmitting) {
              setShowRefundDialog(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.payments.detail.processRefund')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.payments.detail.refundAmount')}
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`${t('admin.payments.detail.fullAmount')}: ${formatCurrency(payment.amount, currency)}`}
                  step="0.01"
                  min="0"
                  max={payment.amount}
                  disabled={refundSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('admin.payments.detail.leaveEmptyFullRefund')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('admin.payments.detail.refundReason')}
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder={t('admin.payments.detail.refundReasonPlaceholder')}
                  rows={4}
                  disabled={refundSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none disabled:bg-gray-100"
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
                disabled={refundSubmitting}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRefund}
                disabled={refundReason.length < 10 || refundSubmitting}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refundSubmitting ? t('common.processing') : t('admin.payments.detail.processRefund')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
