'use client';

import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Rating } from '@/lib/types';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Package, 
  Plane, 
  Star,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  CreditCard
} from 'lucide-react';

interface UserStats {
  totalTrips: number;
  totalShipments: number;
  totalEarnings: number;
  successRate: number;
  responseTime: string;
  memberSince: string;
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoadingRatings, setIsLoadingRatings] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'activity'>('overview');

  useEffect(() => {
    if (user) {
      // Fetch user data from API
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setIsLoadingRatings(true);
      
      // Fetch user ratings
      const ratingsResponse = await fetch(`/api/users/${user?.id}/ratings`);
      if (ratingsResponse.ok) {
        const ratingsData = await ratingsResponse.json();
        setRatings(ratingsData.ratings || []);
      }

      // Fetch user stats (mock data for now - will be replaced with real API)
      setStats({
        totalTrips: 24,
        totalShipments: 18,
        totalEarnings: 1250.50,
        successRate: 98.5,
        responseTime: '< 2h',
        memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long' 
        }) : 'N/A'
      });
    } catch (err) {
      console.error('Failed to load user data:', err);
    } finally {
      setIsLoadingRatings(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate rating breakdown
  const ratingBreakdown = {
    5: ratings.filter(r => r.rating === 5).length,
    4: ratings.filter(r => r.rating === 4).length,
    3: ratings.filter(r => r.rating === 3).length,
    2: ratings.filter(r => r.rating === 2).length,
    1: ratings.filter(r => r.rating === 1).length,
  };

  const totalRatings = ratings.length;

  const getKYCStatusInfo = () => {
    switch (user.kycStatus) {
      case 'approved':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Vérifié',
          description: 'Votre identité a été vérifiée avec succès'
        };
      case 'pending':
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'En attente',
          description: 'Votre document est en cours de vérification'
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Rejeté',
          description: 'Votre document a été rejeté. Veuillez soumettre à nouveau'
        };
      default:
        return {
          icon: Shield,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Non vérifié',
          description: 'Complétez votre vérification KYC pour débloquer toutes les fonctionnalités'
        };
    }
  };

  const kycStatus = getKYCStatusInfo();
  const KYCIcon = kycStatus.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              {user.kycStatus === 'approved' && (
                <div className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 border-2 border-white">
                  <CheckCircle className="w-6 h-6" />
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => router.push('/profile/edit')}
              className="mt-4 w-full lg:w-auto"
            >
              Modifier le profil
            </Button>
          </div>

          {/* User Info Section */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                  {user.isRecommended && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      <Award className="w-4 h-4 mr-1" />
                      Recommandé
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <RatingStars rating={Number(user.rating) || 0} size="md" />
                  <span className="text-lg font-semibold text-gray-900">{(Number(user.rating) || 0).toFixed(1)}</span>
                  <span className="text-gray-500">({totalRatings} avis)</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{user.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-sm">{user.address || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-sm">Membre depuis {stats?.memberSince}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats?.totalTrips || 0}</div>
                <div className="text-xs text-gray-600">Voyages</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats?.totalShipments || 0}</div>
                <div className="text-xs text-gray-600">Colis</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats?.successRate || 0}%</div>
                <div className="text-xs text-gray-600">Succès</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats?.responseTime || 'N/A'}</div>
                <div className="text-xs text-gray-600">Réponse</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* KYC Status Card */}
      <Card className={`mb-6 ${kycStatus.bgColor} border-2 ${kycStatus.borderColor}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${kycStatus.bgColor}`}>
            <KYCIcon className={`w-8 h-8 ${kycStatus.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-semibold ${kycStatus.color}`}>
                Statut KYC: {kycStatus.label}
              </h3>
              {user.kycStatus !== 'approved' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/kyc')}
                >
                  {user.kycStatus === 'rejected' ? 'Soumettre à nouveau' : 'Compléter KYC'}
                </Button>
              )}
            </div>
            <p className="text-gray-700 text-sm mb-3">{kycStatus.description}</p>
            
            {user.kycStatus === 'approved' && (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  Identité vérifiée
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  Document validé
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                  Selfie approuvé
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'reviews'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Avis ({totalRatings})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activité
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistics Card */}
          <Card>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Statistiques
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Plane className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Voyages publiés</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{stats?.totalTrips || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Colis livrés</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{stats?.totalShipments || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <span className="text-gray-700">Note moyenne</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{(Number(user.rating) || 0).toFixed(1)}/5</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">Taux de succès</span>
                </div>
                <span className="text-xl font-bold text-gray-900">{stats?.successRate || 0}%</span>
              </div>
            </div>
          </Card>

          {/* Earnings Card */}
          <Card>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-600" />
              Gains et portefeuille
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Gains totaux</div>
                <div className="text-3xl font-bold text-green-600">
                  {stats?.totalEarnings?.toFixed(2) || '0.00'} €
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Ce mois</div>
                  <div className="text-lg font-bold text-gray-900">320.50 €</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">En attente</div>
                  <div className="text-lg font-bold text-gray-900">85.00 €</div>
                </div>
              </div>
              
              <Button
                variant="primary"
                fullWidth
                onClick={() => router.push('/wallet')}
                className="flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Voir mon portefeuille
              </Button>
            </div>
          </Card>

          {/* Badges Card */}
          <Card>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600" />
              Badges et réalisations
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {user.isRecommended && (
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-center">
                  <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Recommandé</div>
                  <div className="text-xs text-gray-600">Membre de confiance</div>
                </div>
              )}
              
              {user.kycStatus === 'approved' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                  <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Vérifié</div>
                  <div className="text-xs text-gray-600">Identité confirmée</div>
                </div>
              )}
              
              {(stats?.totalTrips || 0) >= 10 && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
                  <Plane className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">Voyageur</div>
                  <div className="text-xs text-gray-600">10+ voyages</div>
                </div>
              )}
              
              {(Number(user.rating) || 0) >= 4.5 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                  <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-900">5 étoiles</div>
                  <div className="text-xs text-gray-600">Excellent service</div>
                </div>
              )}
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <h2 className="text-xl font-bold mb-4">Actions rapides</h2>
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push('/trips/new')}
                className="justify-start"
              >
                <Plane className="w-4 h-4 mr-2" />
                Publier un voyage
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push('/trips/search')}
                className="justify-start"
              >
                <Package className="w-4 h-4 mr-2" />
                Envoyer un colis
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push('/messages')}
                className="justify-start"
              >
                <Mail className="w-4 h-4 mr-2" />
                Mes messages
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push('/wallet/withdraw')}
                className="justify-start"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Retirer mes gains
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'reviews' && (
        <Card>
          <h2 className="text-2xl font-bold mb-6">Avis et évaluations</h2>

          {isLoadingRatings ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : totalRatings === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun avis pour le moment</p>
              <p className="text-gray-400 text-sm mt-2">
                Complétez des livraisons pour recevoir vos premiers avis
              </p>
            </div>
          ) : (
            <>
              {/* Rating Summary */}
              <div className="mb-8 pb-8 border-b">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Average Rating */}
                  <div className="text-center md:text-left">
                    <div className="text-6xl font-bold text-gray-900 mb-2">
                      {(Number(user.rating) || 0).toFixed(1)}
                    </div>
                    <RatingStars rating={Number(user.rating) || 0} size="lg" />
                    <div className="text-gray-600 mt-2 text-lg">
                      Basé sur {totalRatings} avis
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = ratingBreakdown[star as keyof typeof ratingBreakdown];
                      const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                      
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-12">{star} étoiles</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-orange-500 h-3 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right font-medium">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Tous les avis</h3>
                {ratings.map(rating => (
                  <div key={rating.id} className="border-b pb-6 last:border-b-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <RatingStars rating={rating.rating} size="sm" />
                          <span className="text-sm text-gray-500">
                            {new Date(rating.createdAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        {rating.comment && (
                          <p className="text-gray-700 leading-relaxed">{rating.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card>
          <h2 className="text-2xl font-bold mb-6">Activité récente</h2>
          
          <div className="space-y-4">
            {/* Mock activity data */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Colis livré avec succès</p>
                <p className="text-sm text-gray-600">Paris → Yaoundé • 2.5 kg</p>
                <p className="text-xs text-gray-500 mt-1">Il y a 2 jours</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">+45.00 €</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <Plane className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Nouveau voyage publié</p>
                <p className="text-sm text-gray-600">Moscou → Paris • 15 kg disponibles</p>
                <p className="text-xs text-gray-500 mt-1">Il y a 5 jours</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Nouvel avis reçu</p>
                <p className="text-sm text-gray-600">5 étoiles • "Excellent service!"</p>
                <p className="text-xs text-gray-500 mt-1">Il y a 1 semaine</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-full">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Colis accepté</p>
                <p className="text-sm text-gray-600">Bruxelles → Douala • 3 kg</p>
                <p className="text-xs text-gray-500 mt-1">Il y a 1 semaine</p>
              </div>
            </div>

            <div className="text-center py-4">
              <Button variant="outline" size="sm">
                Voir toute l'activité
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
