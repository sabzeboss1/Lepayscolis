'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LiveRegion } from '@/components/ui/LiveRegion';
import { useCountries } from '@/lib/hooks/useCountries';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { ApiError } from '@/lib/api/client';
import { formatPhoneToE164, getPhonePlaceholder, getPhoneHelperText } from '@/lib/utils/phoneFormatter';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('auth.invalidEmail'),
  phone: z.string().min(8, 'Phone number must be at least 8 characters'),
  country: z.string().min(2, 'Please select a country'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { countries, isLoading: countriesLoading } = useCountries();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Watch country field to update phone placeholder
  const country = watch('country');

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    setStatusMessage(t('auth.creatingAccount'));

    try {
      // Detect user's locale from browser or default to 'fr'
      const userLocale = navigator.language.startsWith('fr') ? 'fr' : 'en';

      // Format phone number to E.164 based on selected country
      const formattedPhone = formatPhoneToE164(data.phone, data.country);

      await registerUser({
        name: data.name,
        email: data.email,
        phone: formattedPhone,
        country: data.country,
        password: data.password,
        password_confirmation: data.confirmPassword,
        locale: userLocale,
      });
      setStatusMessage(t('auth.registerSuccess'));
      router.push('/dashboard');
    } catch (err) {
      // Handle API errors with field-level validation
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        const fieldErrs = ErrorHandler.handleValidationErrors(err.errors);
        setFieldErrors(fieldErrs);
        setError(t('auth.correctErrors'));
      } else {
        setError(err instanceof Error ? err.message : t('auth.registerError'));
      }
      setStatusMessage(`${t('common.error')}: ${error || t('auth.registerError')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <LiveRegion message={statusMessage} politeness="assertive" />

      {/* Top bar: back to home + language switcher */}
      <div className="fixed top-4 left-4 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white/80 backdrop-blur rounded-lg border border-gray-200 hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('navigation.home')}
        </Link>
      </div>
      <div className="fixed top-4 right-4 z-10">
        <LanguageSwitcher currentLocale={locale} onLocaleChange={setLocale} />
      </div>

      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="LePaysCoLis"
              width={80}
              height={80}
              className="rounded-2xl shadow-lg"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('auth.registerTitle')}
          </h1>
          <p className="text-gray-500">{t('auth.registerSubtitle')}</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" aria-label="Register form">
            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}

            <Input
              type="text"
              label={t('auth.name')}
              placeholder={t('auth.namePlaceholder')}
              error={errors.name?.message || fieldErrors.name}
              {...register('name')}
            />

            <Input
              type="email"
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              error={errors.email?.message || fieldErrors.email}
              {...register('email')}
            />

            <Select
              label={t('common.selectCountry')}
              options={countries.map((c) => ({ value: c.code, label: c.name }))}
              placeholder={t('common.selectCountry')}
              disabled={countriesLoading}
              error={errors.country?.message || fieldErrors.country}
              required
              value={country || ''}
              onChange={(value) => setValue('country', value, { shouldValidate: true })}
            />

            <Input
              type="tel"
              label={t('auth.phone')}
              placeholder={country ? getPhonePlaceholder(country) : t('trips.selectCountryFirst')}
              error={errors.phone?.message || fieldErrors.phone}
              {...register('phone')}
              helperText={country ? getPhoneHelperText(country) : t('trips.selectCountryFirst')}
            />

            <div>
              <Input
                type="password"
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                error={errors.password?.message || fieldErrors.password}
                {...register('password')}
              />
              <p className="mt-1 text-xs text-gray-400">{t('auth.passwordRequirements')}</p>
            </div>

            <Input
              type="password"
              label={t('auth.confirmPassword')}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              error={errors.confirmPassword?.message || fieldErrors.password_confirmation}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              loading={isSubmitting}
              aria-label={isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
            >
              {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {t('auth.hasAccount')}{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('auth.signIn')}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          LePaysCoLis &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
