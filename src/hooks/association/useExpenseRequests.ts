// src/hooks/association/useExpenseRequests.ts

import { useState, useCallback } from 'react';
import { financesApi } from '@/lib/api/association/finances';
import type {
  ExpenseRequest,
  ExpenseFilters,
  PaginatedExpenses,
} from '@/types/association/finances';

export function useExpenseRequests(associationId: number) {
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
  });

  /**
   * 📋 Récupérer les demandes de dépenses
   */
  const fetchExpenses = useCallback(
    async (filters?: ExpenseFilters) => {
      setLoading(true);
      setError('');

      try {
        const response = await financesApi.getExpenses(associationId, filters);

        if (response.success && response.data) {
          setExpenses(response.data.expenses || []);
          setPagination({
            total: response.data.pagination.total,
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            totalPages: response.data.pagination.pages || response.data.pagination.totalPages || 1,
          });
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
        setError(errorMessage);
        console.error('Erreur fetchExpenses:', err);
      } finally {
        setLoading(false);
      }
    },
    [associationId]
  );

  /**
   * 🔄 Rafraîchir les données
   */
  const refetch = useCallback(
    (filters?: ExpenseFilters) => {
      return fetchExpenses(filters);
    },
    [fetchExpenses]
  );

  return {
    expenses,
    loading,
    error,
    pagination,
    fetchExpenses,
    refetch,
  };
}