'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, User, Mail, Phone, AlertCircle } from 'lucide-react';

interface UserFormData {
  name: string;
  email: string;
  phone: string;
}

interface UserFormProps {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export default function UserForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Changes',
  loading = false
}: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<UserFormData>({
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || ''
    }
  });

  const onFormSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="name"
            type="text"
            {...register('name', {
              required: 'Name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters'
              },
              maxLength: {
                value: 100,
                message: 'Name must not exceed 100 characters'
              },
              pattern: {
                value: /^[a-zA-ZÀ-ÿ\s'-]+$/,
                message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
              }
            })}
            className={`
              block w-full pl-10 pr-3 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
            `}
            placeholder="John Doe"
            disabled={isLoading}
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
        </div>
        {errors.name && (
          <div id="name-error" className="mt-1 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.name.message}
          </div>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className={`
              block w-full pl-10 pr-3 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
            `}
            placeholder="john.doe@example.com"
            disabled={isLoading}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </div>
        {errors.email && (
          <div id="email-error" className="mt-1 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.email.message}
          </div>
        )}
      </div>

      {/* Phone Field */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="phone"
            type="tel"
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^\+?[1-9]\d{1,14}$/,
                message: 'Invalid phone number format (use international format, e.g., +33612345678)'
              }
            })}
            className={`
              block w-full pl-10 pr-3 py-2 border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
            `}
            placeholder="+33612345678"
            disabled={isLoading}
            aria-invalid={errors.phone ? 'true' : 'false'}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
          />
        </div>
        {errors.phone && (
          <div id="phone-error" className="mt-1 flex items-center text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.phone.message}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Use international format with country code (e.g., +33 for France)
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="
            px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
            rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2
            focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          Cancel
        </button>
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
          {submitLabel}
        </button>
      </div>

      {!isDirty && !isLoading && initialData && (
        <p className="text-xs text-gray-500 text-center">
          No changes detected
        </p>
      )}
    </form>
  );
}
