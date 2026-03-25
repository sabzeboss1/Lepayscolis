'use client';

import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { KYCBlocker } from '@/components/features/KYCBlocker';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User, Shipment } from '@/lib/types';

export default function SubmitRatingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const shipmentId = searchParams.get('shipmentId');
  const userId = searchParams.get('userId');
  
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [ratedUser, setRatedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shipmentId || !userId) {
      setError('Missing required parameters');
      setIsLoading(false);
      return;
    }

    // Fetch shipment and user data
    Promise.all([
      fetch(`/api/shipments/${shipmentId}`).then(res => res.json()),
      fetch(`/api/users/${userId}`).then(res => res.json()),
    ])
      .then(([shipmentData, userData]) => {
        setShipment(shipmentData.shipment);
        setRatedUser(userData.user);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setError('Failed to load data');
        setIsLoading(false);
      });
  }, [shipmentId, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError(t('errors.required'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUserId: user?.id,
          toUserId: userId,
          shipmentId,
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      // Redirect to shipment detail page
      router.push(`/shipments/${shipmentId}`);
    } catch (error) {
      console.error('Rating submission error:', error);
      setError(t('ratings.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <KYCBlocker action="soumettre une évaluation">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </KYCBlocker>
    );
  }

  if (error && !ratedUser) {
    return (
      <KYCBlocker action="soumettre une évaluation">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold mb-2">{t('errors.error')}</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.back()}>
                {t('common.back')}
              </Button>
            </div>
          </Card>
        </div>
      </KYCBlocker>
    );
  }

  if (!user || !ratedUser || !shipment) {
    return null;
  }

  return (
    <KYCBlocker action="soumettre une évaluation">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common.back')}
        </button>
      </div>

      <Card>
        <h1 className="text-3xl font-bold mb-6">{t('ratings.title')}</h1>

        {/* User Info */}
        <div className="flex items-center gap-4 mb-8 pb-8 border-b">
          <img
            src={ratedUser.avatar ?? undefined}
            alt={ratedUser.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xl font-semibold">{ratedUser.name}</h2>
            <p className="text-gray-600">
              {shipment.traveler_id === ratedUser.id ? t('trips.travelerInfo') : t('shipments.sender')}
            </p>
          </div>
        </div>

        {/* Shipment Info */}
        <div className="mb-8 pb-8 border-b">
          <h3 className="text-lg font-semibold mb-4">{t('shipments.packageDetails')}</h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>{t('shipments.description')}:</strong> {shipment.package_description}</p>
            <p><strong>{t('shipments.weight')}:</strong> {shipment.package_weight} kg</p>
            <p>
              <strong>{t('shipments.pickup')}:</strong> {shipment.pickup_city}, {shipment.pickup_country}
            </p>
            <p>
              <strong>{t('shipments.delivery')}:</strong> {shipment.delivery_city}, {shipment.delivery_country}
            </p>
          </div>
        </div>

        {/* Rating Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-3">
              {t('ratings.yourRating')} *
            </label>
            <div className="flex items-center gap-4">
              <RatingStars
                rating={rating}
                size="lg"
                interactive
                onChange={setRating}
              />
              {rating > 0 && (
                <span className="text-lg font-semibold text-gray-700">
                  {rating} {t('ratings.stars', { count: rating })}
                </span>
              )}
            </div>
            {error && rating === 0 && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>

          <div>
            <label htmlFor="comment" className="block text-lg font-medium text-gray-700 mb-2">
              {t('ratings.comment')}
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('ratings.comment')}
            />
            <p className="text-sm text-gray-500 mt-1">
              {comment.length}/500 {t('common.characters')}
            </p>
          </div>

          {error && rating > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || rating === 0}
              loading={isSubmitting}
            >
              {t('ratings.submitRating')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
    </KYCBlocker>
  );
}
