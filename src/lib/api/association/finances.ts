// src/lib/api/association/finances.ts

import { apiClient } from '../client';
import type {
  ExpenseRequest,
  IncomeEntry,
  GetFinancesResponse,
  GetExpensesResponse,
  GetIncomeResponse,
  CreateExpensePayload,
  ApproveExpensePayload,
  RejectExpensePayload,
  CreateIncomePayload,
  FinancialReport
} from '@/types/association';

/**
 * 💰 API Finances
 */
export const financesApi = {
  
  /**
   * 📊 Récupérer résumé financier
   */
  getSummary: async (associationId: number): Promise<GetFinancesResponse> => {
    const response = await apiClient.get(`/associations/${associationId}/finances`);
    return response.data;
  },

  // ============================================
  // DÉPENSES
  // ============================================

  /**
   * 📋 Récupérer toutes les dépenses
   */
  getExpenses: async (
    associationId: number,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<GetExpensesResponse> => {
    const response = await apiClient.get(`/associations/${associationId}/expense-requests`, {
      params
    });
    return response.data;
  },

  /**
   * 🔍 Récupérer une dépense par ID
   */
  getExpenseById: async (
    associationId: number,
    expenseId: number
  ): Promise<{ success: boolean; data: { expense: ExpenseRequest } }> => {
    const response = await apiClient.get(
      `/associations/${associationId}/expense-requests/${expenseId}`
    );
    return response.data;
  },

  /**
   * ➕ Créer demande de dépense
   */
  createExpense: async (
    associationId: number,
    data: CreateExpensePayload
  ): Promise<{ success: boolean; data: { expense: ExpenseRequest } }> => {
    const response = await apiClient.post(`/associations/${associationId}/expense-requests`, data);
    return response.data;
  },

  /**
   * ✅ Approuver une dépense
   */
  approveExpense: async (
    associationId: number,
    expenseId: number,
    data: ApproveExpensePayload
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(
      `/associations/${associationId}/expense-requests/${expenseId}/approve`,
      data
    );
    return response.data;
  },

  /**
   * ❌ Rejeter une dépense
   */
  rejectExpense: async (
    associationId: number,
    expenseId: number,
    data: RejectExpensePayload
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(
      `/associations/${associationId}/expense-requests/${expenseId}/reject`,
      data
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
  // REVENUS
  // ============================================

  /**
   * 📋 Récupérer tous les revenus
   */
  getIncome: async (
    associationId: number,
    params?: {
      page?: number;
      limit?: number;
      category?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<GetIncomeResponse> => {
    const response = await apiClient.get(`/associations/${associationId}/income-entries`, {
      params
    });
    return response.data;
  },

  /**
   * ➕ Créer entrée de revenu
   */
  createIncome: async (
    associationId: number,
    data: CreateIncomePayload
  ): Promise<{ success: boolean; data: { income: IncomeEntry } }> => {
    const response = await apiClient.post(`/associations/${associationId}/income-entries`, data);
    return response.data;
  },

  /**
   * 🗑️ Supprimer un revenu
   */
  deleteIncome: async (associationId: number, incomeId: number): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(
      `/associations/${associationId}/income-entries/${incomeId}`
    );
    return response.data;
  },

  // ============================================
  // RAPPORTS
  // ============================================

  /**
   * 📄 Générer rapport financier
   */
  generateReport: async (
    associationId: number,
    params: {
      startDate: string;
      endDate: string;
      format?: 'pdf' | 'excel' | 'json';
    }
  ): Promise<{ success: boolean; data: FinancialReport | Blob }> => {
    const response = await apiClient.get(`/associations/${associationId}/finances/report`, {
      params,
      responseType: params.format === 'json' ? 'json' : 'blob'
    });

    return response.data;
  },

  /**
   * 📊 Export Excel
   */
  exportToExcel: async (
    associationId: number,
    params: {
      startDate: string;
      endDate: string;
    }
  ): Promise<Blob> => {
    const response = await apiClient.get(`/associations/${associationId}/finances/export/excel`, {
      params,
      responseType: 'blob'
    });

    return response.data;
  }
};