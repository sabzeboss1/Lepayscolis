'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';

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
  type: 'for_traveler' | 'for_sender';
  related_resource: {
    type: 'trip' | 'shipment';
    id: string;
    reference: string;
  };
  created_at: string;
}

export default function RatingsPage() {
  const router = useRouter();
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
    type: ''
  });

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortKey,
        sort_direction: sortDirection,
        ...(filters.search && typeof filters.search === 'string' && { search: filters.search }),
        ...(filters.rating && typeof filters.rating === 'string' && { rating: filters.rating }),
        ...(filters.type && typeof filters.type === 'string' && { type: filters.type })
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

  const getTypeBadge = (type: string) => {
    const badges = {
      for_traveler: 'bg-blue-100 text-blue-800',
      for_sender: 'bg-purple-100 text-purple-800'
    };
    const labels = {
      for_traveler: 'For Traveler',
      for_sender: 'For Sender'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[type as keyof typeof badges]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const columns: Column<Rating>[] = [
    {
      key: 'reviewer',
      label: 'Reviewer',
      render: (rating) => (
        <div>
          <div className="font-medium text-gray-900">{rating.reviewer.name}</div>
          <div className="text-sm text-gray-500">{rating.reviewer.email}</div>
        </div>
      )
    },
    {
      key: 'reviewed_user',
      label: 'Reviewed User',
      render: (rating) => (
        <div>
          <div className="font-medium text-gray-900">{rating.reviewed_user.name}</div>
          <div className="text-sm text-gray-500">{rating.reviewed_user.email}</div>
        </div>
      )
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (rating) => renderStars(rating.rating)
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (rating) => getTypeBadge(rating.type)
    },
    {
      key: 'related_resource',
      label: 'Related To',
      render: (rating) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const path = rating.related_resource.type === 'trip' ? 'trips' : 'shipments';
            router.push(`/admin/${path}/${rating.related_resource.id}`);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {rating.related_resource.type === 'trip' ? 'Trip' : 'Shipment'}: {rating.related_resource.reference}
        </button>
      )
    },
    {
      key: 'created_at',
      label: 'Date',
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
      label: 'Search',
      placeholder: 'Search by reviewer or reviewed user...'
    },
    {
      type: 'select' as const,
      key: 'rating',
      label: 'Rating',
      options: [
        { value: '', label: 'All Ratings' },
        { value: '5', label: '5 Stars' },
        { value: '4', label: '4 Stars' },
        { value: '3', label: '3 Stars' },
        { value: '2', label: '2 Stars' },
        { value: '1', label: '1 Star' }
      ]
    },
    {
      type: 'select' as const,
      key: 'type',
      label: 'Type',
      options: [
        { value: '', label: 'All Types' },
        { value: 'for_traveler', label: 'For Traveler' },
        { value: 'for_sender', label: 'For Sender' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ratings</h1>
        <p className="text-sm text-gray-600 mt-1">
          View and manage user ratings and reviews
        </p>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onReset={() => setFilters({ search: '', rating: '', type: '' })}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={ratings}
        loading={loading}
        emptyMessage="No ratings found"
        onSort={handleSort}
        onRowClick={(rating) => router.push(`/admin/ratings/${rating.id}`)}
        getRowId={(rating) => rating.id}
      />

      {/* Pagination */}
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
