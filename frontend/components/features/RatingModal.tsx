'use client';

import { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  toUserId: string;
  toUserName: string;
  userRole: 'sender' | 'traveler'; // Role of the person being rated
  onSuccess?: () => void;
}

export function RatingModal({
  isOpen,
  onClose,
  shipmentId,
  toUserId,
  toUserName,
  userRole,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post(API_ENDPOINTS.ratings.create, {
        to_user_id: toUserId,
        shipment_id: shipmentId,
        rating,
        comment: comment.trim() || null,
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      const errorMessage = ErrorHandler.handle(err);
      setError(errorMessage.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleLabel = userRole === 'traveler' ? 'le voyageur' : "l'expéditeur";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Évaluer {roleLabel}</h2>
            <p className="text-sm text-orange-100">{toUserName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Votre note
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-orange-500 text-orange-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-slate-600 mt-2">
                {rating === 1 && 'Très insatisfait'}
                {rating === 2 && 'Insatisfait'}
                {rating === 3 && 'Moyen'}
                {rating === 4 && 'Satisfait'}
                {rating === 5 && 'Très satisfait'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Commentaire <span className="text-slate-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Partagez votre expérience avec ${toUserName}...`}
              maxLength={500}
              rows={4}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm disabled:bg-slate-50 disabled:text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1 text-right">
              {comment.length}/500 caractères
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Plus tard
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              loading={isSubmitting}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
