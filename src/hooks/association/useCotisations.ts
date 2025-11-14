// src/hooks/association/useCotisations.ts

import { useState, useCallback } from 'react';
import { cotisationsApi } from '@/lib/api/association/cotisations';
import type {
  CotisationsFilters,
  CotisationsDashboardData,
  CotisationMember,
} from '@/types/association/cotisation';

interface UseCotisationsReturn {
  dashboardData: CotisationsDashboardData | null;
  members: CotisationMember[];
  loading: boolean;
  error: string | null;
  fetchDashboard: (filters: CotisationsFilters) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * 💰 Hook pour gérer les cotisations d'une association
 */
export function useCotisations(
  associationId: number,
  initialFilters: CotisationsFilters
): UseCotisationsReturn {
  const [dashboardData, setDashboardData] = useState<CotisationsDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<CotisationsFilters>(initialFilters);

  const fetchDashboard = useCallback(async (filters: CotisationsFilters) => {
    if (!associationId) return;

    try {
      setLoading(true);
      setError(null);
      setCurrentFilters(filters);

      const response = await cotisationsApi.fetchCotisationsDashboard(
        associationId,
        filters
      );

      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
      console.error('❌ Erreur fetch cotisations:', err);
    } finally {
      setLoading(false);
    }
  }, [associationId]);

  const refetch = useCallback(async () => {
    await fetchDashboard(currentFilters);
  }, [currentFilters, fetchDashboard]);

  return {
    dashboardData,
    members: dashboardData?.members || [],
    loading,
    error,
    fetchDashboard,
    refetch,
  };
}