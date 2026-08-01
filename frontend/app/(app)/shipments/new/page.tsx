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

// Prohibited keywords (same as backend)
const PROHIBITED_KEYWORDS = [
  'weapon', 'weapons', 'gun', 'guns', 'firearm', 'firearms',
  'drug', 'drugs', 'narcotic', 'narcotics', 'cocaine', 'heroin',
  'explosive', 'explosives', 'bomb', 'bombs', 'ammunition',
  'knife', 'knives', 'blade', 'blades',
  'poison', 'toxic', 'hazardous',
  'arme', 'armes', 'drogue', 'drogues', 'explosif', 'bombe',
];

const shipmentSchema = z.object({
  tripId: z.string().min(1, 'Voyage requis'),
  description: z.string()
    .min(1, 'Description requise')
    .max(500, 'Description trop longue (max 500 caractères)')
    .refine((val) => {
      const lowerVal = val.toLowerCase();
      return !PROHIBITED_KEYWORDS.some(keyword => lowerVal.includes(keyword));
    }, 'La description contient des mots interdits (armes, drogues, explosifs, etc.)'),
  weight: z.number()
    .positive('Le poids doit être positif')
    .min(0.1, 'Poids minimum: 0.1 kg')
    .max(100, 'Poids maximum: 100 kg'),
  length: z.number()
    .positive('La longueur doit être positive')
    .min(1, 'Longueur minimum: 1 cm')
    .max(500, 'Longueur maximum: 500 cm')
    .optional()
    .or(z.literal(undefined)),
  width: z.number()
    .positive('La largeur doit être positive')
    .min(1, 'Largeur minimum: 1 cm')
    .max(500, 'Largeur maximum: 500 cm')
    .optional()
    .or(z.literal(undefined)),
  height: z.number()
    .positive('La hauteur doit être positive')
    .min(1, 'Hauteur minimum: 1 cm')
    .max(500, 'Hauteur maximum: 500 cm')
    .optional()
    .or(z.literal(undefined)),
  value: z.number().min(0, 'La valeur doit être positive ou zéro'),
  packageType: z.string().min(1, 'Type de colis requis').max(100, 'Type trop long (max 100 caractères)'),
  recipientName: z.string().min(1, 'Nom du destinataire requis').max(255, 'Nom trop long (max 255 caractères)'),
  recipientPhone: z.string().min(1, 'Téléphone du destinataire requis').max(50, 'Numéro trop long (max 50 caractères)'),
  pickupCountryId: z.number().positive('Pays de récupération requis'),
  pickupCityId: z.number().positive('Ville de récupération requise'),
  pickupAddress: z.string().max(500, 'Adresse trop longue (max 500 caractères)').optional(),
  deliveryCountryId: z.number().positive('Pays de livraison requis'),
  deliveryCityId: z.number().positive('Ville de livraison requise'),
  deliveryAddress: z.string().max(500, 'Adresse trop longue (max 500 caractères)').optional(),
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
  const { t, locale } = useTranslation();
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
  const [walletData, setWalletData] = useState<any | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [autoSelectedPickupCountry, setAutoSelectedPickupCountry] = useState<string | null>(null);
  const [autoSelectedDeliveryCountry, setAutoSelectedDeliveryCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState<any[]>([]);

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
    console.log('Trip ID from URL:', tripId);
    if (tripId) {
      setFormData(prev => ({ ...prev, tripId }));
      const fetchTrip = async () => {
        try {
          const response = await apiClient.get<{ data: any }>(`/api/trips/${tripId}`);
          console.log('Trip fetched:', response.data);
          const trip = response.data;
          setSelectedTrip(trip);
          if (trip) {
            const pCountry = trip.departure_country_id || trip.departure?.country_id;
            const pCity = trip.departure_city_id || trip.departure?.city_id;
            const dCountry = trip.arrival_country_id || trip.arrival?.country_id;
            const dCity = trip.arrival_city_id || trip.arrival?.city_id;

            setFormData(prev => ({
              ...prev,
              pickupCountryId: pCountry || prev.pickupCountryId,
              pickupCityId: pCity || prev.pickupCityId,
              deliveryCountryId: dCountry || prev.deliveryCountryId,
              deliveryCityId: dCity || prev.deliveryCityId,
            }));
          }
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
        setWalletData(response.data);
        setWalletBalance((typeof response.data.balance === 'number') ? response.data.balance : parseFloat(response.data.balance) || 0);
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      }
    };
    if (user) fetchWallet();
  }, [user]);

  // Fetch countries for auto-selection logic
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await apiClient.get<{ data: any[] }>('/api/countries');
        setCountries(response.data || []);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
    };
    fetchCountries();
  }, []);

  // Auto-select pickup country based on delivery (Russia-Africa logic)
  useEffect(() => {
    if (formData.deliveryCountryId && countries.length > 0) {
      const deliveryCountry = countries.find(c => c.id === formData.deliveryCountryId);
      if (deliveryCountry) {
        const countryName = deliveryCountry.name.toLowerCase();
        
        if (countryName.includes('russia') || countryName.includes('russie')) {
          const africanCountry = countries.find(c => 
            c.name.toLowerCase().includes('cameroun') || 
            c.name.toLowerCase().includes('cameroon')
          ) || countries.find(c => 
            !c.name.toLowerCase().includes('russia') && 
            !c.name.toLowerCase().includes('russie')
          );
          
          if (africanCountry && formData.pickupCountryId !== africanCountry.id) {
            setFormData(prev => ({
              ...prev,
              pickupCountryId: africanCountry.id,
              pickupCityId: undefined,
            }));
            setAutoSelectedPickupCountry(`${africanCountry.name} (Afrique)`);
          }
        } else {
          const russia = countries.find(c => 
            c.name.toLowerCase().includes('russia') || 
            c.name.toLowerCase().includes('russie')
          );
          
          if (russia && formData.pickupCountryId !== russia.id) {
            setFormData(prev => ({
              ...prev,
              pickupCountryId: russia.id,
              pickupCityId: undefined,
            }));
            setAutoSelectedPickupCountry('Russie');
          }
        }
      }
    } else {
      setAutoSelectedPickupCountry(null);
    }
  }, [formData.deliveryCountryId, countries]);

  // Auto-select delivery country based on pickup (Russia-Africa logic)
  useEffect(() => {
    if (formData.pickupCountryId && countries.length > 0) {
      const pickupCountry = countries.find(c => c.id === formData.pickupCountryId);
      if (pickupCountry) {
        const countryName = pickupCountry.name.toLowerCase();
        
        if (countryName.includes('russia') || countryName.includes('russie')) {
          const africanCountry = countries.find(c => 
            c.name.toLowerCase().includes('cameroun') || 
            c.name.toLowerCase().includes('cameroon')
          ) || countries.find(c => 
            !c.name.toLowerCase().includes('russia') && 
            !c.name.toLowerCase().includes('russie')
          );
          
          if (africanCountry && formData.deliveryCountryId !== africanCountry.id) {
            setFormData(prev => ({
              ...prev,
              deliveryCountryId: africanCountry.id,
              deliveryCityId: undefined,
            }));
            setAutoSelectedDeliveryCountry(`${africanCountry.name} (Afrique)`);
          }
        } else {
          const russia = countries.find(c => 
            c.name.toLowerCase().includes('russia') || 
            c.name.toLowerCase().includes('russie')
          );
          
          if (russia && formData.deliveryCountryId !== russia.id) {
            setFormData(prev => ({
              ...prev,
              deliveryCountryId: russia.id,
              deliveryCityId: undefined,
            }));
            setAutoSelectedDeliveryCountry('Russie');
          }
        }
      }
    } else {
      setAutoSelectedDeliveryCountry(null);
    }
  }, [formData.pickupCountryId, countries]);

  // Calculate estimated cost when weight or trip changes (use converted price if available)
  useEffect(() => {
    if (formData.weight && selectedTrip) {
      // Use converted price if available, otherwise use original price
      const pricePerKg = selectedTrip.price_per_kg_converted || selectedTrip.price_per_kg;
      setEstimatedCost(formData.weight * pricePerKg);
    } else {
      setEstimatedCost(null);
    }
  }, [formData.weight, selectedTrip]);

  const handleInputChange = (field: keyof ShipmentFormData, value: string | number | undefined) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Reset city when country changes
      if (field === 'pickupCountryId') {
        newData.pickupCityId = undefined;
      }
      if (field === 'deliveryCountryId') {
        newData.deliveryCityId = undefined;
      }
      
      return newData;
    });
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
    
    // Validate trip ID
    if (!formData.tripId || formData.tripId.trim() === '') {
      setErrors({ submit: 'Voyage non sélectionné. Veuillez sélectionner un voyage.' });
      return;
    }
    
    // Check wallet balance
    if (estimatedCost && walletBalance !== null && walletBalance < estimatedCost) {
      setErrors({ 
        submit: `Solde insuffisant. Requis: ${formatCurrency(estimatedCost)}, Disponible: ${formatCurrency(walletBalance)}` 
      });
      return;
    }
    
    // Ensure pickup and delivery location IDs are auto-filled from selectedTrip
    if (selectedTrip) {
      const pCountry = selectedTrip.departure_country_id || selectedTrip.departure?.country_id;
      const pCity = selectedTrip.departure_city_id || selectedTrip.departure?.city_id;
      const dCountry = selectedTrip.arrival_country_id || selectedTrip.arrival?.country_id;
      const dCity = selectedTrip.arrival_city_id || selectedTrip.arrival?.city_id;

      if (pCountry) formData.pickupCountryId = pCountry;
      if (pCity) formData.pickupCityId = pCity;
      if (dCountry) formData.deliveryCountryId = dCountry;
      if (dCity) formData.deliveryCityId = dCity;
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

      console.log('Submitting shipment data:', shipmentData);

      await apiClient.post<{ data: any }>(API_ENDPOINTS.shipments.create, shipmentData);

      router.push('/shipments/my');
    } catch (error: any) {
      console.error('Shipment creation error:', error);
      const errorMessage = ErrorHandler.handle(error);
      
      // If it's a validation error, show detailed errors
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const validationErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([key, messages]) => {
          validationErrors[key] = (messages as string[])[0];
        });
        setErrors(validationErrors);
        
        // Also set a general submit error
        const errorKeys = Object.keys(validationErrors);
        setErrors(prev => ({
          ...prev,
          submit: `Erreur de validation: ${errorKeys.join(', ')}`
        }));
      } else {
        setErrors({ submit: errorMessage.message });
      }
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
                  {t('common.back') || 'Retour'}
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 font-heading">
                      {t('dashboard.createShipment') || 'Créer une expédition'}
                    </h1>
                    <p className="text-sm text-slate-500">{t('shipments.chooseType') || 'Choisissez le type d\'expédition que vous souhaitez créer'}</p>
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
                      {t('shipments.withTripTitle') || 'Expédition avec voyage sélectionné'}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4">
                      {t('shipments.withTripDesc') || 'Choisissez un voyage existant et créez une expédition pour ce voyage spécifique. Le prix est calculé selon le tarif du voyageur.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {t('shipments.fixedPrice') || 'Prix fixe'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {t('shipments.confirmedTrip') || 'Voyage confirmé'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {t('shipments.instantPayment') || 'Paiement immédiat'}
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
                      {t('shipments.withBidsTitle') || 'Annonce d\'expédition avec soumissions'}
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {t('common.new') || 'Nouveau'}
                      </span>
                    </h3>
                    <p className="text-slate-600 text-sm mb-4">
                      {t('shipments.withBidsDesc') || 'Publiez une annonce d\'expédition et laissez les voyageurs soumissionner avec leurs prix. Choisissez la meilleure offre.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {t('shipments.negotiablePrice') || 'Prix négociable'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {t('shipments.multipleOffers') || 'Plusieurs offres'}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {t('shipments.youChoose') || 'Vous choisissez'}
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
                    <p className="font-medium mb-1">{t('shipments.whichOption') || 'Quelle option choisir ?'}</p>
                    <p>
                      <strong>{t('shipments.selectedTripLabel') || 'Voyage sélectionné'}</strong> : {t('shipments.selectedTripDesc') || 'Si vous avez trouvé un voyage qui vous convient et voulez réserver immédiatement.'}
                      <br />
                      <strong>{t('shipments.withBidsLabel') || 'Annonce avec soumissions'}</strong> : {t('shipments.withBidsDetail') || 'Si vous voulez comparer plusieurs offres et négocier le meilleur prix.'}
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
                  {t('common.back') || 'Retour'}
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 font-heading">
                      {t('dashboard.createShipment') || 'Créer une expédition'}
                    </h1>
                    <p className="text-sm text-slate-500">{t('shipments.fillInfo') || 'Remplissez les informations de votre colis'}</p>
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
                    <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">{t('shipments.selectedTrip') || 'Voyage sélectionné'}</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedTrip.departure_city} → {selectedTrip.arrival_city}
                    </p>
                    <p className="text-xs text-slate-600">
                      {t('trips.departureDate') || 'Départ'}: {new Date(selectedTrip.departure_date).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR')} •
                      {t('shipments.price') || 'Prix'}: {selectedTrip.price_converted
                        ? formatCurrency(selectedTrip.price_converted.amount, selectedTrip.price_converted.currency_code)
                        : formatCurrency(selectedTrip.price_per_kg, selectedTrip.currency_code || 'EUR')}/kg
                      {selectedTrip.price_converted && (
                        <span className="text-slate-400 ml-1">
                          ({formatCurrency(selectedTrip.price_per_kg, selectedTrip.currency_code || 'EUR')}/kg)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

              {/* Info message about Russia-Africa routes */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900">
                      {t('shipments.routesTitle') || 'Routes Russie ⇄ Afrique'}
                    </p>
                    <p className="text-blue-700 mt-1">
                      {t('shipments.routesDesc') || 'Notre plateforme connecte la Russie et l\'Afrique. Lorsque vous sélectionnez un pays, l\'autre sera automatiquement défini pour respecter cette logique.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Balance & Cost Estimate */}
              {walletBalance !== null && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">{t('common.available') || 'Solde disponible'}</p>
                        <p className="text-lg font-bold text-slate-900">{formatCurrency(walletBalance)}</p>
                        {walletData?.original_balance != null && (
                          <p className="text-[10px] text-slate-400">
                            {formatCurrency(walletData.original_balance, walletData.original_currency_code)}
                          </p>
                        )}
                      </div>
                    </div>
                    {estimatedCost !== null && (
                      <div className="text-right">
                        <p className="text-xs text-slate-600">{t('shipments.estimatedCost') || 'Coût estimé'}</p>
                        <p className={`text-lg font-bold ${walletBalance >= estimatedCost ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(estimatedCost)}
                        </p>
                        {selectedTrip?.price_converted && formData.weight && (
                          <p className="text-[10px] text-slate-400">
                            {formatCurrency(formData.weight * selectedTrip.price_per_kg, selectedTrip.currency_code || 'EUR')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {estimatedCost !== null && walletBalance < estimatedCost && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {t('shipments.insufficientBalance') || 'Solde insuffisant. Rechargez votre wallet avant de continuer.'}
                    </div>
                  )}
                </div>
              )}

              {/* Package Details */}
              <SectionCard
                icon={<Package className="w-4 h-4 text-orange-600" />}
                iconBg="bg-orange-50"
                title={t('shipments.packageDetailsTitle') || 'Détails du colis'}
                subtitle={t('shipments.packageDetailsSubtitle') || 'Description, poids et valeur du colis à expédier'}
              >
                <Input
                  type="text"
                  label={t('shipments.packageDescriptionLabel') || 'Description du colis'}
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={errors.description}
                  required
                  placeholder={t('shipments.descriptionPlaceholder') || 'ex : Vêtements, Électronique, Documents...'}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label={t('shipments.weightLabel') || 'Poids (kg)'}
                    value={formData.weight?.toString() || ''}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                    error={errors.weight}
                    required
                    placeholder="0.0"
                  />
                  <Input
                    type="number"
                    label={`${t('shipments.valueLabel') || 'Valeur déclarée'} (${currencyCode})`}
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
                    label={t('shipments.lengthLabel') || 'Longueur (cm)'}
                    value={formData.length?.toString() || ''}
                    onChange={(e) => handleInputChange('length', parseFloat(e.target.value))}
                    error={errors.length}
                    placeholder="0"
                  />
                  <Input
                    type="number"
                    label={t('shipments.widthLabel') || 'Largeur (cm)'}
                    value={formData.width?.toString() || ''}
                    onChange={(e) => handleInputChange('width', parseFloat(e.target.value))}
                    error={errors.width}
                    placeholder="0"
                  />
                  <Input
                    type="number"
                    label={t('shipments.heightLabel') || 'Hauteur (cm)'}
                    value={formData.height?.toString() || ''}
                    onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                    error={errors.height}
                    placeholder="0"
                  />
                </div>
                <Input
                  type="text"
                  label={t('shipments.packageTypeLabel') || 'Type de colis'}
                  value={formData.packageType || ''}
                  onChange={(e) => handleInputChange('packageType', e.target.value)}
                  error={errors.packageType}
                  required
                  placeholder={t('shipments.packageTypePlaceholder') || 'ex : Documents, Électronique, Vêtements...'}
                />

                {/* Photo Upload */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <label className="text-sm font-medium text-slate-700">
                      {t('shipments.photosLabel') || 'Photos du colis'}{' '}
                      <span className="text-slate-400 font-normal text-xs">({t('common.optional') || 'optionnel'})</span>
                    </label>
                  </div>
                  <FileUpload
                    accept="image/*"
                    value={photoFile}
                    onChange={(file) => setPhotoFile(file)}
                    maxSize={5}
                    helperText={t('shipments.photoHelper') || 'Ajoutez une photo pour rassurer les voyageurs'}
                  />
                </div>
              </SectionCard>

              {/* Recipient Info */}
              <SectionCard
                icon={<User className="w-4 h-4 text-blue-600" />}
                iconBg="bg-blue-50"
                title={t('shipments.recipientInfoTitle') || 'Informations du destinataire'}
                subtitle={t('shipments.recipientInfoSubtitle') || 'Nom et téléphone du destinataire'}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label={t('shipments.recipientNameLabel') || 'Nom du destinataire'}
                    value={formData.recipientName || ''}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    error={errors.recipientName}
                    required
                    placeholder={t('shipments.recipientNamePlaceholder') || 'Nom complet du destinataire'}
                  />
                  <Input
                    type="tel"
                    label={t('shipments.recipientPhoneLabel') || 'Téléphone du destinataire'}
                    value={formData.recipientPhone || ''}
                    onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                    error={errors.recipientPhone}
                    required
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </SectionCard>

              {/* Prohibited Items */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-200">
                  <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-amber-900">
                      {t('shipments.prohibitedItemsTitle') || 'Objets interdits'}
                    </h2>
                    <p className="text-xs text-amber-700">{t('shipments.prohibitedItemsSubtitle') || 'Vérifiez que votre colis ne contient aucun objet interdit'}</p>
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
                        {t('shipments.hideProhibitedList') || 'Masquer la liste'}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        {t('shipments.showProhibitedList') || 'Voir la liste des objets interdits'}
                      </>
                    )}
                  </button>

                  {showProhibitedItems && (
                    <div className="mb-4 bg-white border border-amber-200 rounded-xl p-4 slide-down">
                      <p className="text-xs font-semibold text-slate-800 mb-2">
                        {t('shipments.strictlyProhibited') || 'Objets strictement interdits :'}
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          {t('shipments.prohibitedWeapons') || 'Armes et munitions'}
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          {t('shipments.prohibitedDrugs') || 'Drogues et stupéfiants'}
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          {t('shipments.prohibitedLiquids') || 'Liquides inflammables'}
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          {t('shipments.prohibitedChemicals') || 'Produits chimiques'}
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          {t('shipments.prohibitedAnimals') || 'Animaux vivants'}
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 shrink-0 mt-0.5">✕</span>
                          {t('shipments.prohibitedValuables') || 'Objets de valeur extrême'}
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
                      {t('shipments.certifyTerms') || 'Je certifie que mon colis ne contient aucun objet interdit et respecte les réglementations douanières.'}
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
                  {t('common.cancel') || 'Annuler'}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  className="flex-1"
                >
                  {t('dashboard.createShipment') || 'Créer l\'expédition'}
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
