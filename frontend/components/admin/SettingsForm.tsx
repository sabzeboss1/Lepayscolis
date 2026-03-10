'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle, AlertTriangle, RotateCcw } from 'lucide-react';

interface SettingsFormData {
  platform_fee_percentage: number;
  withdrawal_fee: number;
  min_withdrawal_amount: number;
  max_withdrawal_amount: number;
  min_shipment_price: number;
  max_shipment_price: number;
}

interface SettingsFormProps {
  initialData: SettingsFormData;
  onSubmit: (data: SettingsFormData) => Promise<void>;
  onReset?: () => Promise<void>;
  loading?: boolean;
}

const DEFAULT_SETTINGS: SettingsFormData = {
  platform_fee_percentage: 10.0,
  withdrawal_fee: 2.50,
  min_withdrawal_amount: 20.00,
  max_withdrawal_amount: 5000.00,
  min_shipment_price: 10.00,
  max_shipment_price: 1000.00
};

export default function SettingsForm({
  initialData,
  onSubmit,
  onReset,
  loading = false
}: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset
  } = useForm<SettingsFormData>({
    defaultValues: initialData
  });

  const watchedValues = watch();

  const onFormSubmit = async (data: SettingsFormData) => {
    setShowConfirmation(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    setShowConfirmation(false);
    try {
      const data = watchedValues;
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (onReset) {
      setIsSubmitting(true);
      setShowResetConfirmation(false);
      try {
        await onReset();
        reset(DEFAULT_SETTINGS);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {/* Platform Fee Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Fees</h3>
          
          <div>
            <label htmlFor="platform_fee_percentage" className="block text-sm font-medium text-gray-700 mb-1">
              Platform Fee Percentage
            </label>
            <div className="relative">
              <input
                id="platform_fee_percentage"
                type="number"
                step="0.01"
                {...register('platform_fee_percentage', {
                  required: 'Platform fee is required',
                  min: {
                    value: 0,
                    message: 'Fee must be at least 0%'
                  },
                  max: {
                    value: 100,
                    message: 'Fee cannot exceed 100%'
                  },
                  valueAsNumber: true
                })}
                className={`
                  block w-full px-3 py-2 border rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${errors.platform_fee_percentage ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                `}
                placeholder="10.00"
                disabled={isLoading}
                aria-invalid={errors.platform_fee_percentage ? 'true' : 'false'}
                aria-describedby={errors.platform_fee_percentage ? 'platform-fee-error' : undefined}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">%</span>
              </div>
            </div>
            {errors.platform_fee_percentage && (
              <div id="platform-fee-error" className="mt-1 flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.platform_fee_percentage.message}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Percentage charged on each transaction (0-100%)
            </p>
          </div>
        </div>

        {/* Withdrawal Settings Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="withdrawal_fee" className="block text-sm font-medium text-gray-700 mb-1">
                Withdrawal Fee
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">€</span>
                </div>
                <input
                  id="withdrawal_fee"
                  type="number"
                  step="0.01"
                  {...register('withdrawal_fee', {
                    required: 'Withdrawal fee is required',
                    min: {
                      value: 0,
                      message: 'Fee must be at least €0.00'
                    },
                    valueAsNumber: true
                  })}
                  className={`
                    block w-full pl-8 pr-3 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.withdrawal_fee ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                  `}
                  placeholder="2.50"
                  disabled={isLoading}
                  aria-invalid={errors.withdrawal_fee ? 'true' : 'false'}
                  aria-describedby={errors.withdrawal_fee ? 'withdrawal-fee-error' : undefined}
                />
              </div>
              {errors.withdrawal_fee && (
                <div id="withdrawal-fee-error" className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.withdrawal_fee.message}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="min_withdrawal_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Withdrawal
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">€</span>
                  </div>
                  <input
                    id="min_withdrawal_amount"
                    type="number"
                    step="0.01"
                    {...register('min_withdrawal_amount', {
                      required: 'Minimum withdrawal is required',
                      min: {
                        value: 0,
                        message: 'Amount must be at least €0.00'
                      },
                      validate: (value) => {
                        const max = watchedValues.max_withdrawal_amount;
                        return value < max || 'Minimum must be less than maximum';
                      },
                      valueAsNumber: true
                    })}
                    className={`
                      block w-full pl-8 pr-3 py-2 border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.min_withdrawal_amount ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                    `}
                    placeholder="20.00"
                    disabled={isLoading}
                    aria-invalid={errors.min_withdrawal_amount ? 'true' : 'false'}
                    aria-describedby={errors.min_withdrawal_amount ? 'min-withdrawal-error' : undefined}
                  />
                </div>
                {errors.min_withdrawal_amount && (
                  <div id="min-withdrawal-error" className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.min_withdrawal_amount.message}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="max_withdrawal_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Withdrawal
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">€</span>
                  </div>
                  <input
                    id="max_withdrawal_amount"
                    type="number"
                    step="0.01"
                    {...register('max_withdrawal_amount', {
                      required: 'Maximum withdrawal is required',
                      min: {
                        value: 0,
                        message: 'Amount must be at least €0.00'
                      },
                      validate: (value) => {
                        const min = watchedValues.min_withdrawal_amount;
                        return value > min || 'Maximum must be greater than minimum';
                      },
                      valueAsNumber: true
                    })}
                    className={`
                      block w-full pl-8 pr-3 py-2 border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.max_withdrawal_amount ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                    `}
                    placeholder="5000.00"
                    disabled={isLoading}
                    aria-invalid={errors.max_withdrawal_amount ? 'true' : 'false'}
                    aria-describedby={errors.max_withdrawal_amount ? 'max-withdrawal-error' : undefined}
                  />
                </div>
                {errors.max_withdrawal_amount && (
                  <div id="max-withdrawal-error" className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.max_withdrawal_amount.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Shipment Pricing Section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment Pricing</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="min_shipment_price" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Shipment Price
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">€</span>
                </div>
                <input
                  id="min_shipment_price"
                  type="number"
                  step="0.01"
                  {...register('min_shipment_price', {
                    required: 'Minimum shipment price is required',
                    min: {
                      value: 0,
                      message: 'Price must be at least €0.00'
                    },
                    validate: (value) => {
                      const max = watchedValues.max_shipment_price;
                      return value < max || 'Minimum must be less than maximum';
                    },
                    valueAsNumber: true
                  })}
                  className={`
                    block w-full pl-8 pr-3 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.min_shipment_price ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                  `}
                  placeholder="10.00"
                  disabled={isLoading}
                  aria-invalid={errors.min_shipment_price ? 'true' : 'false'}
                  aria-describedby={errors.min_shipment_price ? 'min-shipment-error' : undefined}
                />
              </div>
              {errors.min_shipment_price && (
                <div id="min-shipment-error" className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.min_shipment_price.message}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="max_shipment_price" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Shipment Price
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">€</span>
                </div>
                <input
                  id="max_shipment_price"
                  type="number"
                  step="0.01"
                  {...register('max_shipment_price', {
                    required: 'Maximum shipment price is required',
                    min: {
                      value: 0,
                      message: 'Price must be at least €0.00'
                    },
                    validate: (value) => {
                      const min = watchedValues.min_shipment_price;
                      return value > min || 'Maximum must be greater than minimum';
                    },
                    valueAsNumber: true
                  })}
                  className={`
                    block w-full pl-8 pr-3 py-2 border rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    ${errors.max_shipment_price ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                  `}
                  placeholder="1000.00"
                  disabled={isLoading}
                  aria-invalid={errors.max_shipment_price ? 'true' : 'false'}
                  aria-describedby={errors.max_shipment_price ? 'max-shipment-error' : undefined}
                />
              </div>
              {errors.max_shipment_price && (
                <div id="max-shipment-error" className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.max_shipment_price.message}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          {onReset && (
            <button
              type="button"
              onClick={() => setShowResetConfirmation(true)}
              disabled={isLoading}
              className="
                px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2
                focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center
              "
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </button>
          )}
          
          <div className="flex items-center space-x-3 ml-auto">
            <button
              type="submit"
              disabled={isLoading || !isDirty}
              className="
                px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent
                rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center
              "
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Settings
            </button>
          </div>
        </div>

        {!isDirty && !isLoading && (
          <p className="text-xs text-gray-500 text-center">
            No changes detected
          </p>
        )}
      </form>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Settings Update</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to update these platform settings? Changes will take effect immediately and affect all users.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Reset to Defaults</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to reset all settings to their default values? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Reset Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
