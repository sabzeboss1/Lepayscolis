'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KYCBlocker } from '@/components/features/KYCBlocker';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { CitySelect } from '@/components/ui/CitySelect';
import { FileUpload } from '@/components/ui/FileUpload';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { useUserCurrency } from '@/lib/hooks/useUserCurrency';
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
  Plus,
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
  pickupCountryId: z.number().positive('Pickup country is required'),
  pickupCityId: z.number().positive('Pickup city is required'),
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  deliveryCountryId: z.number().positive('Delivery country is required'),
  deliveryCityId: z.number().positive('Delivery city is required'),
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
  const { formatCurrency, currencySymbol, currencyCode } = useUserCurrency();
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
    pickupCountryId: undefined,
    pickupCityId: undefined,
    pickupAddress: '',
    deliveryCountryId: undefined,
    deliveryCityId: undefined,
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
          setErrors({ submit: 'Voyage non trouvé. Veuillez sélectionner un autre voyage.' });
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

  const handleInputChange = (field: keyof ShipmentFormData, value: string | number | undefined) => {
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
          if (issue.path[0]) {
            const fieldName = issue.path[0].toString();
            newErrors[fieldName] = issue.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      setErrors({ submit: 'Vous devez certifier que votre colis ne contient aucun objet interdit' });
      return;
    }
    
    // Check wallet balance
    if (estimatedCost && walletBalance !== null && walletBalance < estimatedCost) {
      setErrors({ 
        submit: `Solde insuffisant. Requis: ${formatCurrency(estimatedCost)}, Disponible: ${formatCurrency(walletBalance)}` 
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
        } catch (uploadError) {
          // ignore upload error — proceed without photo
        }
      }

      const shipmentData = {
        trip_id: formData.tripId,
        pickup_country_id: formData.pickupCountryId,
        pickup_city_id: formData.pickupCityId,
        pickup_address: formData.pickupAddress,
        delivery_country_id: formData.deliveryCountryId,
        delivery_city_id: formData.deliveryCityId,
        delivery_address: formData.deliveryAddress,
        package_description: formData.description,
        package_weight: formData.weight,
        package_length: formData.length,
        package_width: formData.width,
        package_height: formData.height,
        package_value: formData.value,
        package_type: formData.packageType,
        recipient_name: formData.recipientName,
        recipient_phone: formData.recipientPhone,
        photo_urls: photoUrls,
      };

      await apiClient.post<{ data: any }>(API_ENDPOINTS.shipments.create, shipmentData);

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
        {/* If no trip selected, show choice between two systems */}
        {!selectedTrip && !searchParams?.get('tripId') && (
          <>
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
                      Créer une expédition
                    </h1>
                    <p className="text-sm text-slate-500">Choisissez le type d'expédition que vous souhaitez créer</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Choice between two systems */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
              
              {/* Option 1: Traditional shipment (with trip) */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                   onClick={() => router.push('/trips/search')}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                    <Navigation className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Expédition avec voyage sélectionné
                    </h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Choisissez un voyage existant et créez une expédition pour ce voyage spécifique. 
                      Le prix est calculé selon le tarif du voyageur.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Prix fixe
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Voyage confirmé
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Paiement immédiat
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <svg className="w-3 h-3 text-slate-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Option 2: Shipment request (bidding system) */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
                   onClick={() => router.push('/shipment-requests/new')}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Annonce d'expédition avec soumissions
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Nouveau
                      </span>
                    </h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Publiez une annonce d'expédition et laissez les voyageurs soumissionner avec leurs prix. 
                      Choisissez la meilleure offre.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Prix négociable
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Plusieurs offres
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Vous choisissez
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <svg className="w-3 h-3 text-slate-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Quelle option choisir ?</p>
                    <p>
                      <strong>Voyage sélectionné</strong> : Si vous avez trouvé un voyage qui vous convient et voulez réserver immédiatement.
                      <br />
                      <strong>Annonce avec soumissions</strong> : Si vous voulez comparer plusieurs offres et négocier le meilleur prix.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Form when trip is selected */}
        {selectedTrip && (
          <>
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
                      Créer une expédition
                    </h1>
                    <p className="text-sm text-slate-500">Remplissez les informations de votre colis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Trip Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Voyage sélectionné</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedTrip.departure_city} → {selectedTrip.arrival_city}
                    </p>
                    <p className="text-xs text-slate-600">
                      Départ: {new Date(selectedTrip.departure_date).toLocaleDateString('fr-FR')} • 
                      Prix: {formatCurrency(selectedTrip.price_per_kg, selectedTrip.currency_code)}/kg
                    </p>
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
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(walletBalance)}</p>
                      </div>
                    </div>
                    {estimatedCost !== null && (
                      <div className="text-right">
                        <p className="text-xs text-slate-600">Coût estimé</p>
                        <p className={`text-lg font-bold ${walletBalance >= estimatedCost ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(estimatedCost)}
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
                title="Détails du colis"
                subtitle="Description, poids et valeur du colis à expédier"
              >
                <Input
                  type="text"
                  label="Description du colis"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={errors.description}
                  required
                  placeholder="ex : Vêtements, Électronique, Documents..."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Poids (kg)"
                    value={formData.weight?.toString() || ''}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                    error={errors.weight}
                    required
                    placeholder="0.0"
                  />
                  <Input
                    type="number"
                    label={`Valeur déclarée (${currencyCode})`}
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
                  label="Type de colis"
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
                      Photos du colis{' '}
                      <span className="text-slate-400 font-normal text-xs">(optionnel)</span>
                    </label>
                  </div>
                  <FileUpload
                    accept="image/*"
                    value={photoFile}
                    onChange={(file) => setPhotoFile(file)}
                    maxSize={5}
                    helperText="Ajoutez une photo pour rassurer les voyageurs"
                  />
                </div>
              </SectionCard>

              {/* Recipient Info */}
              <SectionCard
                icon={<User className="w-4 h-4 text-blue-600" />}
                iconBg="bg-blue-50"
                title="Informations du destinataire"
                subtitle="Nom et téléphone du destinataire"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="Nom du destinataire"
                    value={formData.recipientName || ''}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    error={errors.recipientName}
                    required
                    placeholder="Nom complet du destinataire"
                  />
                  <Input
                    type="tel"
                    label="Téléphone du destinataire"
                    value={formData.recipientPhone || ''}
                    onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                    error={errors.recipientPhone}
                    required
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </SectionCard>

              {/* Pickup Location */}
              <SectionCard
                icon={<MapPin className="w-4 h-4 text-emerald-600" />}
                iconBg="bg-emerald-50"
                title="Lieu de récupération"
                subtitle="Où le voyageur peut récupérer le colis"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CountrySelect
                    label="Pays de récupération"
                    value={formData.pickupCountryId}
                    onChange={(id) => handleInputChange('pickupCountryId', id ?? undefined)}
                    error={errors.pickupCountryId}
                    required
                  />
                  <CitySelect
                    label="Ville de récupération"
                    countryId={formData.pickupCountryId}
                    value={formData.pickupCityId}
                    onChange={(id) => handleInputChange('pickupCityId', id ?? undefined)}
                    error={errors.pickupCityId}
                    required
                  />
                </div>
                <Input
                  type="text"
                  label="Adresse de récupération"
                  value={formData.pickupAddress || ''}
                  onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                  error={errors.pickupAddress}
                  required
                  placeholder="Adresse complète où récupérer le colis"
                />
              </SectionCard>

              {/* Delivery Location */}
              <SectionCard
                icon={<Navigation className="w-4 h-4 text-purple-600" />}
                iconBg="bg-purple-50"
                title="Lieu de livraison"
                subtitle="Où le colis doit être livré"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CountrySelect
                    label="Pays de livraison"
                    value={formData.deliveryCountryId}
                    onChange={(id) => handleInputChange('deliveryCountryId', id ?? undefined)}
                    error={errors.deliveryCountryId}
                    required
                  />
                  <CitySelect
                    label="Ville de livraison"
                    countryId={formData.deliveryCountryId}
                    value={formData.deliveryCityId}
                    onChange={(id) => handleInputChange('deliveryCityId', id ?? undefined)}
                    error={errors.deliveryCityId}
                    required
                  />
                </div>
                <Input
                  type="text"
                  label="Adresse de livraison"
                  value={formData.deliveryAddress || ''}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                  error={errors.deliveryAddress}
                  required
                  placeholder="Adresse complète de livraison"
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
                      Objets interdits
                    </h2>
                    <p className="text-xs text-amber-700">Vérifiez que votre colis ne contient aucun objet interdit</p>
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
                        Masquer la liste
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Voir la liste des objets interdits
                      </>
                    )}
                  </button>

                  {showProhibitedItems && (
                    <div className="mb-4 bg-white border border-amber-200 rounded-xl p-4 slide-down">
                      <p className="text-xs font-semibold text-slate-800 mb-2">
                        Objets strictement interdits :
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          Armes et munitions
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          Drogues et stupéfiants
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          Liquides inflammables
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          Produits chimiques
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          Animaux vivants
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          Objets de valeur extrême
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          Documents officiels
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          Produits périssables
                        </li>
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
                      Je certifie que mon colis ne contient aucun objet interdit et respecte les réglementations douanières.
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
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  className="flex-1"
                >
                  Créer l'expédition
                </Button>
              </div>
            </div>
          </form>
          </>
        )}
      </div>
    </KYCBlocker>
  );
}
