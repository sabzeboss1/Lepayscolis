'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LiveRegion } from '@/components/ui/LiveRegion';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { ApiError } from '@/lib/api/client';
import Link from 'next/link';
import {
  Plane,
  ShieldCheck,
  Star,
  Package,
  AlertCircle,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const TRUST_BULLETS = [
  { icon: ShieldCheck, text: 'Voyageurs vérifiés et assurés' },
  { icon: Plane, text: 'Livraison Russie ↔ Afrique' },
  { icon: Star, text: 'Économisez jusqu\'à 70% sur vos envois' },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
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
    setStatusMessage('Connexion en cours...');

    try {
      const user = await login(data.email, data.password);
      setStatusMessage('Connexion réussie ! Redirection...');

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
        setError('Veuillez corriger les erreurs ci-dessous.');
      } else {
        const errorMessage =
          err instanceof Error ? err.message : 'Connexion échouée. Veuillez réessayer.';
        setError(errorMessage);
      }
      setStatusMessage('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <LiveRegion message={statusMessage} politeness="assertive" />

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 bg-navy overflow-hidden">
        {/* Decorative blobs */}
        <div
          className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-10 animate-blob"
          style={{ background: 'var(--color-royal-blue)' }}
        />
        <div
          className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full opacity-10 animate-blob animation-delay-2000"
          style={{ background: 'var(--color-vibrant-orange)' }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full opacity-5 animate-blob animation-delay-4000"
          style={{ background: 'var(--color-ocean-blue)' }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <img src="/logo.png" alt="Tuma Plus" className="h-14 w-auto object-contain" />
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
              Envoyez vos colis{' '}
              <span style={{ color: 'var(--color-vibrant-orange)' }}>
                partout
              </span>{' '}
              en toute confiance
            </h1>

            <p className="text-slate-400 text-base leading-relaxed mb-10">
              Connectez-vous avec des voyageurs de confiance pour une livraison
              rapide, sûre et économique entre la Russie et l'Afrique.
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

        {/* Bottom tagline */}
        <div className="relative z-10">
          <p className="text-slate-500 text-xs">
            © 2026 LePaysExpressColis · Livraison sûre &amp; abordable
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white relative">
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
        <div className="lg:hidden mb-8">
          <img src="/logo.png" alt="Tuma Plus" className="h-12 w-auto object-contain mx-auto" />
        </div>

        <div className="w-full max-w-[400px]">
          {/* Heading */}
          <div className="mb-8">
            <h2
              className="text-3xl font-bold text-navy mb-1"
              style={{ fontFamily: 'Prompt, sans-serif' }}
            >
              Bienvenue !
            </h2>
            <p className="text-body-text text-sm">
              Connectez-vous à votre compte pour continuer
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            aria-label="Formulaire de connexion"
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
                aria-live="assertive"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <Input
              type="email"
              label="Adresse email"
              placeholder="votre@email.com"
              autoComplete="email"
              error={errors.email?.message || fieldErrors.email}
              {...register('email')}
            />

            <div>
              <Input
                type="password"
                label="Mot de passe"
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                error={errors.password?.message || fieldErrors.password}
                {...register('password')}
              />
              <div className="flex justify-end mt-1.5">
                <span className="text-xs text-body-text cursor-not-allowed opacity-60">
                  Mot de passe oublié ?
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              loading={isSubmitting}
              aria-label={isSubmitting ? 'Connexion en cours…' : 'Se connecter'}
              className="mt-2 !bg-vibrant-orange hover:!bg-warm-orange !text-white font-semibold !rounded-xl shadow-lg"
              style={{ boxShadow: '0 8px 24px rgba(249,115,22,0.28)' }}
            >
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-light-border" />
            <span className="text-xs text-muted-text">ou</span>
            <div className="flex-1 h-px bg-light-border" />
          </div>

          <p className="text-center text-sm text-body-text">
            Pas encore de compte ?{' '}
            <Link
              href="/auth/register"
              className="font-semibold hover:underline"
              style={{ color: 'var(--color-royal-blue)' }}
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
