'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LiveRegion } from '@/components/ui/LiveRegion';
import Link from 'next/link';
import { usePlatformBranding } from '@/lib/hooks/usePlatformBranding';
import { apiClient } from '@/lib/api/client';
import {
  Package,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const resetPasswordSchema = z.object({
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

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logo_url } = usePlatformBranding();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (!tokenParam || !emailParam) {
      setError('Lien invalide ou expiré. Veuillez demander un nouveau lien.');
    } else {
      setToken(tokenParam);
      setEmail(emailParam);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token || !email) {
      setError('Lien invalide. Veuillez demander un nouveau lien.');
      return;
    }

    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    setStatusMessage('Réinitialisation en cours...');

    try {
      await apiClient.post('/auth/reset-password', {
        email,
        token,
        password: data.password,
        password_confirmation: data.confirmPassword,
      });
      setSuccess(true);
      setStatusMessage('Mot de passe réinitialisé avec succès');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue. Le lien est peut-être expiré.'
      );
      setStatusMessage('Erreur lors de la réinitialisation');
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
              Nouveau{' '}
              <span style={{ color: 'var(--color-vibrant-orange)' }}>
                mot de passe
              </span>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed">
              Choisissez un nouveau mot de passe sécurisé pour votre compte.
            </p>
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
          <img src={logo_url} alt="Tuma Plus" className="h-12 w-auto object-contain mx-auto" />
        </div>

        <div className="w-full max-w-[400px]">
          {/* Heading */}
          <div className="mb-8">
            <h2
              className="text-3xl font-bold text-navy mb-1"
              style={{ fontFamily: 'Prompt, sans-serif' }}
            >
              Réinitialiser le mot de passe
            </h2>
            <p className="text-body-text text-sm">
              Créez un nouveau mot de passe sécurisé
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div
                className="flex items-start gap-3 px-4 py-4 rounded-xl text-sm"
                style={{
                  background: 'rgba(34,197,94,0.06)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  color: '#16a34a',
                }}
                role="alert"
              >
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Mot de passe réinitialisé !</p>
                  <p className="text-xs">
                    Votre mot de passe a été modifié avec succès. Redirection vers la page de connexion...
                  </p>
                </div>
              </div>

              <Link href="/auth/login">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="!bg-vibrant-orange hover:!bg-warm-orange !text-white font-semibold !rounded-xl shadow-lg"
                  style={{ boxShadow: '0 8px 24px rgba(249,115,22,0.28)' }}
                >
                  Se connecter
                </Button>
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              aria-label="Formulaire de réinitialisation de mot de passe"
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

              {email && (
                <div className="text-sm text-gray-600">
                  Réinitialisation pour : <span className="font-semibold">{email}</span>
                </div>
              )}

              <Input
                type="password"
                label="Nouveau mot de passe"
                placeholder="Créer un mot de passe"
                autoComplete="new-password"
                error={errors.password?.message}
                showPasswordToggle
                {...register('password')}
              />

              <Input
                type="password"
                label="Confirmer le mot de passe"
                placeholder="Confirmer votre mot de passe"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                showPasswordToggle
                {...register('confirmPassword')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting || !token || !email}
                loading={isSubmitting}
                aria-label={isSubmitting ? 'Réinitialisation en cours…' : 'Réinitialiser le mot de passe'}
                className="mt-2 !bg-vibrant-orange hover:!bg-warm-orange !text-white font-semibold !rounded-xl shadow-lg"
                style={{ boxShadow: '0 8px 24px rgba(249,115,22,0.28)' }}
              >
                {isSubmitting ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
              </Button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-light-border" />
            <span className="text-xs text-muted-text">ou</span>
            <div className="flex-1 h-px bg-light-border" />
          </div>

          <p className="text-center text-sm text-body-text">
            Retour à la{' '}
            <Link
              href="/auth/login"
              className="font-semibold hover:underline"
              style={{ color: 'var(--color-royal-blue)' }}
            >
              page de connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
