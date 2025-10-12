// src/lib/api/association/associations.ts
/**
 * 🏛️ API Associations - VERSION CORRIGÉE
 * Compatible avec format backend: { success, data: { association, userMembership } }
 */

import { apiClient } from '../client';
import type {
  Association,
  GetAssociationResponse,
  GetAssociationsResponse,
  CreateAssociationPayload,
  UpdateAssociationPayload,
  AssociationStats
} from '@/types/association';

export const associationsApi = {
  
  /**
   * 📋 Récupérer toutes les associations de l'utilisateur
   */
  getAll: async (): Promise<GetAssociationsResponse> => {
    const response = await apiClient.get('/associations');
    return response.data;
  },

  /**
   * 🔍 Récupérer une association par ID
   * ✅ CORRECTION : Retourne { association, userMembership } dans data
   */
  getById: async (associationId: number): Promise<GetAssociationResponse> => {
    const response = await apiClient.get(`/associations/${associationId}`);
    return response.data; // Backend renvoie déjà { success, data: { association, userMembership } }
  },

  /**
   * ➕ Créer une nouvelle association
   */
  create: async (data: CreateAssociationPayload): Promise<GetAssociationResponse> => {
    const response = await apiClient.post('/associations', data);
    return response.data;
  },

  /**
   * ✏️ Modifier une association
   */
  update: async (
    associationId: number,
    data: UpdateAssociationPayload
  ): Promise<GetAssociationResponse> => {
    const response = await apiClient.put(`/associations/${associationId}`, data);
    return response.data;
  },

  /**
   * 🗑️ Supprimer une association
   */
  delete: async (associationId: number): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/associations/${associationId}`);
    return response.data;
  },

  /**
   * 📊 Récupérer les statistiques d'une association
   */
  getStats: async (associationId: number): Promise<{ success: boolean; data: AssociationStats }> => {
    const response = await apiClient.get(`/associations/${associationId}/stats`);
    return response.data;
  },

  /**
   * 🖼️ Upload logo association
   */
  uploadLogo: async (associationId: number, file: File): Promise<{ success: boolean; url: string }> => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await apiClient.post(
      `/associations/${associationId}/logo`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  /**
   * ⚙️ Mettre à jour paramètres association
   */
  updateSettings: async (
    associationId: number,
    settings: Association['settings']
  ): Promise<GetAssociationResponse> => {
    const response = await apiClient.put(`/associations/${associationId}/settings`, settings);
    return response.data;
  },

  /**
   * 💰 Récupérer balance association
   */
  getBalance: async (associationId: number): Promise<{ success: boolean; balance: number }> => {
    const response = await apiClient.get(`/associations/${associationId}/finances/balance`);
    return response.data;
  }
};