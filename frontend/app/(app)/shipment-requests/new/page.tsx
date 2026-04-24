'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KYCBlocker } from '@/components/features/KYCBlocker';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { CitySelect } from '@/components/ui/CitySelect';
import { FileUpload } from '@/components/ui/FileUpload';
import { apiClient } from '@/lib/api/client';
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
  DollarSign,
} from 'lucide-react';

const shipmentRequestSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(255, 'Titre trop long (max 255 caractères)'),
  description: z.string().min(1, 'Description requise'),
  weight: z.number().positive('Le poids doit être positif').min(0.1, 'Poids minimum: 0.1 kg').max(50, 'Poids maximum: 50 kg'),
  length: z.number().positive('La longueur doit être positive').min(1, 'Longueur minimum: 1 cm').optional(),
  width: z.number().positive('La largeur doit être positive').min(1, 'Largeur minimum: 1 cm').optional(),
  height: z.number().positive('La hauteur doit être positive').min(1, 'Hauteur minimum: 1 cm').optional(),
  declared_value: z.number().min(0, 'La valeur doit être positive ou zéro'),
  package_type: z.string().min(1, 'Type de colis requis').max(100, 'Type trop long (max 100 caractères)'),
  recipient_name: z.string().min(1, 'Nom du destinataire requis').max(255, 'Nom trop long (max 255 caractères)'),
  recipient_phone: z.string().min(1, 'Téléphone du destinataire requis').max(20, 'Numéro trop long (max 20 caractères)'),
  pickup_country_id: z.number().positive('Pays de récupération requis'),
  pickup_city_id: z.number().positive('Ville de récupération requise'),
  pickup_address: z.string().min(1, 'Adresse de récupération requise'),
  delivery_country_id: z.number().positive('Pays de livraison requis'),
  delivery_city_id: z.number().positive('Ville de livraison requise'),
  delivery_address: z.string().min(1, 'Adresse de livraison requise'),
  max_budget: z.number().positive('Le budget doit être positif').optional(),
  needed_by: z.string().optional(),
});

type ShipmentRequestFormData = z.infer<typeof shipmentRequestSchema>;

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

