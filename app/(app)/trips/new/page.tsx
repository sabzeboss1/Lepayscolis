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
import { getCountries, getCitiesByCountry } from '@/lib/data/locations';
import { z } from 'zod';

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

export default function NewTripPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { isKYCApproved } = useKYCCheck();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form data state
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

  // File upload state
  const [travelProof, setTravelProof] = useState<File | null>(null);

  // Location data
  const [countries] = useState(() => getCountries());
  const [departureCities, setDepartureCities] = useState<string[]>([]);
  const [arrivalCities, setArrivalCities] = useState<string[]>([]);

  // Update cities when country changes
  useEffect(() => {
    if (formData.departureCountry) {
      setDepartureCities(getCitiesByCountry(formData.departureCountry));
    } else {
      setDepartureCities([]);
    }
  }, [formData.departureCountry]);

  useEffect(() => {
    if (formData.arrivalCountry) {
      setArrivalCities(getCitiesByCountry(formData.arrivalCountry));
    } else {
      setArrivalCities([]);
    }
  }, [formData.arrivalCountry]);

  // Draft functionality - save to localStorage
  const saveDraft = () => {
    localStorage.setItem('tripDraft', JSON.stringify(formData));
  };

  // Load draft on mount
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
      
      // Reset city when country changes
      if (field === 'departureCountry') {
        newData.departureCity = '';
      }
      if (field === 'arrivalCountry') {
        newData.arrivalCity = '';
      }
      
      return newData;
    });
    
    // Clear error for this field
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
      
      // Travel proof is optional but recommended
      if (!travelProof) {
        // Just a warning, not blocking
        console.warn('No travel proof uploaded');
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
    // Check KYC before allowing submission
    if (needsKYC) {
      setShowKYCPrompt(true);
      return;
    }

    if (!validateStep(3)) return;

    // Client-side validation: departure date must be in the future
    if (formData.departureDate && new Date(formData.departureDate) <= new Date()) {
      setErrors({ departureDate: t('errors.dateMustBeInFuture') });
      setCurrentStep(2);
      return;
    }

    // Client-side validation: available weight must be positive
    if (!formData.availableCapacity || formData.availableCapacity <= 0) {
      setErrors({ availableCapacity: t('errors.mustBePositive') });
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      // Créer FormData pour supporter l'upload de fichier
      const formDataToSend = new FormData();
      
      // Ajouter les champs en snake_case (format attendu par le backend)
      formDataToSend.append('departure_city', formData.departureCity!);
      formDataToSend.append('departure_country', formData.departureCountry!);
      formDataToSend.append('departure_date', formData.departureDate!);
      formDataToSend.append('arrival_city', formData.arrivalCity!);
      formDataToSend.append('arrival_country', formData.arrivalCountry!);
      formDataToSend.append('arrival_date', formData.arrivalDate!);
      formDataToSend.append('available_weight', formData.availableCapacity!.toString());
      formDataToSend.append('price_per_kg', formData.pricePerKg!.toString());
      
      // Ajouter les types de colis (array)
      formData.acceptedPackageTypes!.forEach((type, index) => {
        formDataToSend.append(`package_types[${index}]`, type);
      });
      
      formDataToSend.append('pickup_address', formData.pickupAddress!);
      formDataToSend.append('delivery_address', formData.deliveryAddress!);
      
      // Ajouter le fichier travel_proof si présent
      if (travelProof) {
        formDataToSend.append('travel_proof', travelProof);
      }

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          // Ne pas définir Content-Type, le navigateur le fera automatiquement avec boundary
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle validation errors
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
      
      // Clear draft
      localStorage.removeItem('tripDraft');
      
      // Redirect to trip details page after success
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

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step === currentStep
                ? 'bg-orange-500 text-white'
                : step < currentStep
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step < currentStep ? '✓' : step}
          </div>
          {step < 4 && (
            <div
              className={`w-16 h-1 ${
                step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">{t('trips.departure')} & {t('trips.arrival')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={t('trips.departureCountry')}
          value={formData.departureCountry || ''}
          onChange={(value) => handleInputChange('departureCountry', value)}
          options={countries.map(country => ({ value: country, label: country }))}
          placeholder={t('common.select')}
          error={errors.departureCountry}
          required
        />
        <Select
          label={t('trips.departureCity')}
          value={formData.departureCity || ''}
          onChange={(value) => handleInputChange('departureCity', value)}
          options={departureCities.map(city => ({ value: city, label: city }))}
          placeholder={formData.departureCountry ? t('common.select') : t('trips.selectCountryFirst')}
          error={errors.departureCity}
          disabled={!formData.departureCountry}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={t('trips.arrivalCountry')}
          value={formData.arrivalCountry || ''}
          onChange={(value) => handleInputChange('arrivalCountry', value)}
          options={countries.map(country => ({ value: country, label: country }))}
          placeholder={t('common.select')}
          error={errors.arrivalCountry}
          required
        />
        <Select
          label={t('trips.arrivalCity')}
          value={formData.arrivalCity || ''}
          onChange={(value) => handleInputChange('arrivalCity', value)}
          options={arrivalCities.map(city => ({ value: city, label: city }))}
          placeholder={formData.arrivalCountry ? t('common.select') : t('trips.selectCountryFirst')}
          error={errors.arrivalCity}
          disabled={!formData.arrivalCountry}
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">{t('trips.departureDate')} & {t('trips.arrivalDate')}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label={t('trips.departureDate')}
          value={formData.departureDate || ''}
          onChange={(e) => handleInputChange('departureDate', e.target.value)}
          error={errors.departureDate}
          required
        />
        <Input
          type="date"
          label={t('trips.arrivalDate')}
          value={formData.arrivalDate || ''}
          onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
          error={errors.arrivalDate}
          required
        />
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <FileUpload
          label={t('trips.travelProof')}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          maxSize={5}
          value={travelProof}
          onChange={setTravelProof}
          helperText={t('trips.travelProofHelper')}
        />
        
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium">{t('trips.whyTravelProof')}</p>
              <p className="mt-1 text-blue-700">{t('trips.travelProofBenefit')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    // Types de colis disponibles
    const packageTypes = [
      { value: 'enveloppes', label: t('trips.packageTypes.enveloppes'), icon: '📧' },
      { value: 'petits_colis', label: t('trips.packageTypes.petitsColis'), icon: '📦' },
      { value: 'moyens_colis', label: t('trips.packageTypes.moyensColis'), icon: '📫' },
      { value: 'grands_colis', label: t('trips.packageTypes.grandsColis'), icon: '🎁' },
    ];

    const togglePackageType = (type: string) => {
      const current = formData.acceptedPackageTypes || [];
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      handleInputChange('acceptedPackageTypes', updated);
    };

    // Temporary commission rates (will be defined by backend later)
    const PLATFORM_COMMISSION = 0.15; // 15% for platform
    const TRAVELER_COMMISSION = 0.85; // 85% for traveler
    
    // Calculate revenue breakdown
    const calculateRevenue = () => {
      if (!formData.pricePerKg || !formData.availableCapacity) {
        return null;
      }
      
      const totalRevenue = formData.pricePerKg * formData.availableCapacity;
      const platformRevenue = totalRevenue * PLATFORM_COMMISSION;
      const travelerRevenue = totalRevenue * TRAVELER_COMMISSION;
      
      return {
        total: totalRevenue.toFixed(2),
        platform: platformRevenue.toFixed(2),
        traveler: travelerRevenue.toFixed(2),
        platformPercent: (PLATFORM_COMMISSION * 100).toFixed(0),
        travelerPercent: (TRAVELER_COMMISSION * 100).toFixed(0),
      };
    };
    
    const revenue = calculateRevenue();
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">{t('trips.packageDetails')}</h2>
        
        {/* Types de colis acceptés */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('trips.acceptedPackageTypes')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {packageTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => togglePackageType(type.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  (formData.acceptedPackageTypes || []).includes(type.value)
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </div>
              </button>
            ))}
          </div>
          {errors.acceptedPackageTypes && (
            <p className="mt-1 text-sm text-red-600">{errors.acceptedPackageTypes}</p>
          )}
        </div>

        {/* Adresse de ramassage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('trips.pickupAddress')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.pickupAddress || ''}
            onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.pickupAddress ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('trips.pickupAddressPlaceholder')}
          />
          {errors.pickupAddress && (
            <p className="mt-1 text-sm text-red-600">{errors.pickupAddress}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">{t('trips.pickupAddressHelper')}</p>
        </div>

        {/* Adresse de livraison */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('trips.deliveryAddress')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.deliveryAddress || ''}
            onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.deliveryAddress ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('trips.deliveryAddressPlaceholder')}
          />
          {errors.deliveryAddress && (
            <p className="mt-1 text-sm text-red-600">{errors.deliveryAddress}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">{t('trips.deliveryAddressHelper')}</p>
        </div>

        {/* Capacité et prix */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('trips.capacity')} & {t('trips.price')}</h3>
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

        {revenue && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">{t('trips.revenueBreakdown')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{t('trips.totalRevenue')}:</span>
                <span className="font-bold text-lg text-gray-900">${revenue.total}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between items-center text-green-700">
                  <span>💰 {t('trips.yourEarnings')} ({revenue.travelerPercent}%):</span>
                  <span className="font-semibold text-green-800">${revenue.traveler}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 mt-1">
                  <span>🏢 {t('trips.platformFee')} ({revenue.platformPercent}%):</span>
                  <span className="font-medium">${revenue.platform}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">
              {t('trips.revenueNote')}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => {
    // Calculate revenue for display
    const PLATFORM_COMMISSION = 0.15;
    const TRAVELER_COMMISSION = 0.85;
    
    const revenue = formData.pricePerKg && formData.availableCapacity ? {
      total: (formData.pricePerKg * formData.availableCapacity).toFixed(2),
      platform: (formData.pricePerKg * formData.availableCapacity * PLATFORM_COMMISSION).toFixed(2),
      traveler: (formData.pricePerKg * formData.availableCapacity * TRAVELER_COMMISSION).toFixed(2),
      platformPercent: (PLATFORM_COMMISSION * 100).toFixed(0),
      travelerPercent: (TRAVELER_COMMISSION * 100).toFixed(0),
    } : null;

    // Package types labels
    const packageTypeLabels: Record<string, string> = {
      'enveloppes': t('trips.packageTypes.enveloppes'),
      'petits_colis': t('trips.packageTypes.petitsColis'),
      'moyens_colis': t('trips.packageTypes.moyensColis'),
      'grands_colis': t('trips.packageTypes.grandsColis'),
    };

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">{t('common.confirm')}</h2>
        
        <Card className="p-6">
          <div className="space-y-6">
            {/* Itinerary Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('trips.departure')}
              </h3>
              <div className="ml-7 space-y-1">
                <p className="text-gray-900 font-medium">{formData.departureCity}, {formData.departureCountry}</p>
                <p className="text-gray-600 text-sm">{formData.departureDate}</p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('trips.arrival')}
              </h3>
              <div className="ml-7 space-y-1">
                <p className="text-gray-900 font-medium">{formData.arrivalCity}, {formData.arrivalCountry}</p>
                <p className="text-gray-600 text-sm">{formData.arrivalDate}</p>
              </div>
            </div>

            {/* Package Types Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {t('trips.acceptedPackageTypes')}
              </h3>
              <div className="ml-7 flex flex-wrap gap-2">
                {(formData.acceptedPackageTypes || []).map((type) => (
                  <span key={type} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {packageTypeLabels[type] || type}
                  </span>
                ))}
              </div>
            </div>

            {/* Pickup Address Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t('trips.pickupAddress')}
              </h3>
              <div className="ml-7">
                <p className="text-gray-700 whitespace-pre-line">{formData.pickupAddress}</p>
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('trips.deliveryAddress')}
              </h3>
              <div className="ml-7">
                <p className="text-gray-700 whitespace-pre-line">{formData.deliveryAddress}</p>
              </div>
            </div>

            {/* Travel Proof Section */}
            {travelProof && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('trips.travelProof')}
                </h3>
                <div className="ml-7 flex items-center space-x-2 text-sm">
                  <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-700">{travelProof.name}</span>
                  <span className="text-green-600 font-medium">✓ {t('common.uploaded')}</span>
                </div>
              </div>
            )}

            {/* Capacity & Pricing Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <svg className="h-5 w-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('trips.capacity')} & {t('trips.price')}
              </h3>
              <div className="ml-7 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('trips.availableCapacity')}:</span>
                  <span className="font-medium text-gray-900">{formData.availableCapacity} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('trips.pricePerKg')}:</span>
                  <span className="font-medium text-gray-900">${formData.pricePerKg}</span>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown Section */}
            {revenue && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('trips.revenueBreakdown')}
                </h3>
                <div className="ml-7 space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">{t('trips.totalRevenue')}:</span>
                    <span className="font-bold text-lg text-gray-900">${revenue.total}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 space-y-1">
                    <div className="flex justify-between items-center text-green-700">
                      <span>💰 {t('trips.yourEarnings')} ({revenue.travelerPercent}%):</span>
                      <span className="font-semibold">${revenue.traveler}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600 text-sm">
                      <span>🏢 {t('trips.platformFee')} ({revenue.platformPercent}%):</span>
                      <span className="font-medium">${revenue.platform}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}
      </div>
    );
  };

  return (
    <KYCBlocker action="publier un voyage">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('trips.publish')}</h1>

        {renderStepIndicator()}

        <Card className="p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
              disabled={isSubmitting}
            >
              {t('common.back')}
            </Button>
          )}
          
          <div className="ml-auto flex gap-2">
            <Button
              variant="ghost"
              onClick={saveDraft}
              disabled={isSubmitting}
            >
              {t('common.save')} Draft
            </Button>
            
            {currentStep < 4 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                {t('common.next')}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {t('common.submit')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
    </KYCBlocker>
  );
}
