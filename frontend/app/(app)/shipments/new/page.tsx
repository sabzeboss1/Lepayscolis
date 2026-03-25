'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KYCBlocker } from '@/components/features/KYCBlocker';
import { FileUpload } from '@/components/ui/FileUpload';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { z } from 'zod';
import {
  Package,
  User,
  MapPin,
  Navigation,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Wallet,
} from 'lucide-react';

const shipmentSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  description: z.string().min(1, 'Description is required'),
  weight: z.number().positive('Weight must be positive'),
  length: z.number().positive('Length must be positive'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  value: z.number().positive('Value must be positive'),
  packageType: z.string().min(1, 'Package type is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientPhone: z.string().min(1, 'Recipient phone is required'),
  pickupCity: z.string().min(1, 'Pickup city is required'),
  pickupCountry: z.string().min(1, 'Pickup country is required'),
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  deliveryCity: z.string().min(1, 'Delivery city is required'),
  deliveryCountry: z.string().min(1, 'Delivery country is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
});

type ShipmentFormData = z.infer<typeof shipmentSchema>;

interface SectionCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function SectionCard({ icon, iconBg, title, subtitle, children }: SectionCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-4 border-b border-slate-100 ${iconBg}`}>
        <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function NewShipmentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showProhibitedItems, setShowProhibitedItems] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

  const [formData, setFormData] = useState<Partial<ShipmentFormData>>({
    tripId: searchParams?.get('tripId') || '',
    description: '',
    weight: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    value: undefined,
    packageType: '',
    recipientName: '',
    recipientPhone: '',
    pickupCity: '',
    pickupCountry: '',
    pickupAddress: '',
    deliveryCity: '',
    deliveryCountry: '',
    deliveryAddress: '',
  });

  // Fetch trip details if tripId is in URL
  useEffect(() => {
    const tripId = searchParams?.get('tripId');
    if (tripId) {
      const fetchTrip = async () => {
        try {
          const response = await apiClient.get<{ data: any }>(`/api/trips/${tripId}`);
          setSelectedTrip(response.data);
        } catch (error) {
          console.error('Failed to fetch trip:', error);
        }
      };
      fetchTrip();
    }
  }, [searchParams]);

  // Fetch wallet balance on mount
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await apiClient.get<{ data: any }>(API_ENDPOINTS.wallet.balance);
        setWalletBalance(response.data.balance);
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };
    if (user) fetchWallet();
  }, [user]);

  // Calculate estimated cost when weight or trip changes
  useEffect(() => {
    if (formData.weight && selectedTrip?.price_per_kg) {
      setEstimatedCost(formData.weight * selectedTrip.price_per_kg);
    } else {
      setEstimatedCost(null);
    }
  }, [formData.weight, selectedTrip]);

  const handleInputChange = (field: keyof ShipmentFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      shipmentSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) newErrors[issue.path[0].toString()] = issue.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setErrors({ submit: t('shipments.prohibitedItemsRequired') });
      return;
    }
    
    // Check wallet balance
    if (estimatedCost && walletBalance !== null && walletBalance < estimatedCost) {
      setErrors({ 
        submit: `Solde insuffisant. Requis: €${estimatedCost.toFixed(2)}, Disponible: €${walletBalance.toFixed(2)}` 
      });
      return;
    }
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      let photoUrls: string[] = [];
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        try {
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            photoUrls = [data.url];
          }
        } catch {
          // ignore upload error — proceed without photo
        }
      }

      await apiClient.post<{ data: any }>(API_ENDPOINTS.shipments.create, {
        trip_id: formData.tripId,
        pickup_country: formData.pickupCountry,
        pickup_city: formData.pickupCity,
        pickup_address: formData.pickupAddress,
        delivery_country: formData.deliveryCountry,
        delivery_city: formData.deliveryCity,
        delivery_address: formData.deliveryAddress,
        package_description: formData.description,
        package_weight: formData.weight,
        package_length: formData.length,
        package_width: formData.width,
        package_height: formData.height,
        photo_urls: photoUrls,
      });

      router.push('/shipments/my');
    } catch (error) {
      const errorMessage = ErrorHandler.handle(error);
      setErrors({ submit: errorMessage.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KYCBlocker action="créer une expédition">
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 font-heading">
                  {t('shipments.create')}
                </h1>
                <p className="text-sm text-slate-500">Remplissez les informations de votre colis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

            {/* Wallet Balance & Cost Estimate */}
            {walletBalance !== null && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Solde disponible</p>
                      <p className="text-lg font-bold text-slate-900">€{walletBalance.toFixed(2)}</p>
                    </div>
                  </div>
                  {estimatedCost !== null && (
                    <div className="text-right">
                      <p className="text-xs text-slate-600">Coût estimé</p>
                      <p className={`text-lg font-bold ${walletBalance >= estimatedCost ? 'text-emerald-600' : 'text-red-600'}`}>
                        €{estimatedCost.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                {estimatedCost !== null && walletBalance < estimatedCost && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Solde insuffisant. Rechargez votre wallet avant de continuer.
                  </div>
                )}
              </div>
            )}

            {/* Package Details */}
            <SectionCard
              icon={<Package className="w-4 h-4 text-orange-600" />}
              iconBg="bg-orange-50"
              title={t('shipments.packageDetails')}
              subtitle="Description, poids et valeur du colis"
            >
              <Input
                type="text"
                label={t('shipments.description')}
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                error={errors.description}
                required
                placeholder="ex : Vêtements, Électronique, Documents..."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label={`${t('shipments.weight')} (kg)`}
                  value={formData.weight?.toString() || ''}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                  error={errors.weight}
                  required
                  placeholder="0.0"
                />
                <Input
                  type="number"
                  label={`${t('shipments.value')} (EUR)`}
                  value={formData.value?.toString() || ''}
                  onChange={(e) => handleInputChange('value', parseFloat(e.target.value))}
                  error={errors.value}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  type="number"
                  label="Longueur (cm)"
                  value={formData.length?.toString() || ''}
                  onChange={(e) => handleInputChange('length', parseFloat(e.target.value))}
                  error={errors.length}
                  required
                  placeholder="0"
                />
                <Input
                  type="number"
                  label="Largeur (cm)"
                  value={formData.width?.toString() || ''}
                  onChange={(e) => handleInputChange('width', parseFloat(e.target.value))}
                  error={errors.width}
                  required
                  placeholder="0"
                />
                <Input
                  type="number"
                  label="Hauteur (cm)"
                  value={formData.height?.toString() || ''}
                  onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                  error={errors.height}
                  required
                  placeholder="0"
                />
              </div>
              <Input
                type="text"
                label={t('shipments.packageType')}
                value={formData.packageType || ''}
                onChange={(e) => handleInputChange('packageType', e.target.value)}
                error={errors.packageType}
                required
                placeholder="ex : Documents, Électronique, Vêtements..."
              />

              {/* Photo Upload */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <label className="text-sm font-medium text-slate-700">
                    {t('shipments.photos')}{' '}
                    <span className="text-slate-400 font-normal text-xs">({t('common.optional')})</span>
                  </label>
                </div>
                <FileUpload
                  accept="image/*"
                  value={photoFile}
                  onChange={(file) => setPhotoFile(file)}
                  maxSize={5}
                  helperText={t('shipments.photosHelper')}
                />
              </div>
            </SectionCard>

            {/* Recipient Info */}
            <SectionCard
              icon={<User className="w-4 h-4 text-blue-600" />}
              iconBg="bg-blue-50"
              title={t('shipments.recipientInfo')}
              subtitle="Nom et téléphone du destinataire"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="text"
                  label={t('shipments.recipientName')}
                  value={formData.recipientName || ''}
                  onChange={(e) => handleInputChange('recipientName', e.target.value)}
                  error={errors.recipientName}
                  required
                  placeholder={t('shipments.recipientNamePlaceholder')}
                />
                <Input
                  type="tel"
                  label={t('shipments.recipientPhone')}
                  value={formData.recipientPhone || ''}
                  onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                  error={errors.recipientPhone}
                  required
                  placeholder={t('shipments.recipientPhonePlaceholder')}
                />
              </div>
            </SectionCard>

            {/* Pickup Location */}
            <SectionCard
              icon={<MapPin className="w-4 h-4 text-emerald-600" />}
              iconBg="bg-emerald-50"
              title={t('shipments.pickupLocation')}
              subtitle={t('shipments.pickupLocationHelper')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="text"
                  label={t('shipments.pickupCity')}
                  value={formData.pickupCity || ''}
                  onChange={(e) => handleInputChange('pickupCity', e.target.value)}
                  error={errors.pickupCity}
                  required
                  placeholder={t('shipments.pickupCityPlaceholder')}
                />
                <Input
                  type="text"
                  label={t('shipments.pickupCountry')}
                  value={formData.pickupCountry || ''}
                  onChange={(e) => handleInputChange('pickupCountry', e.target.value)}
                  error={errors.pickupCountry}
                  required
                  placeholder={t('shipments.pickupCountryPlaceholder')}
                />
              </div>
              <Input
                type="text"
                label={t('shipments.pickupAddress')}
                value={formData.pickupAddress || ''}
                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                error={errors.pickupAddress}
                required
                placeholder={t('shipments.pickupAddressPlaceholder')}
              />
            </SectionCard>

            {/* Delivery Location */}
            <SectionCard
              icon={<Navigation className="w-4 h-4 text-purple-600" />}
              iconBg="bg-purple-50"
              title={t('shipments.deliveryLocation')}
              subtitle={t('shipments.deliveryLocationHelper')}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="text"
                  label={t('shipments.deliveryCity')}
                  value={formData.deliveryCity || ''}
                  onChange={(e) => handleInputChange('deliveryCity', e.target.value)}
                  error={errors.deliveryCity}
                  required
                  placeholder={t('shipments.deliveryCityPlaceholder')}
                />
                <Input
                  type="text"
                  label={t('shipments.deliveryCountry')}
                  value={formData.deliveryCountry || ''}
                  onChange={(e) => handleInputChange('deliveryCountry', e.target.value)}
                  error={errors.deliveryCountry}
                  required
                  placeholder={t('shipments.deliveryCountryPlaceholder')}
                />
              </div>
              <Input
                type="text"
                label={t('shipments.deliveryAddress')}
                value={formData.deliveryAddress || ''}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                error={errors.deliveryAddress}
                required
                placeholder={t('shipments.deliveryAddressPlaceholder')}
              />
            </SectionCard>

            {/* Prohibited Items */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-200">
                <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-amber-900">
                    {t('shipments.prohibitedItemsTitle')}
                  </h2>
                  <p className="text-xs text-amber-700">{t('shipments.prohibitedItemsWarning')}</p>
                </div>
              </div>
              <div className="p-5">
                <button
                  type="button"
                  onClick={() => setShowProhibitedItems(!showProhibitedItems)}
                  className="flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900 mb-4 transition-colors"
                >
                  {showProhibitedItems ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      {t('shipments.hideProhibitedList')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      {t('shipments.viewProhibitedList')}
                    </>
                  )}
                </button>

                {showProhibitedItems && (
                  <div className="mb-4 bg-white border border-amber-200 rounded-xl p-4 slide-down">
                    <p className="text-xs font-semibold text-slate-800 mb-2">
                      {t('shipments.prohibitedItemsListTitle')}
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-700">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          {t(`shipments.prohibitedItem${i}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        acceptedTerms
                          ? 'bg-orange-500 border-orange-500'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {acceptedTerms && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                  <span className="text-xs text-slate-700">
                    {t('shipments.prohibitedItemsConfirmation')}
                  </span>
                </label>
              </div>
            </div>

            {/* Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.submit}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pb-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                loading={isSubmitting}
                className="flex-1"
              >
                {t('common.submit')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </KYCBlocker>
  );
}
