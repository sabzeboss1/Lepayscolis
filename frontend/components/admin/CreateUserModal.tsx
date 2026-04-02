'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, AlertCircle, Loader2, User, Mail, Phone, Lock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface CreateUserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<CreateUserFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    }
  });

  const password = watch('password');

  useEffect(() => {
    if (!isOpen) {
      reset();
      setError(null);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post(API_ENDPOINTS.admin.users.list, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || t('admin.users.createModal.errors.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {t('admin.users.createModal.title')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('admin.users.createModal.subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">
            <div className="space-y-5">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.createModal.fullName')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    {...register('name', {
                      required: t('admin.users.createModal.errors.nameRequired'),
                      minLength: {
                        value: 2,
                        message: t('admin.users.createModal.errors.nameMin')
                      },
                      maxLength: {
                        value: 255,
                        message: t('admin.users.createModal.errors.nameMax')
                      }
                    })}
                    className={`
                      block w-full pl-10 pr-3 py-2 border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                    `}
                    placeholder="John Doe"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.createModal.email')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...register('email', {
                      required: t('admin.users.createModal.errors.emailRequired'),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t('admin.users.createModal.errors.emailInvalid')
                      }
                    })}
                    className={`
                      block w-full pl-10 pr-3 py-2 border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                    `}
                    placeholder="john.doe@example.com"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.createModal.phone')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone', {
                      required: t('admin.users.createModal.errors.phoneRequired'),
                      pattern: {
                        value: /^\+?[1-9]\d{1,14}$/,
                        message: t('admin.users.createModal.errors.phoneInvalid')
                      }
                    })}
                    className={`
                      block w-full pl-10 pr-3 py-2 border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                    `}
                    placeholder="+33612345678"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phone.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {t('admin.users.createModal.phoneHint')}
                </p>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.createModal.password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    {...register('password', {
                      required: t('admin.users.createModal.errors.passwordRequired'),
                      minLength: {
                        value: 8,
                        message: t('admin.users.createModal.errors.passwordMin')
                      }
                    })}
                    className={`
                      block w-full pl-10 pr-3 py-2 border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                    `}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('admin.users.createModal.confirmPassword')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword', {
                      required: t('admin.users.createModal.errors.confirmRequired'),
                      validate: (value) => value === password || t('admin.users.createModal.errors.passwordMismatch')
                    })}
                    className={`
                      block w-full pl-10 pr-3 py-2 border rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                    `}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="
                  px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                  rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2
                  focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {t('admin.users.createModal.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent
                  rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                  focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors flex items-center
                "
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting ? t('admin.users.createModal.creating') : t('admin.users.createModal.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
