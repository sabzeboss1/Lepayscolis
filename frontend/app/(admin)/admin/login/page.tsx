'use client';

import React, { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';

interface AdminLoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'super_admin';
  };
  expires_at: string;
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if already logged in on mount - removed to prevent redirect loop
  // The layout will handle authentication checks

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 [1/7] Attempting admin login...');
      console.log('📧 Email:', email);
      console.log('🌐 API Endpoint:', API_ENDPOINTS.admin.login);
      
      // Call real API endpoint for admin login
      const response = await apiClient.post<AdminLoginResponse>(
        API_ENDPOINTS.admin.login,
        { email, password }
      );

      console.log('✅ [2/7] Login response received:', JSON.stringify(response, null, 2));
      console.log('🔑 Token:', response.token ? 'Present' : 'Missing');
      console.log('👤 User:', response.user ? 'Present' : 'Missing');

      // Verify admin role
      if (response.user.role !== 'admin' && response.user.role !== 'super_admin') {
        console.error('❌ Invalid role:', response.user.role);
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      console.log('✅ [3/7] Admin role verified:', response.user.role);

      // Store admin session
      const sessionData = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        expires_at: response.expires_at
      };
      
      console.log('💾 [4/7] Storing session data:', JSON.stringify(sessionData, null, 2));
      
      localStorage.setItem('admin_token', response.token);
      localStorage.setItem('admin_user', JSON.stringify(sessionData));

      console.log('✅ [5/7] Session stored in localStorage');
      console.log('🔍 Verify token in localStorage:', localStorage.getItem('admin_token') ? 'Present' : 'Missing');
      console.log('🔍 Verify user in localStorage:', localStorage.getItem('admin_user') ? 'Present' : 'Missing');
      
      // Wait a moment for localStorage to fully sync before redirecting
      // This prevents race conditions where the layout checks before data is available
      await new Promise(resolve => setTimeout(resolve, 150));
      
      console.log('🔄 [6/7] Redirecting to dashboard using window.location.href...');

      // Redirect to dashboard using window.location.href for reliable navigation
      // This ensures a full page reload with the new auth state
      window.location.href = '/admin/dashboard';
      
      console.log('✅ [7/7] Redirect initiated');
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('❌ Error type:', err?.constructor?.name);
      console.error('❌ Error details:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      
      if (err instanceof ApiError) {
        // Handle specific API errors
        if (err.status === 401) {
          setError('Invalid email or password');
        } else if (err.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else if (err.errors) {
          // Validation errors
          const firstError = Object.values(err.errors)[0];
          setError(firstError ? firstError[0] : 'Validation failed');
        } else {
          setError(err.message || 'An error occurred. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      console.log('🏁 Finally block - setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Sign in to access the admin panel
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="bg-gray-50 rounded p-3">
                <p className="font-medium text-gray-700 mb-1">Admin:</p>
                <p className="font-mono text-xs">admin@lepaysexpresscolis.com</p>
                <p className="font-mono text-xs">admin123</p>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <p className="font-medium text-gray-700 mb-1">Super Admin:</p>
                <p className="font-mono text-xs">superadmin@lepaysexpresscolis.com</p>
                <p className="font-mono text-xs">super123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            © 2024 Le Pays Express Colis. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
