'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { KYCBlocker } from '@/components/features/KYCBlocker';
import { FileUpload } from '@/components/ui/FileUpload';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { DEFAULT_UPLOAD_OPTIONS } from '@/lib/services/FileUploadService';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { z } from 'zod';

// Zod schema for shipment validation
const shipmentSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  weight: z.number().positive('Weight must be positive'),
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

export default function NewShipmentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // File upload hook for shipment photos
  const fileUpload = useFileUpload({
    ...DEFAULT_UPLOAD_OPTIONS.image,
    multiple: true,
    endpoint: '/api/upload',
  });
  
  // Form data state
  const [formData, setFormData] = useState<Partial<ShipmentFormData>>({
    description: '',
    weight: undefined,
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

  // Prohibited items confirmation
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showProhibitedItems, setShowProhibitedItems] = useState(false);

  const handleInputChange = (field: keyof ShipmentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
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
            newErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check prohibited items confirmation
    if (!acceptedTerms) {
      setErrors({ submit: t('shipments.prohibitedItemsRequired') });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Upload photos first if any
      let photoUrls: string[] = [];
      if (fileUpload.files.length > 0) {
        try {
          const uploadResults = await fileUpload.upload();
          photoUrls = uploadResults.map(result => result.url);
        } catch (uploadError) {
          throw new Error(t('shipments.photoUploadError'));
        }
      }

      // Create shipment via API
      const response = await apiClient.post<{ data: any }>(API_ENDPOINTS.shipments.create, {
        pickup_country: formData.pickupCountry,
        pickup_city: formData.pickupCity,
        pickup_address: formData.pickupAddress,
        delivery_country: formData.deliveryCountry,
        delivery_city: formData.deliveryCity,
        delivery_address: formData.deliveryAddress,
        recipient_name: formData.recipientName,
        recipient_phone: formData.recipientPhone,
        package_type: formData.packageType,
        weight: formData.weight,
        description: formData.description,
        value: formData.value,
        photo_urls: photoUrls,
      });

      // Success - redirect to my shipments page
      router.push('/shipments/my');
    } catch (error) {
      console.error('Failed to create shipment:', error);
      const errorMessage = ErrorHandler.handle(error);
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KYCBlocker action="créer une expédition">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('shipments.create')}</h1>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('shipments.packageDetails')}</h2>
          
          <div className="space-y-4">
            <Input
              type="text"
              label={t('shipments.description')}
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              error={errors.description}
              required
              placeholder="e.g., Electronics, Clothing, Documents"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="number"
                label={t('shipments.weight') + ' (kg)'}
                value={formData.weight?.toString() || ''}
                onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                error={errors.weight}
                required
                placeholder="0.0"
              />

              <Input
                type="number"
                label={t('shipments.value') + ' (EUR)'}
                value={formData.value?.toString() || ''}
                onChange={(e) => handleInputChange('value', parseFloat(e.target.value))}
                error={errors.value}
                required
                placeholder="0.00"
              />
            </div>

            <Input
              type="text"
              label={t('shipments.packageType')}
              value={formData.packageType || ''}
              onChange={(e) => handleInputChange('packageType', e.target.value)}
              error={errors.packageType}
              required
              placeholder="e.g., Documents, Electronics, Clothing"
            />

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('shipments.photos')} <span className="text-gray-500 text-sm">({t('common.optional')})</span>
              </label>
              <FileUpload
                {...fileUpload.dragProps}
                files={fileUpload.files}
                previews={fileUpload.previews}
                onFilesSelected={(files) => fileUpload.addFiles(files)}
                onRemoveFile={fileUpload.removeFile}
                error={fileUpload.error || undefined}
                accept="image/*"
                multiple
                maxFiles={5}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('shipments.photosHelper')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('shipments.recipientInfo')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </Card>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📍</span>
            <h2 className="text-xl font-semibold">{t('shipments.pickupLocation')}</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">{t('shipments.pickupLocationHelper')}</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-semibold">{t('shipments.deliveryLocation')}</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">{t('shipments.deliveryLocationHelper')}</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </Card>

        {/* Prohibited Items Warning */}
        <Card className="p-6 mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-yellow-900 mb-2">
                {t('shipments.prohibitedItemsTitle')}
              </h2>
              <p className="text-sm text-yellow-800 mb-3">
                {t('shipments.prohibitedItemsWarning')}
              </p>
              
              <button
                type="button"
                onClick={() => setShowProhibitedItems(!showProhibitedItems)}
                className="text-sm font-medium text-yellow-900 hover:text-yellow-700 underline mb-3"
              >
                {showProhibitedItems ? t('shipments.hideProhibitedList') : t('shipments.viewProhibitedList')}
              </button>

              {showProhibitedItems && (
                <div className="bg-white border border-yellow-300 rounded p-4 mb-4">
                  <p className="font-medium text-gray-900 mb-2">{t('shipments.prohibitedItemsListTitle')}</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>{t('shipments.prohibitedItem1')}</li>
                    <li>{t('shipments.prohibitedItem2')}</li>
                    <li>{t('shipments.prohibitedItem3')}</li>
                    <li>{t('shipments.prohibitedItem4')}</li>
                    <li>{t('shipments.prohibitedItem5')}</li>
                    <li>{t('shipments.prohibitedItem6')}</li>
                    <li>{t('shipments.prohibitedItem7')}</li>
                    <li>{t('shipments.prohibitedItem8')}</li>
                  </ul>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />
                <span className="text-sm text-gray-900">
                  {t('shipments.prohibitedItemsConfirmation')}
                </span>
              </label>
            </div>
          </div>
        </Card>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {errors.submit}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {t('common.submit')}
          </Button>
        </div>
      </form>
    </div>
    </KYCBlocker>
  );
}
