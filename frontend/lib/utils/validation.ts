/**
 * Client-side validation utilities using Zod schemas
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Phone validation (international format)
export const phoneSchema = z
  .string()
  .min(8, 'Phone number must be at least 8 characters')
  .regex(/^[+]?[\d\s\-()]+$/, 'Invalid phone number format');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// URL validation
export const urlSchema = z.string().url('Invalid URL');

// Positive number validation
export const positiveNumberSchema = z.number().positive('Must be a positive number');

// Non-negative number validation
export const nonNegativeNumberSchema = z.number().min(0, 'Must be zero or positive');

/**
 * Authentication schemas
 */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    password_confirmation: z.string(),
    country: z.string().min(2, 'Country is required'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

/**
 * Profile schemas
 */

export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: phoneSchema.optional(),
  country: z.string().min(2, 'Country is required').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

/**
 * Trip schemas
 */

export const tripSchema = z
  .object({
    departure_country: z.string().min(2, 'Departure country is required'),
    departure_city: z.string().min(2, 'Departure city is required'),
    departure_date: z.string().refine(
      (date) => {
        const departureDate = new Date(date);
        return departureDate > new Date();
      },
      { message: 'Departure date must be in the future' }
    ),
    arrival_country: z.string().min(2, 'Arrival country is required'),
    arrival_city: z.string().min(2, 'Arrival city is required'),
    arrival_date: z.string(),
    available_weight: positiveNumberSchema,
    price_per_kg: positiveNumberSchema,
    package_types: z.array(z.string()).min(1, 'Select at least one package type'),
  })
  .refine(
    (data) => {
      const departure = new Date(data.departure_date);
      const arrival = new Date(data.arrival_date);
      return arrival > departure;
    },
    {
      message: 'Arrival date must be after departure date',
      path: ['arrival_date'],
    }
  );

/**
 * Shipment schemas
 */

export const shipmentSchema = z.object({
  pickup_country: z.string().min(2, 'Pickup country is required'),
  pickup_city: z.string().min(2, 'Pickup city is required'),
  pickup_address: z.string().min(5, 'Pickup address is required'),
  delivery_country: z.string().min(2, 'Delivery country is required'),
  delivery_city: z.string().min(2, 'Delivery city is required'),
  delivery_address: z.string().min(5, 'Delivery address is required'),
  recipient_name: z.string().min(2, 'Recipient name is required'),
  recipient_phone: phoneSchema,
  package_type: z.string().min(1, 'Package type is required'),
  weight: positiveNumberSchema,
  description: z.string().min(10, 'Description must be at least 10 characters'),
  value: positiveNumberSchema,
});

/**
 * Message schemas
 */

export const messageSchema = z.object({
  recipient_id: z.string().uuid('Invalid recipient'),
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message is too long'),
  shipment_id: z.string().uuid().optional(),
});

/**
 * Rating schemas
 */

export const ratingSchema = z
  .object({
    shipment_id: z.string().uuid('Invalid shipment'),
    score: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    comment: z.string().max(500, 'Comment is too long').optional(),
  })
  .refine(
    (data) => {
      // Require comment for ratings below 3
      if (data.score < 3) {
        return data.comment && data.comment.length > 0;
      }
      return true;
    },
    {
      message: 'Comment is required for ratings below 3 stars',
      path: ['comment'],
    }
  );

/**
 * Withdrawal schemas
 */

export const withdrawalSchema = z.object({
  amount: z
    .number()
    .min(10, 'Minimum withdrawal amount is 10 EUR')
    .refine((amount) => amount > 0, 'Amount must be positive'),
  payment_method: z.string().min(1, 'Payment method is required'),
  payment_details: z.record(z.any()),
});

/**
 * KYC schemas
 */

export const kycDocumentSchema = z.object({
  document_type: z.enum(['passport', 'id_card', 'driver_license', 'proof_of_address'], {
    errorMap: () => ({ message: 'Invalid document type' }),
  }),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type),
      'File must be JPEG, PNG, or PDF'
    ),
});

/**
 * File upload schemas
 */

export const fileUploadSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB')
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type),
    'File must be an image (JPEG or PNG)'
  );

/**
 * Search schemas
 */

export const tripSearchSchema = z.object({
  departure_country: z.string().optional(),
  departure_city: z.string().optional(),
  arrival_country: z.string().optional(),
  arrival_city: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  min_capacity: z.number().optional(),
});

/**
 * Helper function to validate data against a schema
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validation result with errors
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Convert Zod errors to field-level errors
  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });

  return { success: false, errors };
}

/**
 * Helper function to validate a single field
 * @param schema - Zod schema
 * @param value - Value to validate
 * @returns Error message or null
 */
export function validateField<T>(schema: z.ZodSchema<T>, value: unknown): string | null {
  const result = schema.safeParse(value);
  if (result.success) return null;
  return result.error.errors[0]?.message || 'Invalid value';
}
