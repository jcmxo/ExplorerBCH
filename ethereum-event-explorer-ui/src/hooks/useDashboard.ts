'use client';

import { useState, useEffect } from 'react';
import { dashboardApi } from '../services/api';
import type { DashboardData } from '../types/dashboard';

interface UseDashboardOptions {
  refetchInterval?: number; // in milliseconds
}

export function useDashboard(options?: UseDashboardOptions) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const result = await dashboardApi.getMetrics();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (options?.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [options?.refetchInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

