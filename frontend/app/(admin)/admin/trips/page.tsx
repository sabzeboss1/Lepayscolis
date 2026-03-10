'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';
import TablePagination from '@/components/admin/TablePagination';

interface Trip {
  id: string;
  traveler: { id: string; name: string; email: string };
  origin: string;
  destination: string;
  departure_date: string;
  arrival_date: string;
  available_space: number;
  price_per_kg: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  shipments_count: number;
  created_at: string;
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sort_by: 'newest'
  });

  useEffect(() => {
    fetchTrips();
  }, [currentPage, perPage, filters]);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.sort_by && { sort_by: filters.sort_by })
      });
      const response = await fetch(`/api/admin/trips?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ensure data.data is an array
      setTrips(Array.isArray(data.data) ? data.data : []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      setTrips([]); // Set empty array on error
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const columns: Column<Trip>[] = [
    {
      key: 'traveler',
      label: 'Traveler',
      render: (trip) => (
        <div>
          <div className="font-medium text-gray-900">{trip.traveler.name}</div>
          <div className="text-sm text-gray-500">{trip.traveler.email}</div>
        </div>
      )
    },
    {
      key: 'route',
      label: 'Route',
      render: (trip) => (
        <div className="text-sm text-gray-900">
          {trip.origin} → {trip.destination}
        </div>
      )
    },
    {
      key: 'departure_date',
      label: 'Departure',
      sortable: true,
      render: (trip) => (
        <span className="text-sm text-gray-900">
          {new Date(trip.departure_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'available_space',
      label: 'Space',
      render: (trip) => <span className="text-sm text-gray-900">{trip.available_space} kg</span>
    },
    {
      key: 'price_per_kg',
      label: 'Price/kg',
      render: (trip) => <span className="text-sm text-gray-900">€{trip.price_per_kg}</span>
    },
    {
      key: 'shipments_count',
      label: 'Shipments',
      render: (trip) => <span className="text-sm text-gray-900">{trip.shipments_count}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (trip) => getStatusBadge(trip.status)
    }
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'text' as const,
      key: 'search',
      label: 'Search',
      placeholder: 'Search by origin, destination, or traveler...'
    },
    {
      type: 'select' as const,
      key: 'status',
      label: 'Status',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      type: 'select' as const,
      key: 'sort_by',
      label: 'Sort By',
      options: [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'departure', label: 'Departure Date' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
        <p className="text-sm text-gray-600 mt-1">Manage platform trips and routes</p>
      </div>

      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={(newFilters) => {
          setFilters(newFilters as typeof filters);
          setCurrentPage(1);
        }}
        onReset={() => setFilters({ search: '', status: '', sort_by: 'newest' })}
      />

      <DataTable
        columns={columns}
        data={trips}
        loading={loading}
        emptyMessage="No trips found"
        onRowClick={(trip) => router.push(`/admin/trips/${trip.id}`)}
        getRowId={(trip) => trip.id}
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
