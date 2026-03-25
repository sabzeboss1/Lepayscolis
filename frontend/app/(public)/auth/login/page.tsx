'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LiveRegion } from '@/components/ui/LiveRegion';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { ApiError } from '@/lib/api/client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('auth.invalidEmail'),
  password: z.string().min(6, 'auth.passwordMinLength'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    setStatusMessage(t('auth.signingIn'));

    try {
      const user = await login(data.email, data.password);
      setStatusMessage(t('auth.loginRedirect'));

      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        router.push(redirectTo);
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        const fieldErrs = ErrorHandler.handleValidationErrors(err.errors);
        setFieldErrors(fieldErrs);
        setError(t('auth.correctErrors'));
      } else {
        const errorMessage = err instanceof Error ? err.message : t('auth.loginError');
        setError(errorMessage);
      }
      setStatusMessage(`${t('common.error')}: ${error || t('auth.loginError')}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resolve zod error messages through i18n
  const resolveError = (msg?: string) => {
    if (!msg) return undefined;
    // If it looks like a translation key, resolve it
    if (msg.startsWith('auth.') || msg.startsWith('validation.')) {
      return t(msg);
    }
    return msg;
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
            {t('auth.welcome')}
          </h1>
          <p className="text-gray-500">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" aria-label="Login form">
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
              type="email"
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              error={resolveError(errors.email?.message) || fieldErrors.email}
              {...register('email')}
            />

            <div>
              <Input
                type="password"
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                error={resolveError(errors.password?.message) || fieldErrors.password}
                {...register('password')}
              />
              <div className="mt-1 text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              loading={isSubmitting}
              aria-label={isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            >
              {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {t('auth.noAccount')}{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('auth.registerHere')}
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
