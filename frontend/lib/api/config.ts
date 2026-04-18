/**
 * API Configuration
 * Provides backend URL and other API-related configuration
 */

/**
 * Get the backend API URL
 * Uses environment variable or defaults to localhost
 */
export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

/**
 * Get the full API endpoint URL
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getBackendUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

/**
 * API Configuration object
 */
export const apiConfig = {
  baseUrl: getBackendUrl(),
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
} as const;
