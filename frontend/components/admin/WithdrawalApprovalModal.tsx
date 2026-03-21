'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'cancelled';

interface WithdrawalRequest {
  id: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  formatted_amount?: string;
  fee: number;
  formatted_fee?: string;
  net_amount: number;
  formatted_net_amount?: string;
  currency?: string;
  payment_method?: string;
  payment_details?: Record<string, string>;
  status: WithdrawalStatus;
  status_badge?: { color: string; text: string };
  rejection_reason?: string;
  approved_by?: { id: string; name: string };
  approved_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

interface WithdrawalApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: WithdrawalRequest | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onProcessing: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  loading?: boolean;
}

export default function WithdrawalApprovalModal({
  isOpen,
  onClose,
  withdrawal,
  onApprove,
  onReject,
  onProcessing,
  onComplete,
  loading = false
}: WithdrawalApprovalModalProps) {
  const { t } = useTranslation();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShowRejectForm(false);
      setShowCompleteConfirm(false);
      setRejectReason('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        if (showRejectForm) {
          setShowRejectForm(false);
        } else if (showCompleteConfirm) {
          setShowCompleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, showRejectForm, showCompleteConfirm, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !withdrawal) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(withdrawal.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 10) return;
    setIsSubmitting(true);
    try {
      await onReject(withdrawal.id, rejectReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessing = async () => {
    setIsSubmitting(true);
    try {
      await onProcessing(withdrawal.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(withdrawal.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: withdrawal.currency || 'EUR'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    const badges: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: t('admin.withdrawals.statuses.pending') },
      approved: { color: 'bg-blue-100 text-blue-800', label: t('admin.withdrawals.statuses.approved') },
      processing: { color: 'bg-purple-100 text-purple-800', label: t('admin.withdrawals.statuses.processing') },
      completed: { color: 'bg-green-100 text-green-800', label: t('admin.withdrawals.statuses.completed') },
      rejected: { color: 'bg-red-100 text-red-800', label: t('admin.withdrawals.statuses.rejected') },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: t('admin.withdrawals.statuses.cancelled') },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdrawal-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 id="withdrawal-modal-title" className="text-xl font-semibold text-gray-900">
              {t('admin.withdrawals.modal.title')}
            </h2>
            {getStatusBadge(withdrawal.status)}
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label={t('common.close')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Information */}
          {withdrawal.user && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('admin.withdrawals.modal.userInfo')}</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-24">{t('admin.withdrawals.modal.name')}:</span>
                  <span className="text-gray-900 font-medium">{withdrawal.user.name}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-24">{t('admin.withdrawals.modal.email')}:</span>
                  <span className="text-gray-900">{withdrawal.user.email}</span>
                </div>
              </div>
            </div>
          )}

          {/* Amount Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('admin.withdrawals.modal.amountDetails')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">{t('admin.withdrawals.modal.withdrawalAmount')}:</span>
                </div>
                <span className="text-gray-900 font-medium">{withdrawal.formatted_amount || formatCurrency(withdrawal.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">{t('admin.withdrawals.modal.processingFee')}:</span>
                </div>
                <span className="text-gray-900">-{withdrawal.formatted_fee || formatCurrency(withdrawal.fee)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{t('admin.withdrawals.modal.netAmount')}:</span>
                  <span className="text-lg font-bold text-gray-900">{withdrawal.formatted_net_amount || formatCurrency(withdrawal.net_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {withdrawal.payment_details && Object.keys(withdrawal.payment_details).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                {t('admin.withdrawals.modal.paymentDetails')}
                {withdrawal.payment_method && (
                  <span className="ml-2 text-xs font-normal text-gray-500">({withdrawal.payment_method})</span>
                )}
              </h3>
              <div className="space-y-3">
                {Object.entries(withdrawal.payment_details).map(([key, value]) => (
                  <div key={key} className="flex items-center text-sm">
                    <CreditCard className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600 w-32 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-900 font-mono text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('admin.withdrawals.modal.timeline')}</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-32">{t('admin.withdrawals.modal.requested')}:</span>
                <span className="text-gray-900">{formatDate(withdrawal.created_at)}</span>
              </div>
              {withdrawal.approved_at && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-32">{t('admin.withdrawals.modal.approvedAt')}:</span>
                  <span className="text-gray-900">{formatDate(withdrawal.approved_at)}</span>
                </div>
              )}
              {withdrawal.approved_by && (
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-32">{t('admin.withdrawals.modal.approvedBy')}:</span>
                  <span className="text-gray-900">{withdrawal.approved_by.name}</span>
                </div>
              )}
              {withdrawal.completed_at && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-32">{t('admin.withdrawals.modal.completedAt')}:</span>
                  <span className="text-gray-900">{formatDate(withdrawal.completed_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rejection Reason */}
          {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-900 mb-1">{t('admin.withdrawals.modal.rejectionReason')}</h3>
                  <p className="text-sm text-red-700">{withdrawal.rejection_reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-900 mb-3">{t('admin.withdrawals.modal.rejectionReason')}</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t('admin.withdrawals.modal.rejectionPlaceholder')}
                rows={4}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs ${rejectReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                  {rejectReason.length} / 10 minimum
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isLoading || rejectReason.length < 10}
                    className="px-3 py-1.5 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                    {t('admin.withdrawals.modal.confirmReject')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Complete Confirmation */}
          {showCompleteConfirm && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-green-900 mb-1">{t('admin.withdrawals.modal.confirmCompleteTitle')}</h3>
                  <p className="text-sm text-green-700">
                    {t('admin.withdrawals.modal.confirmCompleteDesc')}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => setShowCompleteConfirm(false)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  {t('admin.withdrawals.modal.markCompleted')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!showRejectForm && !showCompleteConfirm && (
          <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t">
            {withdrawal.status === 'pending' && (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('admin.withdrawals.actions.reject')}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('common.processing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('admin.withdrawals.actions.approve')}
                    </>
                  )}
                </button>
              </>
            )}

            {withdrawal.status === 'approved' && (
              <button
                onClick={handleProcessing}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {t('admin.withdrawals.actions.markProcessing')}
              </button>
            )}

            {withdrawal.status === 'processing' && (
              <button
                onClick={() => setShowCompleteConfirm(true)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('admin.withdrawals.actions.markCompleted')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
