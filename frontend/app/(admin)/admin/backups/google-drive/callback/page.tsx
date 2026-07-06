'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export default function GoogleDriveCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setStatus('error');
      setErrorMessage('Aucun code d\'autorisation reçu de Google.');
      return;
    }

    (async () => {
      try {
        await apiClient.post(API_ENDPOINTS.admin.backups.googleDriveCallback, { code });
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err?.response?.data?.message || 'Erreur lors de l\'échange du code OAuth.');
      }
    })();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-600">Connexion à Google Drive en cours...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-lg font-semibold text-gray-900">Google Drive connecté</h2>
            <p className="text-gray-600">Le compte Google Drive a été lié avec succès.</p>
            <Link
              href="/admin/backups"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retour aux sauvegardes
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h2 className="text-lg font-semibold text-gray-900">Erreur de connexion</h2>
            <p className="text-red-600 text-sm">{errorMessage}</p>
            <Link
              href="/admin/backups"
              className="inline-block mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Retour aux sauvegardes
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
