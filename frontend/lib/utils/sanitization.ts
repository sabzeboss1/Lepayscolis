/**
 * Input sanitization utilities to prevent XSS attacks
 */

/**
 * Sanitize HTML content using DOMPurify
 * Note: DOMPurify should be installed: npm install dompurify @types/dompurify
 */
let DOMPurify: any = null;

// Dynamically import DOMPurify only on client side
if (typeof window !== 'undefined') {
  // @ts-ignore - dompurify is an optional dependency
  import('dompurify').then((module: any) => {
    DOMPurify = module.default;
  });
}

/**
 * Sanitize HTML content to prevent XSS
 * @param html - HTML string to sanitize
 * @param options - DOMPurify configuration options
 */
export function sanitizeHtml(html: string, options?: any): string {
  if (!DOMPurify) {
    // Fallback: strip all HTML tags if DOMPurify not loaded
    return html.replace(/<[^>]*>/g, '');
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ...options,
  });
}

/**
 * Sanitize plain text input by escaping HTML entities
 * @param text - Text to sanitize
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * @param url - URL to sanitize
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return '';
  }

  return url;
}

/**
 * Sanitize email address
 * @param email - Email to sanitize
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';

  // Remove any HTML tags and trim
  return email.replace(/<[^>]*>/g, '').trim().toLowerCase();
}

/**
 * Sanitize phone number (remove non-numeric characters except +)
 * @param phone - Phone number to sanitize
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';

  // Keep only digits, +, spaces, hyphens, and parentheses
  return phone.replace(/[^\d+\s\-()]/g, '');
}

/**
 * Sanitize numeric input
 * @param value - Value to sanitize
 */
export function sanitizeNumber(value: string | number): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;

  const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Sanitize object by applying sanitization to all string values
 * @param obj - Object to sanitize
 * @param options - Sanitization options
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    htmlFields?: string[];
    urlFields?: string[];
    emailFields?: string[];
    phoneFields?: string[];
    skipFields?: string[];
  } = {}
): T {
  const {
    htmlFields = [],
    urlFields = [],
    emailFields = [],
    phoneFields = [],
    skipFields = [],
  } = options;

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip specified fields
    if (skipFields.includes(key)) {
      sanitized[key] = value;
      continue;
    }

    // Apply specific sanitization based on field type
    if (htmlFields.includes(key) && typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (urlFields.includes(key) && typeof value === 'string') {
      sanitized[key] = sanitizeUrl(value);
    } else if (emailFields.includes(key) && typeof value === 'string') {
      sanitized[key] = sanitizeEmail(value);
    } else if (phoneFields.includes(key) && typeof value === 'string') {
      sanitized[key] = sanitizePhone(value);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value, options);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Sanitize form data before sending to API
 * @param formData - Form data to sanitize
 */
export function sanitizeFormData(formData: Record<string, any>): Record<string, any> {
  return sanitizeObject(formData, {
    htmlFields: ['description', 'comment', 'message', 'content', 'bio', 'notes'],
    urlFields: ['website', 'avatar_url', 'photo_url'],
    emailFields: ['email', 'recipient_email'],
    phoneFields: ['phone', 'recipient_phone', 'contact_phone'],
    skipFields: ['password', 'password_confirmation', 'token'],
  });
}

/**
 * Strip all HTML tags from text
 * @param html - HTML string
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add if truncated
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - suffix.length) + suffix;
}
