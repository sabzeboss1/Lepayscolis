'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RatingStars } from '@/components/ui/RatingStars';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { NotificationService } from '@/lib/services/NotificationService';
import type { User, Shipment } from '@/lib/types/api';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment;
  ratedUser: User;
  currentUserId: string;
}

export function RatingModal({ isOpen, onClose, shipment, ratedUser, currentUserId }: RatingModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate rating
    if (rating === 0) {
      setError(t('errors.required'));
      return;
    }

    // Validate comment for low ratings
    if (rating < 3 && !comment.trim()) {
      setError('Un commentaire est requis pour les notes inférieures à 3 étoiles');
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
          shipment_id: shipment.id,
          rated_id: ratedUser.id,
          score: rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit rating');
      }

      NotificationService.success(t('ratings.submitSuccess'));
      onClose();
    } catch (error: any) {
      console.error('Rating submission error:', error);
      setError(error.message || t('ratings.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{t('ratings.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-200">
            <img
              src={ratedUser.avatar_url || '/default-avatar.png'}
              alt={ratedUser.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{ratedUser.name}</h3>
              <p className="text-sm text-gray-600">
                {shipment.traveler_id === ratedUser.id ? 'Voyageur' : 'Expéditeur'}
              </p>
            </div>
          </div>

          {/* Rating */}
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

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-lg font-medium text-gray-700 mb-2">
              {t('ratings.comment')} {rating < 3 && rating > 0 && '*'}
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
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-gray-500">
                {comment.length}/500 {t('common.characters')}
              </p>
              {rating < 3 && rating > 0 && (
                <p className="text-sm text-orange-600">
                  * Commentaire requis pour les notes inférieures à 3
                </p>
              )}
            </div>
          </div>

          {error && rating > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || rating === 0}
              loading={isSubmitting}
              className="flex-1"
            >
              {t('ratings.submitRating')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
