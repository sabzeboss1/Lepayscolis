'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FileUpload } from '@/components/ui/FileUpload';
import { CameraCapture } from '@/components/ui/CameraCapture';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { FileUploadService, DEFAULT_UPLOAD_OPTIONS } from '@/lib/services/FileUploadService';
import type { KYCDocument } from '@/lib/types/api';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  CreditCard,
  Car,
  Camera,
  Info,
  Lock,
  Users,
  Zap,
  Award,
  Check,
  AlertCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';

type DocumentType = 'passport' | 'idCard' | 'driversLicense';

const DOC_TYPES: {
  value: DocumentType;
  label: string;
  subtitle: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { value: 'passport', label: 'Passeport', subtitle: 'Valide internationalement', icon: BookOpen },
  { value: 'idCard', label: "Carte d'identité (CNI)", subtitle: 'Recto + verso requis', icon: CreditCard },
  { value: 'driversLicense', label: 'Permis de conduire', subtitle: 'Recto uniquement', icon: Car },
];

const WHY_KYC = [
  {
    icon: Lock,
    title: 'Sécurité',
    desc: 'Protéger tous les utilisateurs',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: Users,
    title: 'Confiance',
    desc: 'Communauté vérifiée',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
  },
  {
    icon: Zap,
    title: 'Accès complet',
    desc: 'Toutes les fonctionnalités',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
  },
  {
    icon: Award,
    title: 'Badge vérifié',
    desc: 'Profil de confiance',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
  },
];

