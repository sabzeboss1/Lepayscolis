'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';
import { useTranslation } from '@/lib/i18n';

interface Rating {
  id: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
  };
  reviewed_user: {
    id: string;
    name: string;
    email: string;
  };
  rating: number;
  comment?: string;
  related_resource: {
    type: 'shipment';
    id: string;
    reference: string;
  };
  created_at: string;
}

export default function RatingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, string | { from: string; to: string }>>({
    search: '',
    rating: '',
  });

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        ...(filters.search && typeof filters.search === 'string' && { search: filters.search }),
        ...(filters.rating && typeof filters.rating === 'string' && { rating: filters.rating }),
      });

      const response = await fetch(`/api/admin/ratings?${params}`);
      const data = await response.json();

      setRatings(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
      setRatings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [currentPage, perPage, sortKey, sortDirection, filters]);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleFilterChange = (newFilters: Record<string, string | { from: string; to: string }>) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const columns: Column<Rating>[] = [
    {
      key: 'reviewer',
      label: t('admin.ratings.reviewer'),
      render: (rating) => (
        <div>
          <div className="font-medium text-gray-900">{rating.reviewer.name}</div>
          <div className="text-sm text-gray-500">{rating.reviewer.email}</div>
        </div>
      )
    },
    {
      key: 'reviewed_user',
      label: t('admin.ratings.reviewedUser'),
      render: (rating) => (
        <div>
          <div className="font-medium text-gray-900">{rating.reviewed_user.name}</div>
          <div className="text-sm text-gray-500">{rating.reviewed_user.email}</div>
        </div>
      )
    },
    {
      key: 'rating',
      label: t('admin.ratings.rating'),
      sortable: true,
      render: (rating) => renderStars(rating.rating)
    },
    {
      key: 'related_resource',
      label: t('admin.ratings.relatedTo'),
      render: (rating) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/shipments/${rating.related_resource.id}`);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {t('admin.ratings.shipment')}: {rating.related_resource.reference}
        </button>
      )
    },
    {
      key: 'created_at',
      label: t('admin.ratings.date'),
      sortable: true,
      render: (rating) => (
        <span className="text-sm text-gray-900">
          {new Date(rating.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    }
  ];

  const filterConfig = [
    {
      type: 'text' as const,
      key: 'search',
      label: t('common.search'),
      placeholder: t('admin.ratings.searchPlaceholder'),
    },
    {
      type: 'select' as const,
      key: 'rating',
      label: t('admin.ratings.rating'),
      options: [
        { value: '', label: t('admin.ratings.allRatings') },
        { value: '5', label: t('admin.ratings.stars', { count: '5' }) },
        { value: '4', label: t('admin.ratings.stars', { count: '4' }) },
        { value: '3', label: t('admin.ratings.stars', { count: '3' }) },
        { value: '2', label: t('admin.ratings.stars', { count: '2' }) },
        { value: '1', label: t('admin.ratings.star', { count: '1' }) },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.ratings.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('admin.ratings.description')}
        </p>
      </div>

      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ search: '', rating: '' })}
      />

      <DataTable
        columns={columns}
        data={ratings}
        loading={loading}
        emptyMessage={t('admin.ratings.noRatings')}
        onSort={handleSort}
        onRowClick={(rating) => router.push(`/admin/ratings/${rating.id}`)}
        getRowId={(rating) => rating.id}
      />

      <TablePagination
        currentPage={currentPage}
        totalPages={Math.ceil(total / perPage)}
        itemsPerPage={perPage}
        totalItems={total}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(newPerPage: number) => {
          setPerPage(newPerPage);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
