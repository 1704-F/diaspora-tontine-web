// src/lib/api/association/roles.ts

import { apiClient } from '../client';
import type {
  Role,
  GetRolesResponse,
  GetRoleDetailsResponse,
  CreateRolePayload,
  UpdateRolePayload,
  Permission
} from '@/types/association';

/**
 * 🔐 API Rôles RBAC
 */
export const rolesApi = {
  
  /**
   * 📋 Récupérer tous les rôles d'une association
   */
  getAll: async (associationId: number): Promise<GetRolesResponse> => {
    const response = await apiClient.get(`/associations/${associationId}/roles`);
    return response.data;
  },

  /**
   * 🔍 Récupérer détails d'un rôle
   */
  getById: async (associationId: number, roleId: string): Promise<GetRoleDetailsResponse> => {
    const response = await apiClient.get(`/associations/${associationId}/roles/${roleId}`);
    return response.data;
  },

  /**
   * ➕ Créer un nouveau rôle
   */
  create: async (
    associationId: number,
    data: CreateRolePayload
  ): Promise<{ success: boolean; data: { role: Role } }> => {
    const response = await apiClient.post(`/associations/${associationId}/roles`, data);
    return response.data;
  },

  /**
   * ✏️ Modifier un rôle existant
   */
  update: async (
    associationId: number,
    roleId: string,
    data: UpdateRolePayload
  ): Promise<{ success: boolean; data: { role: Role } }> => {
    const response = await apiClient.put(
      `/associations/${associationId}/roles/${roleId}`,
      data
    );
    return response.data;
  },

  /**
   * 🗑️ Supprimer un rôle
   */
  delete: async (associationId: number, roleId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/associations/${associationId}/roles/${roleId}`);
    return response.data;
  },

  /**
   * 📊 Récupérer toutes les permissions disponibles
   */
  getAvailablePermissions: async (
    associationId: number
  ): Promise<{
    success: boolean;
    data: {
      permissions: Permission[];
      grouped: Record<string, Permission[]>;
      total: number;
    };
  }> => {
    const response = await apiClient.get(`/associations/${associationId}/permissions`);
    return response.data;
  },

  /**
   * 🎨 Récupérer templates de rôles suggérés
   */
  getTemplates: async (
    associationId: number
  ): Promise<{
    success: boolean;
    data: {
      templates: Array<{
        id: string;
        name: string;
        description: string;
        suggestedPermissions: string[];
        category: string;
      }>;
    };
  }> => {
    const response = await apiClient.get(`/associations/${associationId}/role-templates`);
    return response.data;
  }
};