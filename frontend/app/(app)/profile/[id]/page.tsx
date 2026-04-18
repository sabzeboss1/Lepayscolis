'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { User, Mail, Phone, MapPin, Calendar, Package, Plane, Star, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  rating: number;
  completed_deliveries: number;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const fetchUser = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      const response = await fetch(`${backendUrl}/api/users/${params.id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data || data);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Utilisateur introuvable</h2>
          <Button onClick={() => router.back()}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-blue-600">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-1">{user.name || 'Utilisateur'}</h1>
                <div className="flex items-center gap-2">
                  <RatingStars rating={user.rating || 0} size="md" />
                  <span className="text-white/90 text-sm">
                    {Number(user.rating || 0).toFixed(1)} · {user.completed_deliveries || 0} expéditions
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.email && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium text-slate-900">{user.email}</p>
                  </div>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Téléphone</p>
                    <p className="text-sm font-medium text-slate-900">{user.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Membre depuis</p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Package className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Expéditions complétées</p>
                  <p className="text-sm font-medium text-slate-900">{user.completed_deliveries || 0}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {/* Temporairement masqué - Chat désactivé
              <Button variant="primary" onClick={() => router.push(`/messages?user=${user.id}`)}>
                <Mail className="w-4 h-4 mr-2" />
                Contacter
              </Button>
              */}
              <Button variant="outline" onClick={() => router.back()}>
                Retour
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
