'use client';

import { useState } from 'react';
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
  ArrowLeft,
} from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { logo_url } = usePlatformBranding();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    setStatusMessage('Envoi en cours...');

    try {
      await apiClient.post('/api/auth/forgot-password', data);
      setSuccess(true);
      setStatusMessage('Email envoyé avec succès');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue. Veuillez réessayer.'
      );
      setStatusMessage('Erreur lors de l\'envoi');
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
              Récupérez votre{' '}
              <span style={{ color: 'var(--color-vibrant-orange)' }}>
                compte
              </span>
            </h1>

            <p className="text-slate-400 text-base leading-relaxed">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
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
        {/* Back to login */}
        <Link
          href="/auth/login"
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
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
              Mot de passe oublié ?
            </h2>
            <p className="text-body-text text-sm">
              Pas de souci, nous allons vous aider à le réinitialiser
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
                  <p className="font-semibold mb-1">Email envoyé !</p>
                  <p className="text-xs">
                    Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.
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
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              aria-label="Formulaire de récupération de mot de passe"
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
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting}
                loading={isSubmitting}
                aria-label={isSubmitting ? 'Envoi en cours…' : 'Envoyer le lien'}
                className="mt-2 !bg-vibrant-orange hover:!bg-warm-orange !text-white font-semibold !rounded-xl shadow-lg"
                style={{ boxShadow: '0 8px 24px rgba(249,115,22,0.28)' }}
              >
                {isSubmitting ? 'Envoi…' : 'Envoyer le lien'}
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
            Vous vous souvenez de votre mot de passe ?{' '}
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
