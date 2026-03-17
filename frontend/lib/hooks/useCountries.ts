'use client';

import { useCallback } from 'react';
import { useCachedApi } from './useCachedApi';
import { apiClient } from '../api/client';
import { API_ENDPOINTS } from '../api/endpoints';
import { Country, City } from '../types/location';

interface CountriesResponse {
  data: Country[];
}

/**
 * Hook for fetching and caching countries with their cities.
 * Uses the public GET /api/countries endpoint (no auth required).
 * Countries data is cached for 1 hour.
 */
export function useCountries() {
  const { data, isLoading, error } = useCachedApi<CountriesResponse>(
    'countries-list',
    () => apiClient.get<CountriesResponse>(API_ENDPOINTS.countries.list),
    { ttl: 3600 }
  );

  const countries = data?.data || [];

  const getCitiesByCountryId = useCallback(
    (countryId: number): City[] => {
      const country = countries.find((c) => c.id === countryId);
      return country?.cities || [];
    },
    [countries]
  );

  const getCountryById = useCallback(
    (id: number): Country | undefined => {
      return countries.find((c) => c.id === id);
    },
    [countries]
  );

  const getCityById = useCallback(
    (id: number): City | undefined => {
      for (const country of countries) {
        const city = country.cities.find((c) => c.id === id);
        if (city) return city;
      }
      return undefined;
    },
    [countries]
  );

  return {
    countries,
    isLoading,
    error,
    getCitiesByCountryId,
    getCountryById,
    getCityById,
  };
}
