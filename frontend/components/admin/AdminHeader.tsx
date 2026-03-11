'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Clock, AlertTriangle } from 'lucide-react';

interface AdminHeaderProps {
  userName: string;
  userRole: 'admin' | 'super_admin';
  sessionExpiresAt?: string; // ISO 8601 datetime (optional)
  onLogout: () => void;
}

export default function AdminHeader({
  userName,
  userRole,
  sessionExpiresAt,
  onLogout
}: AdminHeaderProps) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!sessionExpiresAt) return;

    const calculateTimeRemaining = () => {
      const expiresAt = new Date(sessionExpiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

      setTimeRemaining(remaining);

      // Show warning when 5 minutes or less remaining
      if (remaining <= 300 && remaining > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }

      // Auto logout when session expires
      if (remaining === 0) {
        onLogout();
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiresAt, onLogout]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    onLogout();
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Left side - Logo and breadcrumb will be here */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Admin Dashboard
        </h1>
      </div>

      {/* Right side - Session timer and user menu */}
      <div className="flex items-center space-x-4">
        {/* Session timer */}
        <div 
          className={`
            flex items-center space-x-2 px-3 py-1.5 rounded-lg
            ${showWarning 
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
              : 'bg-gray-50 text-gray-700'
            }
          `}
          title="Session expires in"
        >
          {showWarning ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-medium">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">
                {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {userRole === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/admin/profile');
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </button>

                <div className="border-t border-gray-200 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Session expiration warning modal */}
      {showWarning && timeRemaining <= 60 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Session Expiring Soon
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your session will expire in {formatTime(timeRemaining)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Please save your work. You will be automatically logged out when the session expires.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Extend Session
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
