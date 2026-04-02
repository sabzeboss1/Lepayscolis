'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function AuthDebug() {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [cookie, setCookie] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCookie(document.cookie);
      const authCookie = document.cookie.split(';').find(c => c.trim().startsWith('auth-token='));
      setToken(authCookie ? authCookie.split('=')[1] : 'NO TOKEN');
    }
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🔍 Auth Debug</h3>
      <div className="space-y-1">
        <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
        <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
        <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
        <div><strong>User:</strong> {user ? `${user.name} (${user.role})` : 'None'}</div>
        <div><strong>Token:</strong> {token.substring(0, 20)}...</div>
        <div className="pt-2 border-t border-gray-600">
          <strong>All Cookies:</strong>
          <div className="text-[10px] break-all">{cookie || 'No cookies'}</div>
        </div>
      </div>
    </div>
  );
}
