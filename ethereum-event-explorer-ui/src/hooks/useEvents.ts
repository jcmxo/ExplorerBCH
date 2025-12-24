'use client';

import { useState, useEffect, useCallback } from 'react';
import { eventsApi } from '../services/api';
import type { EventsResponse, EventsFilters } from '../types/event';

interface UseEventsOptions {
  initialFilters?: EventsFilters;
  refetchInterval?: number;
}

export function useEvents(options?: UseEventsOptions) {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<EventsFilters>(options?.initialFilters || {
    page: 1,
    pageSize: 20,
  });

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await eventsApi.getAll(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();

    if (options?.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, options?.refetchInterval]);

  const updateFilters = useCallback((newFilters: Partial<EventsFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1, // Reset to page 1 when filters change
    }));
  }, []);

  const nextPage = useCallback(() => {
    if (data && data.page * data.pageSize < data.total) {
      setFilters((prev) => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  }, [data]);

  const prevPage = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      page: Math.max(1, (prev.page || 1) - 1),
    }));
  }, []);

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchData,
    nextPage,
    prevPage,
  };
}

