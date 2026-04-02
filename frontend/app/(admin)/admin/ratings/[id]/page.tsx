'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Star, Trash2, Calendar } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface Rating {
  id: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  reviewed_user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    average_rating: number;
    total_ratings: number;
  };
  rating: number;
  comment?: string;
  related_resource: {
    type: 'shipment';
    id: string;
    reference: string;
    details: string;
  };
  created_at: string;
}

export default function RatingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [ratingId, setRatingId] = useState<string | null>(null);
  const [rating, setRating] = useState<Rating | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    params.then(p => setRatingId(p.id));
  }, [params]);

  useEffect(() => {
    if (ratingId) {
      fetchRatingDetails();
    }
  }, [ratingId]);

  const fetchRatingDetails = async () => {
    if (!ratingId) return;

    setLoading(true);
    try {
      const data = await apiClient.get(API_ENDPOINTS.admin.ratings.show(ratingId));
      setRating(data.data);
    } catch (error) {
      console.error('Failed to fetch rating details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!ratingId || !deleteReason.trim() || deleteReason.length < 10) {
      return;
    }

    try {
      await apiClient.delete(API_ENDPOINTS.admin.ratings.delete(ratingId), { reason: deleteReason });
      router.push('/admin/ratings');
    } catch (error) {
      console.error('Failed to delete rating:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!rating) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('admin.ratings.ratingNotFound')}</p>
      </div>
    );
  }

  const renderStars = (value: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 ${
              star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-3 text-xl font-bold text-gray-900">{value.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.ratings.detailTitle')}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {rating.reviewer?.name || 'Unknown'} {t('admin.ratings.rated')} {rating.reviewed_user?.name || 'Unknown'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowDeleteDialog(true)}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {t('admin.ratings.removeRating')}
        </button>
      </div>

      {/* Rating Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Rating Value */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.ratings.rating')}</h2>
            <div className="flex items-center">
              {renderStars(rating.rating)}
            </div>
            {rating.comment && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('admin.ratings.comment')}</h3>
                <p className="text-sm text-gray-700">{rating.comment}</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                {t('admin.ratings.submittedOn')} {new Date(rating.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Reviewer Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.ratings.reviewer')}</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-24">{t('admin.ratings.name')}:</span>
                <button
                  onClick={() => router.push(`/admin/users/${rating.reviewer?.id}`)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {rating.reviewer?.name || 'Unknown'}
                </button>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 w-24 ml-7">{t('admin.ratings.email')}:</span>
                <span className="text-gray-900">{rating.reviewer?.email || 'N/A'}</span>
              </div>
              {rating.reviewer?.phone && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-24 ml-7">{t('admin.ratings.phone')}:</span>
                  <span className="text-gray-900">{rating.reviewer.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reviewed User Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.ratings.reviewedUser')}</h2>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <span className="text-gray-600 w-24">{t('admin.ratings.name')}:</span>
                <button
                  onClick={() => router.push(`/admin/users/${rating.reviewed_user?.id}`)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {rating.reviewed_user?.name || 'Unknown'}
                </button>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-600 w-24 ml-7">{t('admin.ratings.email')}:</span>
                <span className="text-gray-900">{rating.reviewed_user?.email || 'N/A'}</span>
              </div>
              {rating.reviewed_user?.phone && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-24 ml-7">{t('admin.ratings.phone')}:</span>
                  <span className="text-gray-900">{rating.reviewed_user.phone}</span>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">{t('admin.ratings.averageRating')}</label>
                    <div className="mt-1 flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                      <span className="text-sm font-semibold text-gray-900">
                        {Number(rating.reviewed_user?.average_rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">{t('admin.ratings.totalRatings')}</label>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {rating.reviewed_user?.total_ratings || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related Resource */}
          {rating.related_resource?.id && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.ratings.relatedShipment')}</h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-32">{t('admin.ratings.reference')}:</span>
                  <button
                    onClick={() => router.push(`/admin/shipments/${rating.related_resource.id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {rating.related_resource.reference}
                  </button>
                </div>
                {rating.related_resource.details && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-32">{t('admin.ratings.details')}:</span>
                    <span className="text-gray-900">{rating.related_resource.details}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('admin.ratings.actions')}</h3>
            <p className="text-xs text-gray-600 mb-4">
              {t('admin.ratings.removeWarning')}
            </p>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('admin.ratings.removeRating')}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.ratings.removeRating')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('admin.ratings.removeDialogDescription')}
            </p>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder={t('admin.ratings.removeReasonPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <span className={`text-xs ${deleteReason.length < 10 ? 'text-red-600' : 'text-gray-500'}`}>
                {deleteReason.length} / 10 {t('admin.ratings.minimum')}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteReason('');
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteRating}
                  disabled={deleteReason.length < 10}
                  className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('admin.ratings.removeRating')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
