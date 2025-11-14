// src/hooks/association/useFinancialSummary.ts

import { useState, useCallback } from 'react';
import { financesApi } from '@/lib/api/association/finances';
import type { FinancialSummary } from '@/types/association/finances';

export function useFinancialSummary(associationId: number) {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  /**
   * 📊 Récupérer le résumé financier
   */
  const fetchSummary = useCallback(
    async (period: 'all' | 'month' | 'quarter' | 'year' = 'all') => {
      setLoading(true);
      setError('');

      try {
        const response = await financesApi.getFinancialSummary(associationId, period);

        if (response.success && response.data) {
          setSummary(response.data);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
        setError(errorMessage);
        console.error('Erreur fetchSummary:', err);
      } finally {
        setLoading(false);
      }
    },
    [associationId]
  );

  /**
   * 🔄 Rafraîchir
   */
  const refetch = useCallback(
    (period: 'all' | 'month' | 'quarter' | 'year' = 'all') => {
      return fetchSummary(period);
    },
    [fetchSummary]
  );

  return {
    summary,
    loading,
    error,
    fetchSummary,
    refetch,
  };
}