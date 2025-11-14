// src/lib/api/association/finances.ts

import { apiClient } from '../client';
import type {
  GetExpensesResponse,
  GetExpenseByIdResponse,
  CreateExpensePayload,
  CreateExpenseResponse,
  ApproveExpensePayload,
  ApproveExpenseResponse,
  RejectExpensePayload,
  RejectExpenseResponse,
  ProcessPaymentPayload,
  GetFinancialSummaryResponse,
  ExpenseFilters,
} from '@/types/association/finances';

/**
 * 🏦 API Finances - Gestion des dépenses
 */
export const financesApi = {
  // ============================================
  // DEMANDES DE DÉPENSES
  // ============================================

  /**
   * 📋 Récupérer toutes les demandes de dépenses
   */
  getExpenses: async (
    associationId: number,
    filters?: ExpenseFilters
  ): Promise<GetExpensesResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.expenseType) params.append('expenseType', filters.expenseType);
    if (filters?.urgencyLevel) params.append('urgencyLevel', filters.urgencyLevel);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    const response = await apiClient.get(
      `/associations/${associationId}/expense-requests?${params.toString()}`
    );
    
    return response.data;
  },

  /**
   * 🔍 Récupérer une dépense par ID
   */
  getExpenseById: async (
    associationId: number,
    expenseId: number
  ): Promise<GetExpenseByIdResponse> => {
    const response = await apiClient.get(
      `/associations/${associationId}/expense-requests/${expenseId}`
    );
    return response.data;
  },

  /**
   * ➕ Créer une demande de dépense
   */
  createExpense: async (
    associationId: number,
    payload: CreateExpensePayload
  ): Promise<CreateExpenseResponse> => {
    const response = await apiClient.post(
      `/associations/${associationId}/expense-requests`,
      payload
    );
    return response.data;
  },

  /**
   * ✅ Approuver une dépense
   */
  approveExpense: async (
    associationId: number,
    expenseId: number,
    payload: ApproveExpensePayload
  ): Promise<ApproveExpenseResponse> => {
    const response = await apiClient.post(
      `/associations/${associationId}/expense-requests/${expenseId}/approve`,
      payload
    );
    return response.data;
  },

  /**
   * ❌ Rejeter une dépense
   */
  rejectExpense: async (
    associationId: number,
    expenseId: number,
    payload: RejectExpensePayload
  ): Promise<RejectExpenseResponse> => {
    const response = await apiClient.post(
      `/associations/${associationId}/expense-requests/${expenseId}/reject`,
      payload
    );
    return response.data;
  },

  /**
   * 💳 Traiter le paiement
   */
  processPayment: async (
    associationId: number,
    expenseId: number,
    payload: ProcessPaymentPayload
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(
      `/associations/${associationId}/expense-requests/${expenseId}/pay`,
      payload
    );
    return response.data;
  },

  /**
   * 🗑️ Supprimer une dépense
   */
  deleteExpense: async (
    associationId: number,
    expenseId: number
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(
      `/associations/${associationId}/expense-requests/${expenseId}`
    );
    return response.data;
  },

  // ============================================
  // RÉSUMÉ FINANCIER
  // ============================================

  /**
   * 📊 Récupérer le résumé financier
   */
  getFinancialSummary: async (
    associationId: number,
    period: 'all' | 'month' | 'quarter' | 'year' = 'all'
  ): Promise<GetFinancialSummaryResponse> => {
    const response = await apiClient.get(
      `/associations/${associationId}/financial-summary?period=${period}`
    );
    return response.data;
  },

  /**
   * 📈 Récupérer les statistiques des dépenses
   */
  getExpenseStatistics: async (
    associationId: number,
    period: 'month' | 'quarter' | 'year' | 'all' = 'all'
  ): Promise<{ success: boolean; data: unknown }> => {
    const response = await apiClient.get(
      `/associations/${associationId}/expense-requests/statistics?period=${period}`
    );
    return response.data;
  },
};