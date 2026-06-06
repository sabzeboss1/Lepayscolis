/**
 * API Error class for handling HTTP errors
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public errors?: Record<string, string[]>,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Configuration interface for API Client
 */
interface ApiClientConfig {
  baseUrl: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
}

/**
 * Request configuration interface
 */
interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: Record<string, any>;
  signal?: AbortSignal;
}

/**
 * API Client for communicating with Laravel backend
 * Implements retry logic, authentication, CORS, and error handling
 */
export class ApiClient {
  private config: ApiClientConfig;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      maxRetries: config?.maxRetries ?? 3,
      retryDelay: config?.retryDelay ?? 1000,
      timeout: config?.timeout ?? 30000,
    };
  }

  /**
   * Get the base URL of the API
   */
  get baseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Get authentication token from cookies (single token for all roles)
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
    if (!authCookie) return null;
    
    const token = authCookie.split('=')[1];
    // Decode URL-encoded token if necessary
    return token ? decodeURIComponent(token) : null;
  }

  /**
   * Get CSRF token from cookies
   */
  private getCSRFToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(c => c.trim().startsWith('XSRF-TOKEN='));
    return csrfCookie ? decodeURIComponent(csrfCookie.split('=')[1]) : null;
  }

  /**
   * Get user's preferred locale from localStorage
   */
  private getLocale(): string {
    if (typeof window === 'undefined') return 'fr';
    return localStorage.getItem('lepaysexpresscolis-locale') || 'fr';
  }

  /**
   * Add authentication and required headers to request
   */
  private addHeaders(headers: Record<string, string> = {}, isStateChanging: boolean = false, skipCSRF: boolean = false): Record<string, string> {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': this.getLocale(),
      ...headers,
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing operations (skip for admin routes using Bearer tokens)
    if (isStateChanging && !skipCSRF) {
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        requestHeaders['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    return requestHeaders;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = 'An error occurred';
      let errorCode: string | undefined;
      let errors: Record<string, string[]> | undefined;
      let retryAfter: number | undefined;

      // Handle 429 Too Many Requests
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        if (retryAfterHeader) {
          // Parse Retry-After (can be seconds or HTTP date)
          if (/^\d+$/.test(retryAfterHeader)) {
            retryAfter = parseInt(retryAfterHeader, 10) * 1000;
          } else {
            const retryDate = new Date(retryAfterHeader);
            retryAfter = retryDate.getTime() - Date.now();
          }
        }
      }

      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
        errorCode = error.code;
        errors = error.errors; // Validation errors
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      throw new ApiError(response.status, errorMessage, errorCode, errors, retryAfter);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return {} as T;
  }

  /**
   * Check if error is retryable (network error)
   */
  private isRetryableError(error: any): boolean {
    // Don't retry API errors (4xx, 5xx)
    if (error instanceof ApiError) {
      return false;
    }
    
    // Retry on network errors
    return error instanceof TypeError || error.message?.includes('fetch');
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    fn: () => Promise<Response>,
    retries: number = this.config.maxRetries
  ): Promise<T> {
    try {
      const response = await fn();
      return this.handleResponse<T>(response);
    } catch (error) {
      if (!this.isRetryableError(error) || retries === 0) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = this.config.retryDelay * Math.pow(2, this.config.maxRetries - retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryRequest<T>(fn, retries - 1);
    }
  }

  /**
   * HTTP GET request
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);
    
    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers = this.addHeaders(config?.headers);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      return await this.retryRequest<T>(() =>
        fetch(url.toString(), {
          method: 'GET',
          headers,
          credentials: 'include', // CORS with credentials
          signal: config?.signal || controller.signal,
        })
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * HTTP POST request
   */
  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);
    // Skip CSRF for admin routes (they use Bearer token authentication)
    const skipCSRF = endpoint.includes('/admin/');
    const headers = this.addHeaders(config?.headers, true, skipCSRF);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      return await this.retryRequest<T>(() =>
        fetch(url.toString(), {
          method: 'POST',
          headers,
          credentials: 'include',
          body: data ? JSON.stringify(data) : undefined,
          signal: config?.signal || controller.signal,
        })
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * HTTP PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);
    const skipCSRF = endpoint.includes('/admin/');
    const headers = this.addHeaders(config?.headers, true, skipCSRF);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      return await this.retryRequest<T>(() =>
        fetch(url.toString(), {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: data ? JSON.stringify(data) : undefined,
          signal: config?.signal || controller.signal,
        })
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * HTTP PATCH request
   */
  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);
    const skipCSRF = endpoint.includes('/admin/');
    const headers = this.addHeaders(config?.headers, true, skipCSRF);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      return await this.retryRequest<T>(() =>
        fetch(url.toString(), {
          method: 'PATCH',
          headers,
          credentials: 'include',
          body: data ? JSON.stringify(data) : undefined,
          signal: config?.signal || controller.signal,
        })
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * HTTP DELETE request
   */
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);

    if (config?.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const skipCSRF = endpoint.includes('/admin/');
    const headers = this.addHeaders(config?.headers, true, skipCSRF);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      return await this.retryRequest<T>(() =>
        fetch(url.toString(), {
          method: 'DELETE',
          headers,
          credentials: 'include',
          body: config?.body ? JSON.stringify(config.body) : undefined,
          signal: config?.signal || controller.signal,
        })
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Upload single file with progress tracking
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    onProgress?: (progress: number) => void,
    fieldName = 'file'
  ): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);
    const formData = new FormData();
    formData.append(fieldName, file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText as any);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new ApiError(xhr.status, error.message || 'Upload failed', error.code, error.errors));
          } catch {
            reject(new ApiError(xhr.status, 'Upload failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', url.toString());
      xhr.setRequestHeader('Accept', 'application/json');
      
      // Add auth headers
      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        xhr.setRequestHeader('X-XSRF-TOKEN', csrfToken);
      }

      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files with progress tracking
   */
  async uploadMultipleFiles<T>(
    endpoint: string,
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText as any);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new ApiError(xhr.status, error.message || 'Upload failed', error.code, error.errors));
          } catch {
            reject(new ApiError(xhr.status, 'Upload failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', url.toString());
      xhr.setRequestHeader('Accept', 'application/json');
      
      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        xhr.setRequestHeader('X-XSRF-TOKEN', csrfToken);
      }

      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  /**
   * Upload branding asset (logo or favicon) with type parameter
   */
  async uploadBrandingAsset<T>(
    endpoint: string,
    file: File,
    type: 'logo' | 'favicon',
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText as any);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new ApiError(xhr.status, error.message || 'Upload failed', error.code, error.errors));
          } catch {
            reject(new ApiError(xhr.status, 'Upload failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', url.toString());
      xhr.setRequestHeader('Accept', 'application/json');
      
      const token = this.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      const csrfToken = this.getCSRFToken();
      if (csrfToken) {
        xhr.setRequestHeader('X-XSRF-TOKEN', csrfToken);
      }

      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }
}

// Export singleton instance configured with environment variables
export const apiClient = new ApiClient();
