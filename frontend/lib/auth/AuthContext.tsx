'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  country: string;
  locale?: string; // Optional, will default to 'fr' if not provided
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = !!user && (user.role === 'admin' || user.role === 'super_admin');

  // Check for existing auth token on mount and verify session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getCookie('auth-token');
        if (token) {
          // Fetch user data from backend to verify token
          const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.auth.me);
          setUser(response.user);
        }
      } catch (error) {
        // Token invalid or expired, clear it
        if (ErrorHandler.isAuthError(error)) {
          deleteCookie('auth-token');
        }
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login with email and password
   * Implements Sanctum authentication flow:
   * 1. Get CSRF cookie
   * 2. Send login request with credentials
   * 3. Store token and update user state
   */
  const login = async (email: string, password: string): Promise<User> => {
    // Step 1: Get CSRF cookie from Laravel
    await apiClient.get(API_ENDPOINTS.auth.csrf);

    // Step 2: Send login request
    const response = await apiClient.post<{ token: string; user: User }>(
      API_ENDPOINTS.auth.login,
      { email, password }
    );

    // Step 3: Store token in cookie (7 days)
    setCookie('auth-token', response.token, 7);

    // Step 4: Clean up any legacy admin localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }

    // Step 5: Update auth context and return user for role-based redirect
    setUser(response.user);
    return response.user;
  };

  /**
   * Register new user
   * Automatically logs in user after successful registration
   */
  const register = async (data: RegisterData) => {
    await apiClient.get(API_ENDPOINTS.auth.csrf);

    const response = await apiClient.post<{ token: string; user: User }>(
      API_ENDPOINTS.auth.register,
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        password_confirmation: data.password_confirmation,
        country: data.country,
        locale: data.locale || 'fr',
      }
    );

    setCookie('auth-token', response.token, 7);
    setUser(response.user);
  };

  /**
   * Logout user
   * Revokes token on backend and clears local session
   */
  const logout = async () => {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout);
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      deleteCookie('auth-token');
      setUser(null);
      // Clean up any legacy admin localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
  };

  /**
   * Update user profile
   * Updates user data on backend and refreshes local state
   */
  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await apiClient.put<{ user: User }>(
        API_ENDPOINTS.auth.updateProfile,
        data
      );
      
      // Update local user state
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Refresh user data from backend
   * Useful after external updates (e.g., KYC approval)
   */
  const refreshUser = async () => {
    try {
      const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.auth.me);
      setUser(response.user);
    } catch (error) {
      // If refresh fails due to auth error, logout
      if (ErrorHandler.isAuthError(error)) {
        await logout();
      }
      throw error;
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Cookie utility functions
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}