export default function KYCVerificationPage() {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [kycDocument, setKycDocument] = useState<KYCDocument | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('passport');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentBackFile, setDocumentBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
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
      const response = await apiClient.get<{ data: KYCDocument }>('/api/kyc');
      setKycDocument(response.data);
    } catch (err: any) {
      if (err.status !== 404) {
        console.error('Error fetching KYC document:', err);
        setError('Erreur lors du chargement du statut KYC');
      } else {
        // 404 means no document submitted yet, which is normal
        setKycDocument(null);
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

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('document_front', documentFile);
      if (documentBackFile) formData.append('document_back', documentBackFile);
      formData.append('selfie', selfieFile);

      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];

      const response = await fetch(`${apiClient.baseUrl}${API_ENDPOINTS.kyc.submit}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit document');
      }

      const data = await response.json();
      setKycDocument(data.data);
      setSuccess(t('kyc.submitSuccess'));
      setDocumentFile(null);
      setDocumentBackFile(null);
      setSelfieFile(null);
      
      // Recharger les données KYC et utilisateur pour s'assurer que tout est à jour
      await Promise.all([
        fetchKYCDocument(),
        refreshUser?.()
      ]);
    } catch (err: any) {
      setError(err.message || t('kyc.submitError'));
      console.error('Error submitting KYC document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelfieCapture = (file: File) => {
    setSelfieFile(file);
    setShowCamera(false);
    setError(null);
  };

  const handleFileChange = (
    setter: (f: File | null) => void,
    validTypes: string[],
    validExtensions: string[],
    errorMessage: string,
  ) => (file: File | null) => {
    if (!file) {
      setter(null);
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setError(errorMessage);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Maximum 5 MB.');
      return;
    }
    setter(file);
    setError(null);
  };

  // ─── Loading Skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-blue-200" />
          </div>
          <div className="h-4 bg-gray-200 rounded-full w-48 mx-auto mb-2 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded-full w-32 mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  // ─── Status helpers ───────────────────────────────────────────────────────
  // Determine the actual KYC status based on both user status and document existence
  const getActualKycStatus = () => {
    // If no document has been submitted, always show 'not_submitted'
    if (!kycDocument) {
      return 'not_submitted';
    }
    
    // If document exists, use the document status
    return kycDocument.status;
  };

  const kycStatus = getActualKycStatus();

  const statusConfig = {
    approved: {
      icon: ShieldCheck,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-700',
      border: 'border-green-200',
      bg: 'bg-green-50',
      label: t('kyc.approved'),
      message: '✓ Votre identité a été vérifiée. Vous avez accès à toutes les fonctionnalités de la plateforme.',
    },
    pending: {
      icon: Clock,
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-700',
      border: 'border-yellow-200',
      bg: 'bg-yellow-50',
      label: t('kyc.pending'),
      message:
        'Votre document est en cours de vérification. Ce processus prend généralement 1 à 2 jours ouvrables.',
    },
    rejected: {
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-700',
      border: 'border-red-200',
      bg: 'bg-red-50',
      label: t('kyc.rejected'),
      message: 'Votre document a été rejeté. Veuillez soumettre à nouveau vos documents.',
    },
    not_submitted: {
      icon: Shield,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-600',
      border: 'border-gray-200',
      bg: 'bg-gray-50',
      label: 'Non soumis',
      message: 'Complétez votre vérification pour accéder à toutes les fonctionnalités.',
    },
  } as const;

  type StatusKey = keyof typeof statusConfig;
  const cfg = statusConfig[(kycStatus as StatusKey) in statusConfig ? (kycStatus as StatusKey) : 'not_submitted'];
  const StatusIcon = cfg.icon;

  const showForm = !kycDocument || kycDocument.status === 'rejected';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Hero Header ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t('kyc.title')}
          </h1>
          <p className="text-blue-200 text-sm max-w-md mx-auto leading-relaxed">
            {kycDocument 
              ? "Gérez votre vérification d'identité" 
              : "Complétez votre vérification d'identité pour accéder à toutes les fonctionnalités"
            }
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* ─── Status Card ─────────────────────────────────────────────────── */}
        {(kycDocument || user?.kyc_status === 'approved') && (
          <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5`}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Statut actuel</p>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                <StatusIcon className={`w-6 h-6 ${cfg.iconColor}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.badgeBg} ${cfg.badgeText}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{cfg.message}</p>
              </div>
            </div>

            {kycDocument?.status === 'rejected' && kycDocument.rejection_reason && (
              <div className="mt-4 p-3 bg-white/60 border border-red-100 rounded-xl">
                <p className="text-xs font-semibold text-red-800 mb-1">{t('kyc.rejectionReason')} :</p>
                <p className="text-sm text-red-700">{kycDocument.rejection_reason}</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Why KYC ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-blue-500" />
            <h2 className="font-bold text-gray-900 text-sm">{t('kyc.whyKycTitle')}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">{t('kyc.whyKycDescription')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {WHY_KYC.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`${item.bg} border ${item.border} rounded-xl p-3 text-center`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="text-xs font-bold text-gray-800">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-tight">{item.desc}</div>
                </div>
              );
            })}
          </div>
          <ul className="mt-4 space-y-1.5">
            {[
              t('kyc.whyKycReason1'),
              t('kyc.whyKycReason2'),
              t('kyc.whyKycReason3'),
              t('kyc.whyKycReason4'),
            ].map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* ─── Upload Form ──────────────────────────────────────────────────── */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                {kycDocument?.status === 'rejected' ? t('kyc.resubmit') : t('kyc.uploadDocument')}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Formats acceptés : JPG, PNG, PDF — Max 5 MB par fichier
              </p>
            </div>

            <div className="p-5 space-y-7">
              {/* Document Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t('kyc.documentType')} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {DOC_TYPES.map((doc) => {
                    const DocIcon = doc.icon;
                    const selected = documentType === doc.value;
                    return (
                      <button
                        key={doc.value}
                        type="button"
                        onClick={() => {
                          setDocumentType(doc.value);
                          if (doc.value !== 'idCard') setDocumentBackFile(null);
                        }}
                        className={`group p-4 border-2 rounded-xl text-center transition-all duration-200 ${
                          selected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${
                            selected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                          }`}
                        >
                          <DocIcon className="w-6 h-6" />
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">{doc.label}</div>
                        <div className={`text-xs mt-1 ${selected ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                          {selected ? '✓ Sélectionné' : doc.subtitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Document Front Upload */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-semibold text-gray-700">
                    {documentType === 'idCard'
                      ? "Carte d'identité — Recto"
                      : documentType === 'passport'
                      ? 'Passeport — Première page'
                      : 'Document — Recto'}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
                <FileUpload
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange(
                    setDocumentFile,
                    ['image/jpeg', 'image/jpg', 'image/png', 'image/pjpeg', 'application/pdf'],
                    ['jpg', 'jpeg', 'png', 'pdf'],
                    'Type de fichier invalide. Utilisez JPG, PNG ou PDF.',
                  )}
                  value={documentFile}
                  maxSize={5}
                  helperText="Formats acceptés: JPG, PNG, PDF (max 5 MB)"
                />
              </div>

              {/* Document Back Upload (ID Card only) */}
              {documentType === 'idCard' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <label className="text-sm font-semibold text-gray-700">
                      Carte d'identité — Verso
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                  </div>
                  <FileUpload
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange(
                      setDocumentBackFile,
                      ['image/jpeg', 'image/jpg', 'image/png', 'image/pjpeg', 'application/pdf'],
                      ['jpg', 'jpeg', 'png', 'pdf'],
                      'Type de fichier invalide. Utilisez JPG, PNG ou PDF.',
                    )}
                    value={documentBackFile}
                    maxSize={5}
                    helperText="Formats acceptés: JPG, PNG, PDF (max 5 MB)"
                  />
                </div>
              )}

              {/* Selfie Upload */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gray-400" />
                  <label className="text-sm font-semibold text-gray-700">
                    Selfie avec le document
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>

                {/* Selfie instructions */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Camera className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-2">Instructions pour le selfie :</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Tenez votre document d'identité à côté de votre visage
                        </li>
                        <li className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Assurez-vous que votre visage et le document sont clairement visibles
                        </li>
                        <li className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Prenez la photo dans un endroit bien éclairé
                        </li>
                        <li className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Ne portez pas de lunettes de soleil ou de chapeau
                        </li>
                        <li className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Le document doit être lisible sur la photo
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Selfie capture options */}
                {!selfieFile ? (
                  <div className="flex justify-center">
                    {/* Camera capture button */}
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="group p-6 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 text-center w-full max-w-sm"
                    >
                      <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-700 transition-colors">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                      <div className="font-semibold text-blue-900 text-lg mb-2">Prendre un selfie</div>
                      <div className="text-sm text-blue-600">Utilisez la caméra de votre appareil</div>
                    </button>
                  </div>
                ) : (
                  /* Selfie preview */
                  <div className="border-2 border-green-200 rounded-xl bg-green-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-green-900 text-sm">Selfie capturé</div>
                          <div className="text-xs text-green-600">{selfieFile.name}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Reprendre
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelfieFile(null)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload progress summary */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  { label: 'Document recto', done: !!documentFile },
                  {
                    label: documentType === 'idCard' ? 'Document verso' : 'Non requis',
                    done: documentType === 'idCard' ? !!documentBackFile : true,
                    skipped: documentType !== 'idCard',
                  },
                  { label: 'Selfie', done: !!selfieFile },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-3 py-2 text-center text-xs border ${
                      item.skipped
                        ? 'bg-gray-50 border-gray-100 text-gray-400'
                        : item.done
                        ? 'bg-green-50 border-green-100 text-green-700 font-medium'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    {item.skipped ? '—' : item.done ? '✓ ' : '○ '}
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  {success}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={
                  isSubmitting ||
                  !documentFile ||
                  !selfieFile ||
                  (documentType === 'idCard' && !documentBackFile)
                }
                loading={isSubmitting}
              >
                <span className="inline-flex items-center">
                  {isSubmitting ? null : <Shield className="w-4 h-4 mr-2" />}
                  <span>{isSubmitting ? t('kyc.submitting') : t('kyc.submitDocument')}</span>
                </span>
              </Button>
            </div>
          </form>
        )}

        {/* ─── Important Info Card ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-gray-900 text-sm">{t('kyc.importantInfo')}</h3>
          </div>
          <ul className="space-y-2.5">
            {[
              t('kyc.info1'),
              t('kyc.info2'),
              t('kyc.info3'),
              t('kyc.info4'),
              t('kyc.info5'),
            ].map((info, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-blue-500" />
                </div>
                {info}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCamera}
        onCapture={handleSelfieCapture}
        onCancel={() => setShowCamera(false)}
        title="Selfie avec document"
        instructions={[
          "Tenez votre document d'identité à côté de votre visage",
          "Assurez-vous que votre visage et le document sont clairement visibles",
          "Prenez la photo dans un endroit bien éclairé",
          "Le document doit être lisible sur la photo"
        ]}
      />
    </div>
  );
}
