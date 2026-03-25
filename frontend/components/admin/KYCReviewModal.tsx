'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Download, User, Mail, Phone, Calendar, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import AuthenticatedImage from './AuthenticatedImage';

interface KYCDocument {
  id: string;
  type: 'idCard' | 'passport' | 'driversLicense';
  front_url: string;
  back_url?: string;
  selfie_url: string;
}

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
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: KYCDocument[];
  rejection_reason?: string;
}

interface KYCReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: KYCSubmission | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  loading?: boolean;
}

export default function KYCReviewModal({
  isOpen,
  onClose,
  submission,
  onApprove,
  onReject,
  loading = false
}: KYCReviewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      setZoom(1);
      setShowRejectForm(false);
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
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, showRejectForm, onClose]);

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

  if (!isOpen || !submission) return null;

  // Organize images by type
  const documentImages: { label: string; url: string }[] = [];
  
  submission.documents.forEach(doc => {
    if (submission.document_type === 'idCard') {
      documentImages.push({ label: 'CNI - Recto', url: doc.front_url });
      if (doc.back_url) {
        documentImages.push({ label: 'CNI - Verso', url: doc.back_url });
      }
    } else if (submission.document_type === 'passport') {
      documentImages.push({ label: 'Passeport - Première page', url: doc.front_url });
    } else if (submission.document_type === 'driversLicense') {
      documentImages.push({ label: 'Permis de conduire', url: doc.front_url });
    }
    
    // Add selfie separately
    if (doc.selfie_url) {
      documentImages.push({ label: 'Selfie avec document', url: doc.selfie_url });
    }
  });

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'idCard':
        return 'Carte d\'Identité Nationale (CNI)';
      case 'passport':
        return 'Passeport';
      case 'driversLicense':
        return 'Permis de Conduire';
      default:
        return type;
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(submission.id);
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
      await onReject(submission.id, rejectReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `kyc-document-${submission.id}-${currentImageIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kyc-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id="kyc-modal-title" className="text-xl font-semibold text-gray-900">
            KYC Review - {submission.user.name}
          </h2>
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
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left: User Information */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">User Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <User className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600 w-24">Name:</span>
                    <span className="text-gray-900 font-medium">{submission.user.name}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600 w-24">Email:</span>
                    <span className="text-gray-900">{submission.user.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600 w-24">Phone:</span>
                    <span className="text-gray-900">{submission.user.phone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Document Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <FileText className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600 w-24">Type:</span>
                    <span className="text-gray-900 font-medium">
                      {getDocumentTypeLabel(submission.document_type)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FileText className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600 w-24">Number:</span>
                    <span className="text-gray-900 font-mono">{submission.document_number}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                    <span className="text-gray-600 w-24">Submitted:</span>
                    <span className="text-gray-900">
                      {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

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
            </div>

            {/* Right: Document Viewer */}
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg overflow-hidden relative" style={{ minHeight: '400px' }}>
                {documentImages.length > 0 && (
                  <>
                    <div className="relative">
                      <AuthenticatedImage
                        src={documentImages[currentImageIndex].url}
                        alt={documentImages[currentImageIndex].label}
                        className="w-full h-auto transition-transform duration-200"
                        style={{ transform: `scale(${zoom})` }}
                      />
                      
                      {/* Image Label */}
                      <div className="absolute top-4 left-4 bg-black bg-opacity-75 rounded-lg px-3 py-1.5">
                        <span className="text-white text-sm font-medium">
                          {documentImages[currentImageIndex].label}
                        </span>
                      </div>
                    </div>
                    
                    {/* Image Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black bg-opacity-75 rounded-lg px-4 py-2">
                      <button
                        onClick={() => setZoom(Math.max(1, zoom - 0.25))}
                        disabled={zoom <= 1}
                        className="text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Zoom out"
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
                        aria-label="Zoom in"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                      <div className="w-px h-6 bg-gray-600 mx-2" />
                      <button
                        onClick={() => handleDownload(documentImages[currentImageIndex].url)}
                        className="text-white hover:text-gray-300"
                        aria-label="Download image"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Image Navigation */}
              {documentImages.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    {documentImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentImageIndex(index);
                          setZoom(1);
                        }}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          index === currentImageIndex
                            ? 'bg-blue-600'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        aria-label={`View ${img.label}`}
                      />
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-600">
                    {currentImageIndex + 1} / {documentImages.length}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {submission.status === 'pending' && !showRejectForm && (
          <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t">
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
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
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
          </div>
        )}

        {submission.status !== 'pending' && (
          <div className="px-6 py-4 bg-gray-50 border-t">
            <div className={`flex items-center justify-center text-sm font-medium ${
              submission.status === 'approved' ? 'text-green-700' : 'text-red-700'
            }`}>
              {submission.status === 'approved' ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  This KYC submission has been approved
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 mr-2" />
                  This KYC submission has been rejected
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
