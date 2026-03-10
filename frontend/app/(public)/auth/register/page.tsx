'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { ApiError } from '@/lib/api/client';
import { formatPhoneToE164, getPhonePlaceholder, getPhoneHelperText } from '@/lib/utils/phoneFormatter';
import Link from 'next/link';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
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
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
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

    try {
      // Detect user's locale from browser or default to 'fr'
      const userLocale = navigator.language.startsWith('fr') ? 'fr' : 'en';
      
      // Format phone number to E.164 based on selected country
      const formattedPhone = formatPhoneToE164(data.phone, data.country);
      
      await registerUser({
        name: data.name,
        email: data.email,
        phone: formattedPhone, // Use formatted phone
        country: data.country,
        password: data.password,
        password_confirmation: data.confirmPassword,
        locale: userLocale,
      });
      router.push('/dashboard');
    } catch (err) {
      // Handle API errors with field-level validation
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        const fieldErrs = ErrorHandler.handleValidationErrors(err.errors);
        setFieldErrors(fieldErrs);
        setError('Please correct the errors below.');
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join our community today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Input
            type="text"
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message || fieldErrors.name}
            {...register('name')}
          />

          <Input
            type="email"
            label="Email"
            placeholder="your@email.com"
            error={errors.email?.message || fieldErrors.email}
            {...register('email')}
          />

          <Input
            type="tel"
            label="Phone Number"
            placeholder={country ? getPhonePlaceholder(country) : 'Select country first'}
            error={errors.phone?.message || fieldErrors.phone}
            {...register('phone')}
            helperText={country ? getPhoneHelperText(country) : 'Select a country to see format'}
          />

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              id="country"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('country')}
            >
              <option value="">Select a country</option>
              <option value="FR">France</option>
              <option value="CI">Côte d'Ivoire</option>
              <option value="SN">Senegal</option>
              <option value="ML">Mali</option>
              <option value="BF">Burkina Faso</option>
              <option value="BJ">Benin</option>
              <option value="TG">Togo</option>
              <option value="NE">Niger</option>
              <option value="GN">Guinea</option>
              <option value="CM">Cameroon</option>
            </select>
            {(errors.country || fieldErrors.country) && (
              <p className="mt-1 text-sm text-red-600">
                {errors.country?.message || fieldErrors.country}
              </p>
            )}
          </div>

          <Input
            type="password"
            label="Password"
            placeholder="Create a password"
            error={errors.password?.message || fieldErrors.password}
            {...register('password')}
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
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
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
