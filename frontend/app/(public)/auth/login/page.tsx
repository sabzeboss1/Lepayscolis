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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

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
    setStatusMessage('Signing in...');

    try {
      const user = await login(data.email, data.password);
      setStatusMessage('Login successful! Redirecting...');

      // Role-based redirect
      const redirectTo = searchParams.get('redirect');
      if (redirectTo) {
        router.push(redirectTo);
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      // Handle API errors with field-level validation
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        const fieldErrs = ErrorHandler.handleValidationErrors(err.errors);
        setFieldErrors(fieldErrs);
        setError('Please correct the errors below.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
        setError(errorMessage);
      }
      setStatusMessage(`Error: ${error || 'Login failed'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <LiveRegion message={statusMessage} politeness="assertive" />
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-label="Login form">
          {error && (
            <div 
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <Input
            type="email"
            label="Email"
            placeholder="your@email.com"
            error={errors.email?.message || fieldErrors.email}
            {...register('email')}
          />

          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            error={errors.password?.message || fieldErrors.password}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            loading={isSubmitting}
            aria-label={isSubmitting ? 'Signing in, please wait' : 'Sign in to your account'}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
