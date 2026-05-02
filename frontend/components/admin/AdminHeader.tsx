'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { NotificationDropdown } from '@/components/features/NotificationDropdown';

interface AdminHeaderProps {
  userName: string;
  userRole: 'admin' | 'super_admin';
  onLogout: () => void;
}

export default function AdminHeader({
  userName,
  userRole,
  onLogout
}: AdminHeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

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

      {/* Right side - Notifications and user menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationDropdown />

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

    </header>
  );
}
