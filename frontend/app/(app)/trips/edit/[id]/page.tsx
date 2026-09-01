'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { CitySelect } from '@/components/ui/CitySelect';
import { useCountries } from '@/lib/hooks/useCountries';
import { useUserCurrency } from '@/lib/hooks/useUserCurrency';
import { apiClient } from '@/lib/api/client';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { translateValidationErrors } from '@/lib/errors/errorMessages';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface TripFormData {
  departureCountryId: number;
  departureCityId: number;
  departureDate: string;
  arrivalCountryId: number;
  arrivalCityId: number;
  arrivalDate: string;
  availableCapacity: number;
  pricePerKg: number;
  acceptedPackageTypes: string[];
  pickupAddress: string;
  deliveryAddress: string;
}

export default function EditTripPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const tripId = params?.id as string;
  const { user } = useAuth();
  const { getCountryById, getCityById } = useCountries();
  const { currencySymbol, formatCurrency, currencyCode } = useUserCurrency();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [formData, setFormData] = useState<Partial<TripFormData>>({});

  useEffect(() => {
    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const fetchTrip = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<any>(`/api/trips/${tripId}`);
      const trip = data.data || data;
      
      // Convertir les données du backend au format du formulaire
      setFormData({
        departureCountryId: trip.departure_country_id,
        departureCityId: trip.departure_city_id,
        departureDate: trip.departure_date?.split('T')[0] || trip.departure_date,
        arrivalCountryId: trip.arrival_country_id,
        arrivalCityId: trip.arrival_city_id,
        arrivalDate: trip.arrival_date?.split('T')[0] || trip.arrival_date,
        availableCapacity: trip.available_capacity,
        pricePerKg: trip.price_per_kg,
        acceptedPackageTypes: trip.accepted_package_types || [],
        pickupAddress: trip.pickup_address || '',
        deliveryAddress: trip.delivery_address || '',
      });
    } catch (err: any) {
      console.error('Failed to fetch trip:', err);
      alert('Erreur lors du chargement du voyage');
      router.push('/trips/my');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof TripFormData, value: string | number | string[] | undefined) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset city when country changes
      if (field === 'departureCountryId') { 
        newData.departureCityId = undefined;
      }
      
      if (field === 'arrivalCountryId') { 
        newData.arrivalCityId = undefined;
      }
      
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

  const isRussiaCountryId = (cId?: number) => {
    if (!cId) return false;
    const country = getCountryById(cId);
    if (!country) return false;
    const name = country.name.toLowerCase();
    return name.includes('russia') || name.includes('russie') || country.code?.toUpperCase() === 'RU';
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.departureCountryId) newErrors.departureCountryId = 'Requis';
    if (!formData.departureCityId) newErrors.departureCityId = 'Requis';
    if (!formData.arrivalCountryId) newErrors.arrivalCountryId = 'Requis';
    if (!formData.arrivalCityId) newErrors.arrivalCityId = 'Requis';
    if (!formData.departureDate) newErrors.departureDate = 'Requis';
    if (!formData.arrivalDate) newErrors.arrivalDate = 'Requis';

    if (formData.departureCountryId && formData.arrivalCountryId) {
      if (formData.departureCountryId === formData.arrivalCountryId) {
        newErrors.arrivalCountryId = 'Le pays de départ et le pays d\'arrivée doivent être différents.';
      } else {
        const isDepRussia = isRussiaCountryId(formData.departureCountryId);
        const isArrRussia = isRussiaCountryId(formData.arrivalCountryId);

        if (isDepRussia && isArrRussia) {
          newErrors.arrivalCountryId = 'Le trajet doit obligatoirement s\'effectuer entre la Russie et un pays d\'Afrique (pas Russie vers Russie).';
        } else if (!isDepRussia && !isArrRussia) {
          newErrors.arrivalCountryId = 'Le trajet doit obligatoirement s\'effectuer entre la Russie et un pays d\'Afrique (pas Afrique vers Afrique).';
        }
      }
    }
    
    if (formData.departureDate && formData.arrivalDate) {
      const departureDate = new Date(formData.departureDate);
      const arrivalDate = new Date(formData.arrivalDate);
      
      if (departureDate >= arrivalDate) {
        newErrors.arrivalDate = 'La date d\'arrivée doit être après la date de départ';
      }
    }
    
    if (!formData.availableCapacity || formData.availableCapacity <= 0) {
      newErrors.availableCapacity = 'Doit être positif';
    }
    
    if (!formData.pricePerKg || formData.pricePerKg <= 0) {
      newErrors.pricePerKg = 'Doit être positif';
    }
    
    if (!formData.acceptedPackageTypes || formData.acceptedPackageTypes.length === 0) {
      newErrors.acceptedPackageTypes = 'Sélectionnez au moins un type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        departure_country_id: formData.departureCountryId,
        departure_city_id: formData.departureCityId,
        departure_date: formData.departureDate,
        arrival_country_id: formData.arrivalCountryId,
        arrival_city_id: formData.arrivalCityId,
        arrival_date: formData.arrivalDate,
        available_capacity: formData.availableCapacity,
        price_per_kg: formData.pricePerKg,
        currency_code: currencyCode,
        accepted_package_types: formData.acceptedPackageTypes,
      };

      // Ajouter les adresses seulement si elles sont renseignées (min 5 caractères)
      if (formData.pickupAddress && formData.pickupAddress.trim().length >= 5) {
        payload.pickup_address = formData.pickupAddress;
      }
      if (formData.deliveryAddress && formData.deliveryAddress.trim().length >= 5) {
        payload.delivery_address = formData.deliveryAddress;
      }

      await apiClient.put(`/api/trips/${tripId}`, payload);
      
      // Rediriger sans alert
      router.push('/trips/my');
      
    } catch (error: any) {
      console.error('Failed to update trip:', error);
      
      if (error.errors) {
        // Traduire les erreurs en français
        const translatedErrors = translateValidationErrors(error.errors, 'fr');
        setErrors(translatedErrors);
        
        // Message général
        const errorCount = Object.keys(translatedErrors).length;
        const summaryMessage = errorCount === 1
          ? 'Veuillez corriger l\'erreur ci-dessous'
          : `Veuillez corriger les ${errorCount} erreurs ci-dessous`;
        
        setSubmitError(summaryMessage);
      } else {
        setSubmitError(error.message || 'Impossible de modifier le voyage');
      }
      
      // Scroll vers le haut pour voir l'erreur
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePackageType = (type: string) => {
    const current = formData.acceptedPackageTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    handleInputChange('acceptedPackageTypes', updated);
  };

  const packageTypes = [
    { value: 'enveloppes', label: 'Enveloppes' },
    { value: 'petits_colis', label: 'Petits colis' },
    { value: 'moyens_colis', label: 'Moyens colis' },
    { value: 'grands_colis', label: 'Grands colis' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/trips/my')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à mes voyages
        </Button>
        <h1 className="text-3xl font-bold">Modifier le voyage</h1>
        <p className="text-gray-600 mt-2">Modifiez les détails de votre voyage</p>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="mb-6">
          <ErrorAlert
            message={submitError}
            severity="error"
            fieldErrors={Object.keys(errors).length > 0 ? errors : undefined}
            dismissible
            onDismiss={() => {
              setSubmitError('');
              setErrors({});
            }}
          />
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Itinéraire */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Itinéraire</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CountrySelect
                  label="Pays de départ"
                  value={formData.departureCountryId}
                  onChange={(id) => handleInputChange('departureCountryId', id ?? undefined)}
                  error={errors.departureCountryId}
                  required
                />
              </div>
              <div>
                <CitySelect
                  label="Ville de départ"
                  countryId={formData.departureCountryId}
                  value={formData.departureCityId}
                  onChange={(id) => handleInputChange('departureCityId', id ?? undefined)}
                  error={errors.departureCityId}
                  required
                />
              </div>
              <div>
                <CountrySelect
                  label="Pays d'arrivée"
                  value={formData.arrivalCountryId}
                  onChange={(id) => handleInputChange('arrivalCountryId', id ?? undefined)}
                  error={errors.arrivalCountryId}
                  required
                />
              </div>
              <div>
                <CitySelect
                  label="Ville d'arrivée"
                  countryId={formData.arrivalCountryId}
                  value={formData.arrivalCityId}
                  onChange={(id) => handleInputChange('arrivalCityId', id ?? undefined)}
                  error={errors.arrivalCityId}
                  required
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Date de départ"
                value={formData.departureDate || ''}
                onChange={(e) => handleInputChange('departureDate', e.target.value)}
                error={errors.departureDate}
                required
              />
              <Input
                type="date"
                label="Date d'arrivée"
                value={formData.arrivalDate || ''}
                onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                error={errors.arrivalDate}
                min={formData.departureDate}
                required
              />
            </div>
          </div>

          {/* Capacité et Prix */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Capacité et Prix</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Capacité disponible (kg)"
                value={formData.availableCapacity || ''}
                onChange={(e) => handleInputChange('availableCapacity', parseFloat(e.target.value))}
                error={errors.availableCapacity}
                min="0"
                step="0.1"
                required
              />
              <Input
                type="number"
                label={`Prix par kg (${currencySymbol})`}
                value={formData.pricePerKg || ''}
                onChange={(e) => handleInputChange('pricePerKg', parseFloat(e.target.value))}
                error={errors.pricePerKg}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Types de colis acceptés */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Types de colis acceptés <span className="text-red-500">*</span>
            </label>
            {errors.acceptedPackageTypes && (
              <p className="text-sm text-red-600 mb-2">{errors.acceptedPackageTypes}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {packageTypes.map((type) => {
                const selected = (formData.acceptedPackageTypes || []).includes(type.value);
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => togglePackageType(type.value)}
                    className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                      selected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Adresses */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Adresses (optionnel)</h2>
            <div className="space-y-4">
              <Input
                label="Adresse de collecte"
                value={formData.pickupAddress || ''}
                onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                error={errors.pickupAddress}
                placeholder="Adresse où vous pouvez récupérer les colis"
              />
              <Input
                label="Adresse de livraison"
                value={formData.deliveryAddress || ''}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                error={errors.deliveryAddress}
                placeholder="Adresse où vous pouvez livrer les colis"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/trips/my')}
              disabled={isSubmitting}
              fullWidth
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              fullWidth
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
