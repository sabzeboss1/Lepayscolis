'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FileUpload } from '@/components/ui/FileUpload';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { FileUploadService, DEFAULT_UPLOAD_OPTIONS } from '@/lib/services/FileUploadService';
import type { KYCDocument } from '@/lib/types/api';

export default function KYCVerificationPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [kycDocument, setKycDocument] = useState<KYCDocument | null>(null);
  const [documentType, setDocumentType] = useState<'passport' | 'idCard' | 'driversLicense'>('passport');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentBackFile, setDocumentBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKYCDocument();
  }, []);

  const fetchKYCDocument = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ document: KYCDocument }>(API_ENDPOINTS.kyc.status);
      setKycDocument(response.document);
    } catch (err: any) {
      // 404 means no KYC document submitted yet, which is fine
      if (err.status !== 404) {
        console.error('Error fetching KYC document:', err);
        setError('Erreur lors du chargement du statut KYC');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!documentFile) {
      setError(t('kyc.documentRequired'));
      return;
    }

    if (documentType === 'idCard' && !documentBackFile) {
      setError(t('kyc.idCardBackRequired'));
      return;
    }

    if (!selfieFile) {
      setError(t('kyc.selfieRequired'));
      return;
    }

    // Validate files before submission
    const documentValidation = FileUploadService.validateFile(documentFile, DEFAULT_UPLOAD_OPTIONS.document);
    if (!documentValidation.valid) {
      setError(documentValidation.error || 'Document invalide');
      return;
    }

    if (documentBackFile) {
      const backValidation = FileUploadService.validateFile(documentBackFile, DEFAULT_UPLOAD_OPTIONS.document);
      if (!backValidation.valid) {
        setError(backValidation.error || 'Document verso invalide');
        return;
      }
    }

    const selfieValidation = FileUploadService.validateFile(selfieFile, DEFAULT_UPLOAD_OPTIONS.image);
    if (!selfieValidation.valid) {
      setError(selfieValidation.error || 'Selfie invalide');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('document_file', documentFile);
      if (documentBackFile) {
        formData.append('document_back_file', documentBackFile);
      }
      formData.append('selfie_file', selfieFile);

      // Use fetch directly for FormData (apiClient handles JSON by default)
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${API_ENDPOINTS.kyc.submit}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit document');
      }

      const data = await response.json();
      setKycDocument(data.document);
      setSuccess(t('kyc.submitSuccess'));
      setDocumentFile(null);
      setDocumentBackFile(null);
      setSelfieFile(null);
    } catch (err: any) {
      setError(err.message || t('kyc.submitError'));
      console.error('Error submitting KYC document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return t('kyc.approved');
      case 'rejected':
        return t('kyc.rejected');
      case 'pending':
        return t('kyc.pending');
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{t('kyc.title')}</h1>
        <p className="text-gray-600 mb-8">{t('kyc.description')}</p>

        {/* Current Status */}
        {user && (
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t('kyc.status')}</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">{t('profile.kycStatus')}:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.kyc_status)}`}>
                  {getStatusText(user.kyc_status)}
                </span>
              </div>

              {kycDocument && kycDocument.status === 'rejected' && kycDocument.rejection_reason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">{t('kyc.rejectionReason')}:</p>
                  <p className="text-sm text-red-700">{kycDocument.rejection_reason}</p>
                </div>
              )}

              {kycDocument && kycDocument.status === 'pending' && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    Your document is currently under review. This usually takes 1-2 business days.
                  </p>
                </div>
              )}

              {kycDocument && kycDocument.status === 'approved' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Your identity has been verified. You can now access all platform features.
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Why KYC Explanation */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔒</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('kyc.whyKycTitle')}</h3>
                <p className="text-sm text-blue-800 mb-3">{t('kyc.whyKycDescription')}</p>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>{t('kyc.whyKycReason1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>{t('kyc.whyKycReason2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>{t('kyc.whyKycReason3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>{t('kyc.whyKycReason4')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Upload Form */}
        {(!kycDocument || kycDocument.status === 'rejected') && (
          <Card>
            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {kycDocument?.status === 'rejected' ? t('kyc.resubmit') : t('kyc.uploadDocument')}
              </h2>

              {/* Document Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('kyc.documentType')}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType('passport');
                      setDocumentBackFile(null);
                    }}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${documentType === 'passport'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-2xl mb-2">🛂</div>
                    <div className="font-medium">{t('kyc.passport')}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocumentType('idCard')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${documentType === 'idCard'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-2xl mb-2">🪪</div>
                    <div className="font-medium">{t('kyc.idCard')}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentType('driversLicense');
                      setDocumentBackFile(null);
                    }}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${documentType === 'driversLicense'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="text-2xl mb-2">🚗</div>
                    <div className="font-medium">{t('kyc.driversLicense')}</div>
                  </button>
                </div>
              </div>

              {/* Document Front Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {documentType === 'idCard' ? 'Carte d\'identité (Recto)' : documentType === 'passport' ? 'Passeport (Première page)' : 'Document (Recto)'}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <FileUpload
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(file) => {
                    if (file) {
                      // Validate file type
                      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                      if (!validTypes.includes(file.type)) {
                        setError('Type de fichier invalide. Utilisez JPG, PNG ou PDF.');
                        return;
                      }
                      // Validate file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        setError('Le fichier est trop volumineux. Maximum 5 MB.');
                        return;
                      }
                      setDocumentFile(file);
                      setError(null);
                    }
                  }}
                  maxSize={5}
                  helperText="Formats acceptés: JPG, PNG, PDF (max 5 MB)"
                />
                {documentFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Fichier sélectionné: {documentFile.name}
                  </p>
                )}
              </div>

              {/* Document Back Upload (ID Card only) */}
              {documentType === 'idCard' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carte d'identité (Verso)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <FileUpload
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(file) => {
                      if (file) {
                        // Validate file type
                        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                        if (!validTypes.includes(file.type)) {
                          setError('Type de fichier invalide. Utilisez JPG, PNG ou PDF.');
                          return;
                        }
                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          setError('Le fichier est trop volumineux. Maximum 5 MB.');
                          return;
                        }
                        setDocumentBackFile(file);
                        setError(null);
                      }
                    }}
                    maxSize={5}
                    helperText="Formats acceptés: JPG, PNG, PDF (max 5 MB)"
                  />
                  {documentBackFile && (
                    <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Fichier sélectionné: {documentBackFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* Selfie Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo Selfie avec le document
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">📸</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-2">Instructions pour le selfie:</p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• Tenez votre document d'identité à côté de votre visage</li>
                        <li>• Assurez-vous que votre visage et le document sont clairement visibles</li>
                        <li>• Prenez la photo dans un endroit bien éclairé</li>
                        <li>• Ne portez pas de lunettes de soleil ou de chapeau</li>
                        <li>• Le document doit être lisible sur la photo</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <FileUpload
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={(file) => {
                    if (file) {
                      // Validate file type
                      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                      if (!validTypes.includes(file.type)) {
                        setError('Type de fichier invalide pour le selfie. Utilisez JPG ou PNG.');
                        return;
                      }
                      // Validate file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        setError('Le fichier est trop volumineux. Maximum 5 MB.');
                        return;
                      }
                      setSelfieFile(file);
                      setError(null);
                    }
                  }}
                  maxSize={5}
                  helperText="Formats acceptés: JPG, PNG (max 5 MB)"
                />
                {selfieFile && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Fichier sélectionné: {selfieFile.name}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isSubmitting || !documentFile || !selfieFile || (documentType === 'idCard' && !documentBackFile)}
                loading={isSubmitting}
              >
                {isSubmitting ? t('kyc.submitting') : t('kyc.submitDocument')}
              </Button>
            </form>
          </Card>
        )}

        {/* Information Card */}
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-3">{t('kyc.importantInfo')}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t('kyc.info1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t('kyc.info2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t('kyc.info3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t('kyc.info4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{t('kyc.info5')}</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
