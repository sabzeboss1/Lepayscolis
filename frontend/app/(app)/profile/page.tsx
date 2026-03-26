'use client';

import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Rating } from '@/lib/types';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldCheck,
  Package,
  Plane,
  Star,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  CreditCard,
  Edit3,
  ChevronRight,
  Zap,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';

interface UserStats {
  totalTrips: number;
  totalShipments: number;
  totalEarnings: number;
  successRate: number;
  responseTime: string;
  memberSince: string;
  earningsThisMonth?: number;
  pendingEarnings?: number;
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoadingRatings, setIsLoadingRatings] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'activity'>('overview');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setIsLoadingRatings(true);
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];

      const [ratingsResponse, statsResponse] = await Promise.allSettled([
        fetch(`/api/users/${user?.id}/ratings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
            'Accept': 'application/json',
          },
          credentials: 'include',
        }),
        fetch('/api/users/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
            'Accept': 'application/json',
          },
          credentials: 'include',
        }),
      ]);

      if (ratingsResponse.status === 'fulfilled' && ratingsResponse.value.ok) {
        const ratingsData = await ratingsResponse.value.json();
        setRatings(ratingsData.ratings || []);
      }

      if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
        const statsData = await statsResponse.value.json();
        setStats({
          totalTrips: statsData.stats.total_trips,
          totalShipments: statsData.stats.total_shipments,
          totalEarnings: statsData.stats.total_earnings,
          successRate: statsData.stats.success_rate,
          responseTime: statsData.stats.response_time,
          memberSince: new Date(statsData.stats.member_since).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
          }),
          earningsThisMonth: statsData.stats.earnings_this_month,
          pendingEarnings: statsData.stats.pending_earnings,
        });
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setIsLoadingRatings(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setIsLoadingActivities(true);
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];

      const response = await fetch('/api/users/activity?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="w-8 h-8 text-orange-200" />
          </div>
          <div className="h-4 bg-gray-200 rounded-full w-48 mx-auto mb-2 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded-full w-32 mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalRatings = ratings.length;
  const ratingBreakdown = {
    5: ratings.filter(r => r.rating === 5).length,
    4: ratings.filter(r => r.rating === 4).length,
    3: ratings.filter(r => r.rating === 3).length,
    2: ratings.filter(r => r.rating === 2).length,
    1: ratings.filter(r => r.rating === 1).length,
  };

  const getKYCInfo = () => {
    switch (user.kyc_status) {
      case 'approved':
        return { icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Identité vérifiée', badge: 'bg-green-100 text-green-700' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Vérification en cours', badge: 'bg-yellow-100 text-yellow-700' };
      case 'rejected':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Document rejeté', badge: 'bg-red-100 text-red-700' };
      default:
        return { icon: Shield, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Non vérifié', badge: 'bg-gray-100 text-gray-600' };
    }
  };

  const kyc = getKYCInfo();
  const KYCIcon = kyc.icon;
  const avatarSrc = user.avatar || `https://i.pravatar.cc/128?u=${user.id}`;

  const TABS = [
    { id: 'overview' as const, label: 'Vue d\'ensemble' },
    { id: 'reviews' as const, label: `Avis (${totalRatings})` },
    { id: 'activity' as const, label: 'Activité' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Hero Banner ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={avatarSrc}
                alt={user.name}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/20 shadow-2xl"
              />
              {user.kyc_status === 'approved' && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Name & rating */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {user.name}
                </h1>
                {user.is_recommended && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    <Award className="w-3 h-3" />
                    Recommandé
                  </span>
                )}
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                <RatingStars rating={Number(user.rating) || 0} size="sm" />
                <span className="text-white/90 font-semibold text-sm">{(Number(user.rating) || 0).toFixed(1)}</span>
                <span className="text-white/50 text-xs">({totalRatings} avis)</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-4 text-white/60 text-xs">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/profile/edit')}
              className="border-white/20 text-white hover:bg-white/10 flex-shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Modifier
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Stat Cards (float up over hero) ────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Plane, label: 'Voyages', value: stats?.totalTrips ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Package, label: 'Colis', value: stats?.totalShipments ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
            { icon: CheckCircle, label: 'Succès', value: `${stats?.successRate ?? 0}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
            { icon: Clock, label: 'Réponse', value: stats?.responseTime ?? 'N/A', color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((s) => {
            const SIcon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <SIcon className={`w-4.5 h-4.5 ${s.color}`} style={{ width: 18, height: 18 }} />
                </div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* ─── KYC Strip ──────────────────────────────────────────────────── */}
        <div className={`${kyc.bg} border ${kyc.border} rounded-2xl p-4 flex items-center gap-4`}>
          <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <KYCIcon className={`w-5 h-5 ${kyc.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-800">Vérification d'identité</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${kyc.badge}`}>{kyc.label}</span>
            </div>
            {user.kyc_status === 'approved' && (
              <div className="flex flex-wrap gap-3 mt-1.5">
                {['Identité', 'Document', 'Selfie'].map((item) => (
                  <span key={item} className="flex items-center gap-1 text-xs text-green-700 font-medium">
                    <CheckCircle className="w-3 h-3" /> {item} validé
                  </span>
                ))}
              </div>
            )}
            {user.kyc_status !== 'approved' && (
              <p className="text-xs text-gray-500 mt-0.5">
                {user.kyc_status === 'pending'
                  ? 'Votre document est en cours de vérification (1–2 jours)'
                  : user.kyc_status === 'rejected'
                  ? 'Votre document a été rejeté. Soumettez à nouveau.'
                  : 'Complétez votre vérification pour accéder à toutes les fonctionnalités'}
              </p>
            )}
          </div>
          {user.kyc_status !== 'approved' && (
            <button
              onClick={() => router.push('/kyc')}
              className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {user.kyc_status === 'rejected' ? 'Resoumettre' : 'Commencer'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ─── Tabs ───────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'activity' && activities.length === 0) fetchActivities();
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Overview Tab ───────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Statistics */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h2 className="font-bold text-gray-900 text-sm">Statistiques</h2>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: Plane, label: 'Voyages publiés', value: stats?.totalTrips ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: Package, label: 'Colis livrés', value: stats?.totalShipments ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
                  { icon: Star, label: 'Note moyenne', value: `${(Number(user.rating) || 0).toFixed(1)} / 5`, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { icon: CheckCircle, label: 'Taux de succès', value: `${stats?.successRate ?? 0}%`, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((row) => {
                  const RIcon = row.icon;
                  return (
                    <div key={row.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${row.bg} rounded-lg flex items-center justify-center`}>
                          <RIcon className={`w-4 h-4 ${row.color}`} />
                        </div>
                        <span className="text-sm text-gray-700">{row.label}</span>
                      </div>
                      <span className={`font-bold text-sm ${row.color}`}>{row.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Earnings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-green-500" />
                <h2 className="font-bold text-gray-900 text-sm">Gains & Portefeuille</h2>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4 mb-4">
                <p className="text-xs text-green-700 mb-1 font-medium">Gains totaux</p>
                <p className="text-3xl font-bold text-green-700">
                  {(stats?.totalEarnings ?? 0).toFixed(2)} <span className="text-lg">€</span>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Ce mois</p>
                  <p className="font-bold text-gray-900 text-base">{(stats?.earningsThisMonth ?? 0).toFixed(2)} €</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">En attente</p>
                  <p className="font-bold text-gray-900 text-base">{(stats?.pendingEarnings ?? 0).toFixed(2)} €</p>
                </div>
              </div>
              <Button variant="primary" fullWidth onClick={() => router.push('/wallet')}>
                <CreditCard className="w-4 h-4 mr-2" />
                Voir mon portefeuille
              </Button>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-orange-500" />
                <h2 className="font-bold text-gray-900 text-sm">Badges & Réalisations</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {user.is_recommended && (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl text-center">
                    <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <div className="text-xs font-bold text-gray-800">Recommandé</div>
                    <div className="text-xs text-gray-500 mt-0.5">Membre de confiance</div>
                  </div>
                )}
                {user.kyc_status === 'approved' && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-center">
                    <ShieldCheck className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-xs font-bold text-gray-800">Vérifié</div>
                    <div className="text-xs text-gray-500 mt-0.5">Identité confirmée</div>
                  </div>
                )}
                {(stats?.totalTrips ?? 0) >= 10 && (
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl text-center">
                    <Plane className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-xs font-bold text-gray-800">Grand Voyageur</div>
                    <div className="text-xs text-gray-500 mt-0.5">10+ voyages</div>
                  </div>
                )}
                {(Number(user.rating) || 0) >= 4.5 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-center">
                    <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-xs font-bold text-gray-800">5 étoiles</div>
                    <div className="text-xs text-gray-500 mt-0.5">Excellent service</div>
                  </div>
                )}
                {!user.is_recommended && user.kyc_status !== 'approved' && (stats?.totalTrips ?? 0) < 10 && (Number(user.rating) || 0) < 4.5 && (
                  <div className="col-span-2 py-8 text-center">
                    <Award className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Complétez des missions pour débloquer des badges</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-orange-500" />
                <h2 className="font-bold text-gray-900 text-sm">Actions rapides</h2>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Publier un voyage', icon: Plane, path: '/trips/new', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Envoyer un colis', icon: Package, path: '/trips/search', color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'Mes messages', icon: MessageSquare, path: '/messages', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Retirer mes gains', icon: Wallet, path: '/wallet/withdraw', color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((action) => {
                  const AIcon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => router.push(action.path)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group"
                    >
                      <div className={`w-8 h-8 ${action.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <AIcon className={`w-4 h-4 ${action.color}`} />
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-700 text-left">{action.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── Reviews Tab ────────────────────────────────────────────────── */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {isLoadingRatings ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : totalRatings === 0 ? (
              <div className="text-center py-16">
                <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucun avis pour le moment</p>
                <p className="text-gray-400 text-sm mt-1">Complétez des livraisons pour recevoir vos premiers avis</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 mb-6 border-b border-gray-100">
                  <div className="text-center md:text-left">
                    <div className="text-6xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                      {(Number(user.rating) || 0).toFixed(1)}
                    </div>
                    <RatingStars rating={Number(user.rating) || 0} size="lg" />
                    <p className="text-gray-400 text-sm mt-2">Basé sur {totalRatings} avis</p>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = ratingBreakdown[star as keyof typeof ratingBreakdown];
                      const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-10 text-right">{star} ★</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-5 text-left">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-5">
                  {ratings.map(rating => (
                    <div key={rating.id} className="flex gap-4 pb-5 border-b border-gray-50 last:border-0 last:pb-0">
                      <img
                        src={`https://i.pravatar.cc/40?u=${rating.from_user_id}`}
                        alt="Reviewer"
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <RatingStars rating={rating.rating} size="sm" />
                          <span className="text-xs text-gray-400">
                            {new Date(rating.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric', month: 'long', day: 'numeric',
                            })}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-sm text-gray-600 leading-relaxed">{rating.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Activity Tab ───────────────────────────────────────────────── */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {isLoadingActivities ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucune activité récente</p>
                <p className="text-gray-400 text-sm mt-1">Commencez à publier des voyages ou envoyer des colis</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activities.map((activity, index) => {
                  const getIconComponent = (iconName: string) => {
                    switch (iconName) {
                      case 'check_circle': return CheckCircle;
                      case 'plane': return Plane;
                      case 'star': return Star;
                      case 'package': return Package;
                      default: return Clock;
                    }
                  };
                  const getColors = (color: string) => {
                    const map: Record<string, { bg: string; text: string; amount: string }> = {
                      green: { bg: 'bg-green-100', text: 'text-green-600', amount: 'text-green-600' },
                      blue: { bg: 'bg-blue-100', text: 'text-blue-600', amount: 'text-blue-600' },
                      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', amount: 'text-yellow-600' },
                      purple: { bg: 'bg-purple-100', text: 'text-purple-600', amount: 'text-purple-600' },
                    };
                    return map[color] || { bg: 'bg-gray-100', text: 'text-gray-600', amount: 'text-gray-600' };
                  };
                  const IconComponent = getIconComponent(activity.icon);
                  const colors = getColors(activity.color);

                  return (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className={`w-9 h-9 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {activity.description} · {new Date(activity.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      {activity.amount && (
                        <span className={`text-sm font-bold ${colors.amount} flex-shrink-0`}>
                          +{activity.amount.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  );
                })}
                <div className="pt-3 text-center">
                  <button
                    onClick={fetchActivities}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Actualiser
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Member since footer ─────────────────────────────────────────── */}
        {stats?.memberSince && (
          <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Membre depuis {stats.memberSince}
          </p>
        )}
      </div>
    </div>
  );
}
