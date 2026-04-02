'use client';

import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthErrorMessageProps {
  message?: string;
}

export default function AuthErrorMessage({ 
  message = "Votre session a expiré. Veuillez vous reconnecter." 
}: AuthErrorMessageProps) {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/auth/login?redirect=/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Authentification requise
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Se reconnecter
        </button>
      </div>
    </div>
  );
}
