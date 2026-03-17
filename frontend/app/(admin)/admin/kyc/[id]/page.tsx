'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  Eye,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface KYCSubmission {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  document_type: 'idCard' | 'passport' | 'driversLicense';
  document_number: string;
  document_front_url: string | null;
  document_back_url: string | null;
  selfie_url: string | null;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  reviewed_at?: string;
}

export default function KYCDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [kycId, setKycId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Document viewer state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Action state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    params.then((p) => setKycId(p.id));
  }, [params]);

  useEffect(() => {
    if (kycId) fetchSubmission();
  }, [kycId]);

  const fetchSubmission = async () => {
    if (!kycId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/kyc/${kycId}`);
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || t('admin.kyc.detail.notFound'));
        return;
      }
      setSubmission(result.data);
    } catch {
      setError(t('admin.kyc.detail.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!kycId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/kyc/${kycId}/approve`, { method: 'POST' });
      if (response.ok) {
        fetchSubmission();
      }
    } catch {
      console.error('Failed to approve KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!kycId || rejectReason.length < 10) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/kyc/${kycId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (response.ok) {
        setShowRejectForm(false);
        setRejectReason('');
        fetchSubmission();
      }
    } catch {
      console.error('Failed to reject KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `kyc-document-${kycId}-${currentImageIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      console.error('Download failed');
    }
  };

  // Build document images from flat fields
  const documentImages: { label: string; url: string }[] = [];
  if (submission) {
    if (submission.document_front_url) {
      if (submission.document_type === 'idCard') {
        documentImages.push({ label: t('admin.kyc.review.idFront'), url: submission.document_front_url });
      } else if (submission.document_type === 'passport') {
        documentImages.push({ label: t('admin.kyc.review.passportPage'), url: submission.document_front_url });
      } else if (submission.document_type === 'driversLicense') {
        documentImages.push({ label: t('admin.kyc.review.driverLicense'), url: submission.document_front_url });
      }
    }

    if (submission.document_back_url) {
      if (submission.document_type === 'idCard') {
        documentImages.push({ label: t('admin.kyc.review.idBack'), url: submission.document_back_url });
      } else {
        documentImages.push({ label: t('admin.kyc.review.documentBack'), url: submission.document_back_url });
      }
    }

    if (submission.selfie_url) {
      documentImages.push({ label: t('admin.kyc.review.selfieWithDoc'), url: submission.selfie_url });
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {status === 'approved' && <CheckCircle className="w-4 h-4 mr-1.5" />}
        {status === 'rejected' && <XCircle className="w-4 h-4 mr-1.5" />}
        {status === 'pending' && <Eye className="w-4 h-4 mr-1.5" />}
        {t(`admin.kyc.statuses.${status}`)}
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

  if (error || !submission) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.back')}
        </button>
        <div className="text-center py-12">
          <p className="text-gray-500">{error || t('admin.kyc.detail.notFound')}</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.kyc.review.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {submission.user.name} &mdash; {t(`admin.kyc.documentTypes.${submission.document_type}`)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {getStatusBadge(submission.status)}

          {submission.status === 'pending' && !showRejectForm && (
            <>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {t('admin.kyc.review.reject')}
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {t('admin.kyc.review.approve')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reject Form */}
      {showRejectForm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-red-900 mb-3">{t('admin.kyc.review.rejectionReason')}</h3>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('admin.kyc.review.rejectionPlaceholder')}
            rows={3}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 resize-none"
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
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting || rejectReason.length < 10}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                {t('admin.kyc.review.confirmRejection')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="space-y-6">
          {/* User Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.kyc.review.userInfo')}</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-20">{t('admin.kyc.review.name')}:</span>
                <span className="text-gray-900 font-medium">{submission.user.name}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-20">{t('admin.kyc.review.email')}:</span>
                <span className="text-gray-900">{submission.user.email}</span>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-20">{t('admin.kyc.review.phone')}:</span>
                <span className="text-gray-900">{submission.user.phone}</span>
              </div>
            </div>
          </div>

          {/* Document Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.kyc.review.documentInfo')}</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <FileText className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-20">{t('admin.kyc.review.type')}:</span>
                <span className="text-gray-900 font-medium">
                  {t(`admin.kyc.documentTypes.${submission.document_type}`)}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <FileText className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-20">{t('admin.kyc.review.number')}:</span>
                <span className="text-gray-900 font-mono">{submission.document_number}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-20">{t('admin.kyc.review.submitted')}:</span>
                <span className="text-gray-900">
                  {new Date(submission.submitted_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Review Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.kyc.detail.reviewStatus')}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">{t('admin.kyc.columns.status')}</label>
                <div className="mt-1">{getStatusBadge(submission.status)}</div>
              </div>
              {submission.reviewed_at && (
                <div>
                  <label className="text-xs font-medium text-gray-500">{t('admin.kyc.detail.reviewedAt')}</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(submission.reviewed_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
            </div>

            {submission.status === 'rejected' && submission.rejection_reason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-900">{t('admin.kyc.review.rejectionReason')}</p>
                <p className="text-sm text-red-700 mt-1">{submission.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Document Viewer */}
        <div className="lg:col-span-2 space-y-4">
          {documentImages.length > 0 ? (
            <>
              {/* Main Viewer */}
              <div className="bg-gray-900 rounded-lg overflow-hidden relative" style={{ minHeight: '500px' }}>
                <div className="relative flex items-center justify-center" style={{ minHeight: '500px' }}>
                  <img
                    src={documentImages[currentImageIndex].url}
                    alt={documentImages[currentImageIndex].label}
                    className="max-w-full max-h-[70vh] object-contain transition-transform duration-200"
                    style={{ transform: `scale(${zoom})` }}
                  />

                  {/* Image Label */}
                  <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg px-3 py-1.5">
                    <span className="text-white text-sm font-medium">
                      {documentImages[currentImageIndex].label}
                    </span>
                  </div>

                  {/* Image Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black bg-opacity-75 rounded-lg px-4 py-2">
                    <button
                      onClick={() => setZoom(Math.max(1, zoom - 0.25))}
                      disabled={zoom <= 1}
                      className="text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-white text-sm font-medium min-w-[60px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                      disabled={zoom >= 3}
                      className="text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-2" />
                    <button
                      onClick={() => handleDownload(documentImages[currentImageIndex].url)}
                      className="text-white hover:text-gray-300"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Thumbnail Navigation */}
              {documentImages.length > 1 && (
                <div className="flex items-center justify-center space-x-3">
                  {documentImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        setZoom(1);
                      }}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        index === currentImageIndex
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('admin.kyc.review.noDocuments')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
