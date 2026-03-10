'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, CreditCard, Building2, Calendar, DollarSign, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected';

interface WithdrawalRequest {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  fee: number;
  net_amount: number;
  bank_details: {
    account_holder: string;
    bank_name: string;
    account_number: string;
    routing_number?: string;
    iban?: string;
    swift_code?: string;
  };
  status: WithdrawalStatus;
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface WithdrawalApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawal: WithdrawalRequest | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  loading?: boolean;
}

export default function WithdrawalApprovalModal({
  isOpen,
  onClose,
  withdrawal,
  onApprove,
  onReject,
  onComplete,
  loading = false
}: WithdrawalApprovalModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowRejectForm(false);
      setShowCompleteConfirm(false);
      setRejectReason('');
    }
  }, [isOpen]);

  // ESC key handler
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

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
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
    if (!rejectReason.trim() || rejectReason.length < 10) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onReject(withdrawal.id, rejectReason);
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    const badge = badges[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
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
              Withdrawal Request
            </h2>
            {getStatusBadge(withdrawal.status)}
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">User Information</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-24">Name:</span>
                <span className="text-gray-900 font-medium">{withdrawal.user.name}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-24">Email:</span>
                <span className="text-gray-900">{withdrawal.user.email}</span>
              </div>
            </div>
          </div>

          {/* Amount Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Amount Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">Withdrawal Amount:</span>
                </div>
                <span className="text-gray-900 font-medium">{formatCurrency(withdrawal.amount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">Processing Fee:</span>
                </div>
                <span className="text-gray-900">-{formatCurrency(withdrawal.fee)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Net Amount:</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(withdrawal.net_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Bank Details</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-32">Account Holder:</span>
                <span className="text-gray-900 font-medium">{withdrawal.bank_details.account_holder}</span>
              </div>
              <div className="flex items-center text-sm">
                <Building2 className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-32">Bank Name:</span>
                <span className="text-gray-900">{withdrawal.bank_details.bank_name}</span>
              </div>
              <div className="flex items-center text-sm">
                <CreditCard className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-32">Account Number:</span>
                <span className="text-gray-900 font-mono">{withdrawal.bank_details.account_number}</span>
              </div>
              {withdrawal.bank_details.iban && (
                <div className="flex items-center text-sm">
                  <CreditCard className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-32">IBAN:</span>
                  <span className="text-gray-900 font-mono">{withdrawal.bank_details.iban}</span>
                </div>
              )}
              {withdrawal.bank_details.swift_code && (
                <div className="flex items-center text-sm">
                  <CreditCard className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-32">SWIFT Code:</span>
                  <span className="text-gray-900 font-mono">{withdrawal.bank_details.swift_code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-32">Requested:</span>
                <span className="text-gray-900">
                  {new Date(withdrawal.requested_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {withdrawal.approved_at && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-32">Approved:</span>
                  <span className="text-gray-900">
                    {new Date(withdrawal.approved_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {withdrawal.completed_at && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-32">Completed:</span>
                  <span className="text-gray-900">
                    {new Date(withdrawal.completed_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {withdrawal.rejected_at && (
                <div className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-gray-600 w-32">Rejected:</span>
                  <span className="text-gray-900">
                    {new Date(withdrawal.rejected_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
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
                  <h3 className="text-sm font-semibold text-red-900 mb-1">Rejection Reason</h3>
                  <p className="text-sm text-red-700">{withdrawal.rejection_reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-900 mb-3">Rejection Reason</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection (minimum 10 characters)..."
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
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason('');
                    }}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isLoading || rejectReason.length < 10}
                    className="px-3 py-1.5 text-sm text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                    Confirm Rejection
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
                  <h3 className="text-sm font-semibold text-green-900 mb-1">Confirm Completion</h3>
                  <p className="text-sm text-green-700">
                    Please confirm that the withdrawal of {formatCurrency(withdrawal.net_amount)} has been successfully transferred to the user's bank account.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => setShowCompleteConfirm(false)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-sm text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  Mark as Completed
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
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </button>
              </>
            )}

            {withdrawal.status === 'processing' && (
              <button
                onClick={() => setShowCompleteConfirm(true)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Completed
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
