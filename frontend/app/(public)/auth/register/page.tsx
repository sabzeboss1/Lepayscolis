'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LiveRegion } from '@/components/ui/LiveRegion';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { ApiError } from '@/lib/api/client';
import { formatPhoneToE164, getPhonePlaceholder, getPhoneHelperText } from '@/lib/utils/phoneFormatter';
import { useCountries } from '@/lib/hooks/useCountries';
import Link from 'next/link';
import { usePlatformBranding } from '@/lib/hooks/usePlatformBranding';
import {
  Package,
  Plane,
  ShieldCheck,
  Star,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  phone: z.string().min(8, 'Numéro de téléphone invalide'),
  country: z.string().min(2, 'Veuillez sélectionner un pays'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const TRUST_BULLETS = [
  { icon: ShieldCheck, text: 'Voyageurs vérifiés et assurés' },
  { icon: Plane, text: 'Livraison Russie ↔ Afrique' },
  { icon: Star, text: 'Économisez jusqu\'à 70% sur vos envois' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { logo_url } = usePlatformBranding();
  const { countries, isLoading: isLoadingCountries } = useCountries();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const country = watch('country');

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    setStatusMessage('Création du compte en cours...');

    try {
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
      setStatusMessage('Compte créé ! Redirection...');
      router.push('/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        const fieldErrs = ErrorHandler.handleValidationErrors(err.errors);
        setFieldErrors(fieldErrs);
        setError('Veuillez corriger les erreurs ci-dessous.');
      } else {
        setError(
          err instanceof Error ? err.message : "Inscription échouée. Veuillez réessayer."
        );
      }
      setStatusMessage('Erreur lors de l\'inscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <LiveRegion message={statusMessage} politeness="assertive" />

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[46%] relative flex-col justify-between p-12 bg-navy overflow-hidden">
        {/* Decorative blobs */}
        <div
          className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-10 animate-blob"
          style={{ background: 'var(--color-royal-blue)' }}
        />
        <div
          className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full opacity-10 animate-blob animation-delay-2000"
          style={{ background: 'var(--color-vibrant-orange)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <img src={logo_url} alt="Tuma Plus" className="h-14 w-auto object-contain" />
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <div className="max-w-sm">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: 'rgba(249,115,22,0.15)',
                color: 'var(--color-vibrant-orange)',
                border: '1px solid rgba(249,115,22,0.25)',
              }}
            >
              <Package className="w-3.5 h-3.5" />
              LePaysExpressColis
            </div>

            <h1
              className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: 'Prompt, sans-serif' }}
            >
              Rejoignez notre{' '}
              <span style={{ color: 'var(--color-vibrant-orange)' }}>communauté</span>{' '}
              de confiance
            </h1>

            <p className="text-slate-400 text-base leading-relaxed mb-10">
              Inscrivez-vous gratuitement et commencez à envoyer ou transporter des colis entre la Russie et l'Afrique.
            </p>

            <div className="space-y-4">
              {TRUST_BULLETS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(37,99,235,0.15)',
                      border: '1px solid rgba(37,99,235,0.25)',
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: 'var(--color-ocean-blue)' }} />
                  </div>
                  <span className="text-slate-300 text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-slate-500 text-xs">
            © 2026 LePaysExpressColis · Livraison sûre &amp; abordable
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-6 py-10 bg-white overflow-y-auto relative">
        {/* Back to home */}
        <Link
          href="/"
          className="absolute top-6 right-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
          </svg>
          Accueil
        </Link>

        {/* Mobile logo */}
        <div className="lg:hidden mb-6">
          <img src={logo_url} alt="Tuma Plus" className="h-12 w-auto object-contain mx-auto" />
        </div>

        <div className="w-full max-w-[440px]">
          {/* Heading */}
          <div className="mb-7">
            <h2
              className="text-3xl font-bold text-navy mb-1"
              style={{ fontFamily: 'Prompt, sans-serif' }}
            >
              Créer un compte
            </h2>
            <p className="text-body-text text-sm">
              C'est gratuit et ça prend moins de 2 minutes
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Global error */}
            {error && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#dc2626',
                }}
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Input
              type="text"
              label="Nom complet"
              placeholder="Jean Dupont"
              autoComplete="name"
              error={errors.name?.message || fieldErrors.name}
              {...register('name')}
            />

            <Input
              type="email"
              label="Adresse email"
              placeholder="votre@email.com"
              autoComplete="email"
              error={errors.email?.message || fieldErrors.email}
              {...register('email')}
            />

            {/* Country select */}
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium mb-1"
                style={{ color: '#374151' }}
              >
                Pays
              </label>
              <div className="relative">
                <select
                  id="country"
                  className="w-full appearance-none px-4 py-3 pr-10 min-h-[44px] rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 bg-white"
                  style={{
                    borderColor: errors.country || fieldErrors.country ? '#ef4444' : '#d1d5db',
                    color: '#111827',
                  }}
                  {...register('country')}
                >
                  <option value="">{isLoadingCountries ? 'Chargement...' : 'Sélectionner un pays'}</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: '#6b7280' }}
                />
              </div>
              {(errors.country || fieldErrors.country) && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.country?.message || fieldErrors.country}
                </p>
              )}
            </div>

            <Input
              type="tel"
              label="Numéro de téléphone"
              placeholder={country ? getPhonePlaceholder(country) : 'Sélectionnez un pays d\'abord'}
              autoComplete="tel"
              error={errors.phone?.message || fieldErrors.phone}
              helperText={country ? getPhoneHelperText(country) : 'Sélectionnez un pays pour voir le format'}
              {...register('phone')}
            />

            <Input
              type="password"
              label="Mot de passe"
              placeholder="Créer un mot de passe"
              autoComplete="new-password"
              error={errors.password?.message || fieldErrors.password}
              showPasswordToggle
              {...register('password')}
            />

            <Input
              type="password"
              label="Confirmer le mot de passe"
              placeholder="Confirmer votre mot de passe"
              autoComplete="new-password"
              error={errors.confirmPassword?.message || fieldErrors.password_confirmation}
              showPasswordToggle
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              loading={isSubmitting}
              className="!bg-vibrant-orange hover:!bg-warm-orange !text-white font-semibold !rounded-xl shadow-lg mt-2"
              style={{ boxShadow: '0 8px 24px rgba(249,115,22,0.28)' }}
            >
              {isSubmitting ? 'Création du compte…' : 'Créer mon compte'}
            </Button>

            <p className="text-center text-xs text-muted-text pt-1">
              En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            </p>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-light-border" />
            <span className="text-xs text-muted-text">ou</span>
            <div className="flex-1 h-px bg-light-border" />
          </div>

          <p className="text-center text-sm text-body-text">
            Déjà un compte ?{' '}
            <Link
              href="/auth/login"
              className="font-semibold hover:underline"
              style={{ color: 'var(--color-royal-blue)' }}
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
