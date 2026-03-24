'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { useKYCCheck } from '@/lib/hooks/useKYCCheck';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FileUpload } from '@/components/ui/FileUpload';
import { Card } from '@/components/ui/Card';
import { KYCBlocker } from '@/components/features/KYCBlocker';
// Removed static location imports - now fetching from backend
import { z } from 'zod';
import {
  MapPin,
  Calendar,
  Package,
  CheckCircle2,
  Plane,
  Check,
  Mail,
  Box,
  PackageOpen,
  Archive,
  Scale,
  TrendingUp,
  FileText,
  Home,
  Navigation,
  Info,
  Wallet,
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
} from 'lucide-react';

// Zod schema for trip validation
const tripSchema = z.object({
  departureCity: z.string().min(1, 'Departure city is required'),
  departureCountry: z.string().min(1, 'Departure country is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  arrivalCity: z.string().min(1, 'Arrival city is required'),
  arrivalCountry: z.string().min(1, 'Arrival country is required'),
  arrivalDate: z.string().min(1, 'Arrival date is required'),
  availableCapacity: z.number().positive('Capacity must be positive'),
  pricePerKg: z.number().positive('Price must be positive'),
  acceptedPackageTypes: z.array(z.string()).min(1, 'Select at least one package type'),
  pickupAddress: z.string().min(5, 'Pickup address is required'),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
}).refine(
  (data) => new Date(data.departureDate) < new Date(data.arrivalDate),
  {
    message: 'Departure date must be before arrival date',
    path: ['arrivalDate'],
  }
);

type TripFormData = z.infer<typeof tripSchema>;

const STEPS = [
  { id: 1, label: 'Itinéraire', icon: MapPin },
  { id: 2, label: 'Dates', icon: Calendar },
  { id: 3, label: 'Détails', icon: Package },
  { id: 4, label: 'Confirmation', icon: CheckCircle2 },
];

const PLATFORM_COMMISSION = 0.15;
const TRAVELER_COMMISSION = 0.85;

export default function NewTripPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { isKYCApproved } = useKYCCheck();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Partial<TripFormData>>({
    departureCity: '',
    departureCountry: '',
    departureDate: '',
    arrivalCity: '',
    arrivalCountry: '',
    arrivalDate: '',
    availableCapacity: undefined,
    pricePerKg: undefined,
    acceptedPackageTypes: [],
    pickupAddress: '',
    deliveryAddress: '',
  });

  const [travelProof, setTravelProof] = useState<File | null>(null);
  const [allCountries, setAllCountries] = useState<Array<{id: number; name: string; continent: string}>>([]);
  const [departureCountries, setDepartureCountries] = useState<string[]>([]);
  const [arrivalCountries, setArrivalCountries] = useState<string[]>([]);
  const [departureCities, setDepartureCities] = useState<string[]>([]);
  const [arrivalCities, setArrivalCities] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isLoadingDepartureCities, setIsLoadingDepartureCities] = useState(false);
  const [isLoadingArrivalCities, setIsLoadingArrivalCities] = useState(false);

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/locations/countries');
        if (!response.ok) throw new Error('Failed to fetch countries');
        const data = await response.json();
        setAllCountries(data.data || []);
        // Initially show all countries for departure
        setDepartureCountries((data.data || []).map((c: any) => c.name));
      } catch (error) {
        console.error('Error fetching countries:', error);
        setErrors({ submit: 'Impossible de charger les pays' });
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Update arrival countries based on departure country selection
  useEffect(() => {
    if (formData.departureCountry && allCountries.length > 0) {
      const selectedCountry = allCountries.find(c => c.name === formData.departureCountry);
      
      if (selectedCountry) {
        if (selectedCountry.continent === 'europe') {
          // Si départ = Russie, arrivée = pays africains uniquement
          const africanCountries = allCountries
            .filter(c => c.continent === 'africa')
            .map(c => c.name);
          setArrivalCountries(africanCountries);
          
          // Reset arrival country if it's not African
          if (formData.arrivalCountry) {
            const arrivalCountry = allCountries.find(c => c.name === formData.arrivalCountry);
            if (arrivalCountry?.continent !== 'africa') {
              handleInputChange('arrivalCountry', '');
              handleInputChange('arrivalCity', '');
            }
          }
        } else if (selectedCountry.continent === 'africa') {
          // Si départ = pays africain, arrivée = Russie automatiquement
          const russia = allCountries.find(c => c.continent === 'europe');
          if (russia) {
            setArrivalCountries([russia.name]);
            handleInputChange('arrivalCountry', russia.name);
          }
        } else {
          // Autres pays : tous les pays sauf le pays de départ
          const otherCountries = allCountries
            .filter(c => c.name !== formData.departureCountry)
            .map(c => c.name);
          setArrivalCountries(otherCountries);
        }
      }
    } else {
      setArrivalCountries([]);
    }
  }, [formData.departureCountry, allCountries]);

  useEffect(() => {
    if (formData.departureCountry) {
      console.log('Fetching cities for departure country:', formData.departureCountry);
      setIsLoadingDepartureCities(true);
      fetch(`/api/locations/cities/${encodeURIComponent(formData.departureCountry)}`)
        .then(res => {
          console.log('Departure cities response status:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('Departure cities data:', data);
          setDepartureCities(data.data || []);
        })
        .catch(error => {
          console.error('Error fetching departure cities:', error);
          setDepartureCities([]);
        })
        .finally(() => {
          setIsLoadingDepartureCities(false);
        });
    } else {
      setDepartureCities([]);
    }
  }, [formData.departureCountry]);

  useEffect(() => {
    if (formData.arrivalCountry) {
      console.log('Fetching cities for arrival country:', formData.arrivalCountry);
      setIsLoadingArrivalCities(true);
      fetch(`/api/locations/cities/${encodeURIComponent(formData.arrivalCountry)}`)
        .then(res => {
          console.log('Arrival cities response status:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('Arrival cities data:', data);
          setArrivalCities(data.data || []);
        })
        .catch(error => {
          console.error('Error fetching arrival cities:', error);
          setArrivalCities([]);
        })
        .finally(() => {
          setIsLoadingArrivalCities(false);
        });
    } else {
      setArrivalCities([]);
    }
  }, [formData.arrivalCountry]);

  const saveDraft = () => {
    localStorage.setItem('tripDraft', JSON.stringify(formData));
  };

  useState(() => {
    const draft = localStorage.getItem('tripDraft');
    if (draft) {
      try {
        setFormData(JSON.parse(draft));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  });

  const handleInputChange = (field: keyof TripFormData, value: string | number | string[]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'departureCountry') newData.departureCity = '';
      if (field === 'arrivalCountry') newData.arrivalCity = '';
      return newData;
    });
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.departureCity) newErrors.departureCity = t('errors.required');
      if (!formData.departureCountry) newErrors.departureCountry = t('errors.required');
      if (!formData.arrivalCity) newErrors.arrivalCity = t('errors.required');
      if (!formData.arrivalCountry) newErrors.arrivalCountry = t('errors.required');
    } else if (step === 2) {
      if (!formData.departureDate) newErrors.departureDate = t('errors.required');
      if (!formData.arrivalDate) newErrors.arrivalDate = t('errors.required');
      if (formData.departureDate && formData.arrivalDate) {
        if (new Date(formData.departureDate) >= new Date(formData.arrivalDate)) {
          newErrors.arrivalDate = t('errors.dateMustBeAfter');
        }
      }
    } else if (step === 3) {
      if (!formData.acceptedPackageTypes || formData.acceptedPackageTypes.length === 0) {
        newErrors.acceptedPackageTypes = t('errors.selectAtLeastOne');
      }
      if (!formData.pickupAddress || formData.pickupAddress.length < 5) {
        newErrors.pickupAddress = t('errors.addressTooShort');
      }
      if (!formData.deliveryAddress || formData.deliveryAddress.length < 5) {
        newErrors.deliveryAddress = t('errors.addressTooShort');
      }
      if (!formData.availableCapacity || formData.availableCapacity <= 0) {
        newErrors.availableCapacity = t('errors.mustBePositive');
      }
      if (!formData.pricePerKg || formData.pricePerKg <= 0) {
        newErrors.pricePerKg = t('errors.mustBePositive');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      saveDraft();
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    if (formData.departureDate && new Date(formData.departureDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
      setErrors({ departureDate: t('errors.dateMustBeInFuture') });
      setCurrentStep(2);
      return;
    }

    if (!formData.availableCapacity || formData.availableCapacity <= 0) {
      setErrors({ availableCapacity: t('errors.mustBePositive') });
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];

      const formDataToSend = new FormData();
      formDataToSend.append('departure_city', formData.departureCity!);
      formDataToSend.append('departure_country', formData.departureCountry!);
      formDataToSend.append('departure_date', formData.departureDate!);
      formDataToSend.append('arrival_city', formData.arrivalCity!);
      formDataToSend.append('arrival_country', formData.arrivalCountry!);
      formDataToSend.append('arrival_date', formData.arrivalDate!);
      formDataToSend.append('available_capacity', formData.availableCapacity!.toString());
      formDataToSend.append('price_per_kg', formData.pricePerKg!.toString());
      formData.acceptedPackageTypes!.forEach((type, index) => {
        formDataToSend.append(`accepted_package_types[${index}]`, type);
      });
      formDataToSend.append('pickup_address', formData.pickupAddress!);
      formDataToSend.append('delivery_address', formData.deliveryAddress!);
      if (travelProof) formDataToSend.append('travel_proof', travelProof);

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 422 && error.errors) {
          const validationErrors: Record<string, string> = {};
          Object.entries(error.errors).forEach(([key, messages]) => {
            validationErrors[key] = (messages as string[])[0];
          });
          setErrors(validationErrors);
          return;
        }
        throw new Error(error.message || t('trips.publishError'));
      }

      const result = await response.json();
      localStorage.removeItem('tripDraft');
      if (result.data?.id) {
        router.push(`/trips/${result.data.id}`);
      } else {
        router.push('/trips/my');
      }
    } catch (error) {
      console.error('Failed to publish trip:', error);
      setErrors({ submit: error instanceof Error ? error.message : t('trips.publishError') });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Step Indicator ───────────────────────────────────────────────────────
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        const StepIcon = step.icon;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 text-white shadow-sm'
                    : isActive
                    ? 'bg-orange-500 text-white shadow-md ring-4 ring-orange-100'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
              </div>
              <span
                className={`text-xs font-semibold tracking-wide ${
                  isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-2 mb-5 transition-colors duration-300 ${
                  step.id < currentStep ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Step 1: Route ────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
          Votre itinéraire
        </h2>
        <p className="text-gray-500 text-sm mt-1">Indiquez vos villes de départ et d'arrivée</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_56px_1fr] gap-4 items-start">
        {/* Departure */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-orange-700 text-xs uppercase tracking-widest">Départ</span>
          </div>
          <Select
            label={t('trips.departureCountry')}
            value={formData.departureCountry || ''}
            onChange={(value) => handleInputChange('departureCountry', value)}
            options={departureCountries.map(c => ({ value: c, label: c }))}
            placeholder={isLoadingCountries ? 'Chargement...' : t('common.select')}
            error={errors.departureCountry}
            disabled={isLoadingCountries}
            required
          />
          <Select
            label={t('trips.departureCity')}
            value={formData.departureCity || ''}
            onChange={(value) => handleInputChange('departureCity', value)}
            options={departureCities.map(c => ({ value: c, label: c }))}
            placeholder={
              isLoadingDepartureCities 
                ? 'Chargement...' 
                : formData.departureCountry 
                  ? t('common.select') 
                  : t('trips.selectCountryFirst')
            }
            error={errors.departureCity}
            disabled={!formData.departureCountry || isLoadingDepartureCities}
            required
          />
        </div>

        {/* Connector */}
        <div className="hidden md:flex items-center justify-center pt-14">
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-5 bg-gray-200" />
            <Plane className="w-6 h-6 text-blue-400" />
            <div className="w-px h-5 bg-gray-200" />
          </div>
        </div>

        {/* Arrival */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-blue-700 text-xs uppercase tracking-widest">Arrivée</span>
          </div>
          <Select
            label={t('trips.arrivalCountry')}
            value={formData.arrivalCountry || ''}
            onChange={(value) => handleInputChange('arrivalCountry', value)}
            options={arrivalCountries.map(c => ({ value: c, label: c }))}
            placeholder={isLoadingCountries ? 'Chargement...' : formData.departureCountry ? t('common.select') : 'Sélectionnez d\'abord le pays de départ'}
            error={errors.arrivalCountry}
            disabled={isLoadingCountries || !formData.departureCountry || arrivalCountries.length === 0}
            required
          />
          <Select
            label={t('trips.arrivalCity')}
            value={formData.arrivalCity || ''}
            onChange={(value) => handleInputChange('arrivalCity', value)}
            options={arrivalCities.map(c => ({ value: c, label: c }))}
            placeholder={
              isLoadingArrivalCities 
                ? 'Chargement...' 
                : formData.arrivalCountry 
                  ? t('common.select') 
                  : t('trips.selectCountryFirst')
            }
            error={errors.arrivalCity}
            disabled={!formData.arrivalCountry || isLoadingArrivalCities}
            required
          />
        </div>
      </div>

      {/* Mobile connector */}
      <div className="md:hidden flex items-center justify-center gap-2 text-gray-300 py-1">
        <div className="h-px flex-1 bg-gray-200" />
        <Plane className="w-5 h-5 text-blue-400 rotate-90" />
        <div className="h-px flex-1 bg-gray-200" />
      </div>
    </div>
  );

  // ─── Step 2: Dates ────────────────────────────────────────────────────────
  const renderStep2 = () => {
    const getDuration = () => {
      if (!formData.departureDate || !formData.arrivalDate) return null;
      const dep = new Date(formData.departureDate);
      const arr = new Date(formData.arrivalDate);
      const days = Math.ceil((arr.getTime() - dep.getTime()) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : null;
    };
    const duration = getDuration();

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Dates du voyage
          </h2>
          <p className="text-gray-500 text-sm mt-1">Précisez vos dates de départ et d'arrivée</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-orange-700 uppercase tracking-widest">Date de départ</span>
            </div>
            <Input
              type="date"
              label={t('trips.departureDate')}
              value={formData.departureDate || ''}
              onChange={(e) => handleInputChange('departureDate', e.target.value)}
              error={errors.departureDate}
              required
            />
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Date d'arrivée</span>
            </div>
            <Input
              type="date"
              label={t('trips.arrivalDate')}
              value={formData.arrivalDate || ''}
              onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
              error={errors.arrivalDate}
              required
            />
          </div>
        </div>

        {duration && (
          <div className="flex items-center justify-center gap-2.5 py-3 px-5 bg-gray-50 border border-gray-100 rounded-xl">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Durée du voyage :{' '}
              <strong className="text-gray-900">
                {duration} jour{duration > 1 ? 's' : ''}
              </strong>
            </span>
          </div>
        )}

        {/* Travel Proof */}
        <div className="border-t border-gray-100 pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm">{t('trips.travelProof')}</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                  Optionnel mais recommandé
                </span>
              </div>
              <p className="text-gray-400 text-xs mt-0.5">
                Billet d'avion, réservation de train, etc.
              </p>
            </div>
          </div>
          <FileUpload
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            maxSize={5}
            value={travelProof}
            onChange={setTravelProof}
            helperText={t('trips.travelProofHelper')}
          />
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">{t('trips.whyTravelProof')}</p>
              <p className="text-blue-700 mt-0.5 text-xs leading-relaxed">{t('trips.travelProofBenefit')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Step 3: Package Details ──────────────────────────────────────────────
  const renderStep3 = () => {
    const packageTypes = [
      { value: 'enveloppes', label: t('trips.packageTypes.enveloppes'), icon: Mail, desc: 'Documents, lettres' },
      { value: 'petits_colis', label: t('trips.packageTypes.petitsColis'), icon: Box, desc: '< 5 kg' },
      { value: 'moyens_colis', label: t('trips.packageTypes.moyensColis'), icon: PackageOpen, desc: '5–20 kg' },
      { value: 'grands_colis', label: t('trips.packageTypes.grandsColis'), icon: Archive, desc: '> 20 kg' },
    ];

    const togglePackageType = (type: string) => {
      const current = formData.acceptedPackageTypes || [];
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      handleInputChange('acceptedPackageTypes', updated);
    };

    const revenue =
      formData.pricePerKg && formData.availableCapacity
        ? {
            total: (formData.pricePerKg * formData.availableCapacity).toFixed(2),
            platform: (formData.pricePerKg * formData.availableCapacity * PLATFORM_COMMISSION).toFixed(2),
            traveler: (formData.pricePerKg * formData.availableCapacity * TRAVELER_COMMISSION).toFixed(2),
            platformPercent: (PLATFORM_COMMISSION * 100).toFixed(0),
            travelerPercent: (TRAVELER_COMMISSION * 100).toFixed(0),
          }
        : null;

    return (
      <div className="space-y-7">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Détails des colis
          </h2>
          <p className="text-gray-500 text-sm mt-1">Indiquez ce que vous acceptez de transporter</p>
        </div>

        {/* Package Types */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            {t('trips.acceptedPackageTypes')}{' '}
            <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {packageTypes.map((type) => {
              const TypeIcon = type.icon;
              const selected = (formData.acceptedPackageTypes || []).includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => togglePackageType(type.value)}
                  className={`group p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                    selected
                      ? 'border-orange-400 bg-orange-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                      }`}
                    >
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{type.label}</div>
                      <div className={`text-xs mt-0.5 ${selected ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                        {selected ? '✓ Sélectionné' : type.desc}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.acceptedPackageTypes && (
            <div className="mt-2 flex items-center gap-1.5 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.acceptedPackageTypes}
            </div>
          )}
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Home className="w-4 h-4 text-green-500" />
              {t('trips.pickupAddress')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.pickupAddress || ''}
              onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm transition-colors resize-none focus:outline-hidden focus:ring-2 ${
                errors.pickupAddress
                  ? 'border-red-400 bg-red-50 focus:ring-red-200'
                  : 'border-gray-200 hover:border-gray-300 focus:border-orange-400 focus:ring-orange-100'
              }`}
              placeholder={t('trips.pickupAddressPlaceholder')}
            />
            {errors.pickupAddress && (
              <p className="mt-1 text-xs text-red-600">{errors.pickupAddress}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">{t('trips.pickupAddressHelper')}</p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
              <Navigation className="w-4 h-4 text-blue-500" />
              {t('trips.deliveryAddress')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.deliveryAddress || ''}
              onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2.5 border rounded-xl text-sm transition-colors resize-none focus:outline-hidden focus:ring-2 ${
                errors.deliveryAddress
                  ? 'border-red-400 bg-red-50 focus:ring-red-200'
                  : 'border-gray-200 hover:border-gray-300 focus:border-blue-400 focus:ring-blue-100'
              }`}
              placeholder={t('trips.deliveryAddressPlaceholder')}
            />
            {errors.deliveryAddress && (
              <p className="mt-1 text-xs text-red-600">{errors.deliveryAddress}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">{t('trips.deliveryAddressHelper')}</p>
          </div>
        </div>

        {/* Capacity & Price */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800 text-sm mb-4">
            <Scale className="w-4 h-4 text-gray-500" />
            {t('trips.capacity')} &amp; {t('trips.price')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="number"
              label={t('trips.availableCapacity')}
              value={formData.availableCapacity?.toString() || ''}
              onChange={(e) => handleInputChange('availableCapacity', parseFloat(e.target.value))}
              error={errors.availableCapacity}
              required
            />
            <Input
              type="number"
              label={t('trips.pricePerKg')}
              value={formData.pricePerKg?.toString() || ''}
              onChange={(e) => handleInputChange('pricePerKg', parseFloat(e.target.value))}
              error={errors.pricePerKg}
              required
            />
          </div>
        </div>

        {/* Revenue Preview */}
        {revenue && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900 text-sm">{t('trips.revenueBreakdown')}</h3>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${revenue.travelerPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1.5">
                <span className="text-green-600 font-medium">
                  {t('trips.yourEarnings')} ({revenue.travelerPercent}%)
                </span>
                <span className="text-gray-500">
                  {t('trips.platformFee')} ({revenue.platformPercent}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/80 rounded-xl p-3 border border-green-100">
                <Wallet className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <div className="text-xs text-gray-500 mb-0.5">{t('trips.yourEarnings')}</div>
                <div className="font-bold text-green-700">${revenue.traveler}</div>
              </div>
              <div className="bg-white/80 rounded-xl p-3 border border-gray-100">
                <Building2 className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <div className="text-xs text-gray-500 mb-0.5">{t('trips.platformFee')}</div>
                <div className="font-bold text-gray-500">${revenue.platform}</div>
              </div>
              <div className="bg-white/80 rounded-xl p-3 border border-blue-100">
                <TrendingUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-xs text-gray-500 mb-0.5">{t('trips.totalRevenue')}</div>
                <div className="font-bold text-blue-700">${revenue.total}</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3 italic">{t('trips.revenueNote')}</p>
          </div>
        )}
      </div>
    );
  };

  // ─── Step 4: Confirmation ─────────────────────────────────────────────────
  const renderStep4 = () => {
    const revenue =
      formData.pricePerKg && formData.availableCapacity
        ? {
            total: (formData.pricePerKg * formData.availableCapacity).toFixed(2),
            platform: (formData.pricePerKg * formData.availableCapacity * PLATFORM_COMMISSION).toFixed(2),
            traveler: (formData.pricePerKg * formData.availableCapacity * TRAVELER_COMMISSION).toFixed(2),
            platformPercent: (PLATFORM_COMMISSION * 100).toFixed(0),
            travelerPercent: (TRAVELER_COMMISSION * 100).toFixed(0),
          }
        : null;

    const packageTypeLabels: Record<string, string> = {
      enveloppes: t('trips.packageTypes.enveloppes'),
      petits_colis: t('trips.packageTypes.petitsColis'),
      moyens_colis: t('trips.packageTypes.moyensColis'),
      grands_colis: t('trips.packageTypes.grandsColis'),
    };

    return (
      <div className="space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Récapitulatif
          </h2>
          <p className="text-gray-500 text-sm mt-1">Vérifiez les informations avant de publier</p>
        </div>

        {/* Journey Hero Card */}
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {/* Gradient route header */}
          <div className="bg-gradient-to-r from-orange-500 to-blue-600 px-6 py-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest opacity-75 mb-1 font-medium">Départ</div>
                <div className="font-bold text-xl leading-tight">{formData.departureCity}</div>
                <div className="text-sm opacity-80">{formData.departureCountry}</div>
                <div className="text-xs opacity-65 mt-1 font-medium">{formData.departureDate}</div>
              </div>
              <div className="flex flex-col items-center opacity-80">
                <div className="w-12 h-px bg-white/50 mb-1" />
                <Plane className="w-8 h-8" />
                <div className="w-12 h-px bg-white/50 mt-1" />
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest opacity-75 mb-1 font-medium">Arrivée</div>
                <div className="font-bold text-xl leading-tight">{formData.arrivalCity}</div>
                <div className="text-sm opacity-80">{formData.arrivalCountry}</div>
                <div className="text-xs opacity-65 mt-1 font-medium">{formData.arrivalDate}</div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="divide-y divide-gray-50 bg-white">
            {/* Package types */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-2.5">
                <Package className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700">{t('trips.acceptedPackageTypes')}</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {(formData.acceptedPackageTypes || []).map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100"
                  >
                    {packageTypeLabels[type] || type}
                  </span>
                ))}
              </div>
            </div>

            {/* Addresses */}
            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Home className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-gray-700">{t('trips.pickupAddress')}</span>
                </div>
                <p className="text-sm text-gray-600 pl-6 leading-relaxed">{formData.pickupAddress}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Navigation className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">{t('trips.deliveryAddress')}</span>
                </div>
                <p className="text-sm text-gray-600 pl-6 leading-relaxed">{formData.deliveryAddress}</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5">Capacité</div>
                  <div className="font-bold text-gray-900">{formData.availableCapacity} kg</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-0.5">Prix / kg</div>
                  <div className="font-bold text-gray-900">${formData.pricePerKg}</div>
                </div>
                {revenue && (
                  <>
                    <div className="bg-green-50 rounded-xl p-3">
                      <div className="text-xs text-green-600 mb-0.5">{t('trips.yourEarnings')}</div>
                      <div className="font-bold text-green-700">${revenue.traveler}</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <div className="text-xs text-blue-600 mb-0.5">Total estimé</div>
                      <div className="font-bold text-blue-700">${revenue.total}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Travel proof if uploaded */}
            {travelProof && (
              <div className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-gray-700">{t('trips.travelProof')}</span>
                  <span className="ml-auto text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 font-medium">
                    ✓ {travelProof.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {errors.submit && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {errors.submit}
          </div>
        )}
      </div>
    );
  };

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <KYCBlocker action="publier un voyage">
      <div className="min-h-screen bg-slate-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Plane className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold text-gray-900"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {t('trips.publish')}
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Partagez votre trajet et gagnez de l'argent en transportant des colis
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {renderStepIndicator()}

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
            </div>

            {/* Navigation Footer */}
            <div className="border-t border-gray-100 px-6 md:px-8 py-4 bg-gray-50 flex items-center justify-between">
              <div>
                {currentStep > 1 ? (
                  <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {t('common.back')}
                  </Button>
                ) : (
                  <div />
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={isSubmitting}
                  className="text-sm text-gray-400 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  Sauvegarder le brouillon
                </button>
                {currentStep < 4 ? (
                  <Button variant="primary" onClick={handleNext} disabled={isSubmitting}>
                    {t('common.next')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                  >
                    {!isSubmitting && <Check className="w-4 h-4 mr-1.5" />}
                    {t('common.submit')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Étape {currentStep} sur {STEPS.length}
          </p>
        </div>
      </div>
    </KYCBlocker>
  );
}
