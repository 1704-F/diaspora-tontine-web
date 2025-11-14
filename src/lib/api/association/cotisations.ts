// src/lib/api/association/cotisations.ts

import { apiClient } from '../client';
import type {
  CotisationsFilters,
  PaginatedCotisations,
  AddManualCotisationPayload,
  MemberCotisationsResponse,
} from '@/types/association/cotisation';

/**
 * 📊 Récupérer le dashboard des cotisations
 */
export async function fetchCotisationsDashboard(
  associationId: number,
  filters: CotisationsFilters
): Promise<PaginatedCotisations> {
  const params = new URLSearchParams();
  
  params.append('month', filters.month.toString());
  params.append('year', filters.year.toString());
  
  if (filters.sectionId) {
    params.append('sectionId', filters.sectionId.toString());
  }
  
  if (filters.memberType) {
    params.append('memberType', filters.memberType);
  }
  
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  
  if (filters.search) {
    params.append('search', filters.search);
  }
  
  if (filters.page) {
    params.append('page', filters.page.toString());
  }
  
  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }

  const response = await apiClient.get(
    `/associations/${associationId}/cotisations-dashboard?${params.toString()}`
  );
  
  return response.data;
}

/**
 * ➕ Ajouter une cotisation manuelle
 */
export async function addManualCotisation(
  associationId: number,
  payload: AddManualCotisationPayload
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(
    `/associations/${associationId}/cotisations-manual`,
    payload
  );
  
  return response.data;
}

/**
 * 📜 Récupérer l'historique des cotisations d'un membre
 */
export async function fetchMemberCotisationHistory(
  associationId: number,
  memberId: number,
  limit: number = 12
): Promise<MemberCotisationsResponse> {
  const response = await apiClient.get(
    `/associations/${associationId}/members/${memberId}/cotisations?limit=${limit}`
  );
  
  return response.data;
}

/**
 * 📥 Exporter les cotisations en PDF
 */
export async function exportCotisationsPDF(
  associationId: number,
  filters: Partial<CotisationsFilters>
): Promise<Blob> {
  const params = new URLSearchParams();
  
  if (filters.month) params.append('month', filters.month.toString());
  if (filters.year) params.append('year', filters.year.toString());
  if (filters.sectionId) params.append('sectionId', filters.sectionId.toString());
  if (filters.memberType) params.append('memberType', filters.memberType);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);

  const response = await apiClient.get(
    `/associations/${associationId}/cotisations-export-pdf?${params.toString()}`,
    { responseType: 'blob' }
  );
  
  return response.data;
}

/**
 * 📧 Envoyer un rappel de paiement à un membre
 */
export async function sendPaymentReminder(
  associationId: number,
  memberId: number,
  month: number,
  year: number
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(
    `/associations/${associationId}/members/${memberId}/send-reminder`,
    { month, year }
  );
  
  return response.data;
}

// Export groupé
export const cotisationsApi = {
  fetchCotisationsDashboard,
  addManualCotisation,
  fetchMemberCotisationHistory,
  exportCotisationsPDF,
  sendPaymentReminder,
};