export default function NewShipmentRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { formatCurrency, currencyCode } = useUserCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showProhibitedItems, setShowProhibitedItems] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [autoSelectedPickupCountry, setAutoSelectedPickupCountry] = useState<string | null>(null);
  const [autoSelectedDeliveryCountry, setAutoSelectedDeliveryCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState<any[]>([]);

  const [formData, setFormData] = useState<Partial<ShipmentRequestFormData>>({
    title: '',
    description: '',
    weight: undefined,
    length: undefined,
    width: undefined,
    height: undefined,
    declared_value: undefined,
    package_type: '',
    recipient_name: '',
    recipient_phone: '',
    pickup_country_id: undefined,
    pickup_city_id: undefined,
    pickup_address: '',
    delivery_country_id: undefined,
    delivery_city_id: undefined,
    delivery_address: '',
    max_budget: undefined,
    needed_by: '',
  });

  // Fetch wallet balance on mount
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await apiClient.get<{ data: any }>('/api/wallet');
        setWalletBalance(response.data.balance);
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
    if (formData.delivery_country_id && countries.length > 0) {
      const deliveryCountry = countries.find(c => c.id === formData.delivery_country_id);
      if (deliveryCountry) {
        const countryName = deliveryCountry.name.toLowerCase();
        
        // Si le pays de livraison est la Russie, sélectionner automatiquement un pays africain pour la récupération
        if (countryName.includes('russia') || countryName.includes('russie')) {
          const africanCountry = countries.find(c => 
            c.name.toLowerCase().includes('cameroun') || 
            c.name.toLowerCase().includes('cameroon')
          ) || countries.find(c => 
            !c.name.toLowerCase().includes('russia') && 
            !c.name.toLowerCase().includes('russie')
          );
          
          if (africanCountry && formData.pickup_country_id !== africanCountry.id) {
            setFormData(prev => ({
              ...prev,
              pickup_country_id: africanCountry.id,
              pickup_city_id: undefined,
            }));
            setAutoSelectedPickupCountry(`${africanCountry.name} (Afrique)`);
          }
        } 
        // Si le pays de livraison est africain, sélectionner automatiquement la Russie pour la récupération
        else {
          const russia = countries.find(c => 
            c.name.toLowerCase().includes('russia') || 
            c.name.toLowerCase().includes('russie')
          );
          
          if (russia && formData.pickup_country_id !== russia.id) {
            setFormData(prev => ({
              ...prev,
              pickup_country_id: russia.id,
              pickup_city_id: undefined,
            }));
            setAutoSelectedPickupCountry('Russie');
          }
        }
      }
    } else {
      setAutoSelectedPickupCountry(null);
    }
  }, [formData.delivery_country_id, countries]);

  // Auto-select delivery country based on pickup (Russia-Africa logic)
  useEffect(() => {
    if (formData.pickup_country_id && countries.length > 0) {
      const pickupCountry = countries.find(c => c.id === formData.pickup_country_id);
      if (pickupCountry) {
        const countryName = pickupCountry.name.toLowerCase();
        
        // Si le pays de récupération est la Russie, sélectionner automatiquement un pays africain pour la livraison
        if (countryName.includes('russia') || countryName.includes('russie')) {
          const africanCountry = countries.find(c => 
            c.name.toLowerCase().includes('cameroun') || 
            c.name.toLowerCase().includes('cameroon')
          ) || countries.find(c => 
            !c.name.toLowerCase().includes('russia') && 
            !c.name.toLowerCase().includes('russie')
          );
          
          if (africanCountry && formData.delivery_country_id !== africanCountry.id) {
            setFormData(prev => ({
              ...prev,
              delivery_country_id: africanCountry.id,
              delivery_city_id: undefined,
            }));
            setAutoSelectedDeliveryCountry(`${africanCountry.name} (Afrique)`);
          }
        } 
        // Si le pays de récupération est africain, sélectionner automatiquement la Russie pour la livraison
        else {
          const russia = countries.find(c => 
            c.name.toLowerCase().includes('russia') || 
            c.name.toLowerCase().includes('russie')
          );
          
          if (russia && formData.delivery_country_id !== russia.id) {
            setFormData(prev => ({
              ...prev,
              delivery_country_id: russia.id,
              delivery_city_id: undefined,
            }));
            setAutoSelectedDeliveryCountry('Russie');
          }
        }
      }
    } else {
      setAutoSelectedDeliveryCountry(null);
    }
  }, [formData.pickup_country_id, countries]);

  const handleInputChange = (field: keyof ShipmentRequestFormData, value: string | number | undefined) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      
      // Reset city when country changes
      if (field === 'pickup_country_id') {
        newData.pickup_city_id = undefined;
      }
      if (field === 'delivery_country_id') {
        newData.delivery_city_id = undefined;
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
      shipmentRequestSchema.parse(formData);
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
          console.warn('Photo upload failed, proceeding without photo:', uploadError);
        }
      }

      const requestData = {
        title: formData.title,
        description: formData.description,
        weight: formData.weight,
        length: formData.length,
        width: formData.width,
        height: formData.height,
        declared_value: formData.declared_value,
        package_type: formData.package_type,
        recipient_name: formData.recipient_name,
        recipient_phone: formData.recipient_phone,
        pickup_country_id: formData.pickup_country_id,
        pickup_city_id: formData.pickup_city_id,
        pickup_address: formData.pickup_address,
        delivery_country_id: formData.delivery_country_id,
        delivery_city_id: formData.delivery_city_id,
        delivery_address: formData.delivery_address,
        max_budget: formData.max_budget,
        currency_code: currencyCode,
        needed_by: formData.needed_by || null,
        photo_urls: photoUrls,
      };

      console.log('Submitting shipment request:', requestData);
      const response = await apiClient.post<{ data: any }>('/api/shipment-requests', requestData);
      console.log('Shipment request created successfully:', response);

      // Show success state
      setIsSubmitted(true);
      
      // Redirect after a short delay to allow user to see success message
      setTimeout(() => {
        router.replace('/shipments/search');
      }, 3000);
    } catch (error) {
      console.error('Failed to create shipment request:', error);
      const errorMessage = ErrorHandler.handle(error);
      setErrors({ submit: errorMessage.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KYCBlocker action="publier une annonce d'expédition">
      <div className="min-h-screen bg-slate-50">
        {/* Success State */}
        {isSubmitted && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Annonce publiée avec succès !
              </h2>
              <p className="text-slate-600 mb-4">
                Votre annonce d'expédition est maintenant visible sur la page de recherche. 
                Les voyageurs peuvent maintenant soumissionner pour transporter votre colis.
              </p>
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Redirection automatique dans quelques secondes...
                </p>
                <Button
                  variant="primary"
                  onClick={() => router.replace('/shipments/search')}
                >
                  Voir les annonces
                </Button>
              </div>
            </div>
          </div>
        )}

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
                  Publier une annonce d'expédition
                </h1>
                <p className="text-sm text-slate-500">Les voyageurs pourront soumissionner pour transporter votre colis</p>
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
                  <p className="font-semibold text-blue-900">Routes Russie ⇄ Afrique</p>
                  <p className="text-blue-700 mt-1">
                    Notre plateforme connecte la Russie et l'Afrique. Lorsque vous sélectionnez un pays, 
                    l'autre sera automatiquement défini pour respecter cette logique.
                  </p>
                </div>
              </div>
            </div>

            {/* Wallet Balance */}
            {walletBalance !== null && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Solde disponible</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(walletBalance)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <SectionCard
              icon={<Package className="w-4 h-4 text-orange-600" />}
              iconBg="bg-orange-50"
              title="Informations générales"
              subtitle="Titre et description de votre annonce"
            >
              <Input
                type="text"
                label="Titre de l'annonce"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={errors.title}
                required
                placeholder="ex : Envoi de documents urgents Paris → Abidjan"
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Description détaillée <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={4}
                  placeholder="Décrivez votre colis, vos exigences particulières, délais souhaités..."
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </SectionCard>

            {/* Package Details */}
            <SectionCard
              icon={<Package className="w-4 h-4 text-blue-600" />}
              iconBg="bg-blue-50"
              title="Détails du colis"
              subtitle="Dimensions, poids et valeur"
            >
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
                  value={formData.declared_value?.toString() || ''}
                  onChange={(e) => handleInputChange('declared_value', parseFloat(e.target.value))}
                  error={errors.declared_value}
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
                  placeholder="0"
                />
                <Input
                  type="number"
                  label="Largeur (cm)"
                  value={formData.width?.toString() || ''}
                  onChange={(e) => handleInputChange('width', parseFloat(e.target.value))}
                  error={errors.width}
                  placeholder="0"
                />
                <Input
                  type="number"
                  label="Hauteur (cm)"
                  value={formData.height?.toString() || ''}
                  onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                  error={errors.height}
                  placeholder="0"
                />
              </div>
              <Input
                type="text"
                label="Type de colis"
                value={formData.package_type || ''}
                onChange={(e) => handleInputChange('package_type', e.target.value)}
                error={errors.package_type}
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

            {/* Budget & Timeline */}
            <SectionCard
              icon={<DollarSign className="w-4 h-4 text-green-600" />}
              iconBg="bg-green-50"
              title="Budget et délais"
              subtitle="Vos contraintes financières et temporelles"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label={`Budget maximum (${currencyCode})`}
                  value={formData.max_budget?.toString() || ''}
                  onChange={(e) => handleInputChange('max_budget', parseFloat(e.target.value))}
                  error={errors.max_budget}
                  placeholder="0.00"
                  helperText="Montant maximum que vous êtes prêt à payer"
                />
                <Input
                  type="date"
                  label="Date limite souhaitée"
                  value={formData.needed_by || ''}
                  onChange={(e) => handleInputChange('needed_by', e.target.value)}
                  error={errors.needed_by}
                  helperText="Quand avez-vous besoin que le colis arrive ?"
                />
              </div>
            </SectionCard>

            {/* Recipient Info */}
            <SectionCard
              icon={<User className="w-4 h-4 text-purple-600" />}
              iconBg="bg-purple-50"
              title="Informations du destinataire"
              subtitle="Nom et téléphone du destinataire"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="text"
                  label="Nom du destinataire"
                  value={formData.recipient_name || ''}
                  onChange={(e) => handleInputChange('recipient_name', e.target.value)}
                  error={errors.recipient_name}
                  required
                  placeholder="Nom complet du destinataire"
                />
                <Input
                  type="tel"
                  label="Téléphone du destinataire"
                  value={formData.recipient_phone || ''}
                  onChange={(e) => handleInputChange('recipient_phone', e.target.value)}
                  error={errors.recipient_phone}
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
              {/* Auto-selection notification for pickup */}
              {autoSelectedPickupCountry && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-emerald-900">Sélection automatique</p>
                      <p className="text-emerald-700 mt-1">
                        Vous livrez en {formData.delivery_country_id ? countries.find(c => c.id === formData.delivery_country_id)?.name : ''}. 
                        Le pays de récupération a été automatiquement défini sur <strong>{autoSelectedPickupCountry}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CountrySelect
                  label="Pays de récupération"
                  value={formData.pickup_country_id}
                  onChange={(id) => handleInputChange('pickup_country_id', id ?? undefined)}
                  error={errors.pickup_country_id}
                  required
                />
                <CitySelect
                  label="Ville de récupération"
                  countryId={formData.pickup_country_id}
                  value={formData.pickup_city_id}
                  onChange={(id) => handleInputChange('pickup_city_id', id ?? undefined)}
                  error={errors.pickup_city_id}
                  required
                />
              </div>
              <Input
                type="text"
                label="Adresse de récupération"
                value={formData.pickup_address || ''}
                onChange={(e) => handleInputChange('pickup_address', e.target.value)}
                error={errors.pickup_address}
                required
                placeholder="Adresse complète où récupérer le colis"
              />
            </SectionCard>

            {/* Delivery Location */}
            <SectionCard
              icon={<Navigation className="w-4 h-4 text-indigo-600" />}
              iconBg="bg-indigo-50"
              title="Lieu de livraison"
              subtitle="Où le colis doit être livré"
            >
              {/* Auto-selection notification for delivery */}
              {autoSelectedDeliveryCountry && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-emerald-900">Sélection automatique</p>
                      <p className="text-emerald-700 mt-1">
                        Vous récupérez en {formData.pickup_country_id ? countries.find(c => c.id === formData.pickup_country_id)?.name : ''}. 
                        Le pays de livraison a été automatiquement défini sur <strong>{autoSelectedDeliveryCountry}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CountrySelect
                  label="Pays de livraison"
                  value={formData.delivery_country_id}
                  onChange={(id) => handleInputChange('delivery_country_id', id ?? undefined)}
                  error={errors.delivery_country_id}
                  required
                />
                <CitySelect
                  label="Ville de livraison"
                  countryId={formData.delivery_country_id}
                  value={formData.delivery_city_id}
                  onChange={(id) => handleInputChange('delivery_city_id', id ?? undefined)}
                  error={errors.delivery_city_id}
                  required
                />
              </div>
              <Input
                type="text"
                label="Adresse de livraison"
                value={formData.delivery_address || ''}
                onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                error={errors.delivery_address}
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
                Publier l'annonce
              </Button>
            </div>
          </div>
        </form>
      </div>
    </KYCBlocker>
  );
}