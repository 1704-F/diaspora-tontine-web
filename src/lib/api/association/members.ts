// src/lib/api/association/members.ts

import { apiClient } from '../client';
import type {
  AssociationMember,
  GetMemberRolesResponse,
  AssignRolesPayload,
  GrantPermissionPayload,
  RevokePermissionPayload,
  TransferAdminPayload,
  PaginatedMembers
} from '@/types/association'; 

/**
 * 👥 API Membres
 */
export const membersApi = {
  
  /**
   * 📋 Récupérer tous les membres d'une association
   */
  getAll: async (
    associationId: number,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      memberType?: string;
    }
  ): Promise<{ success: boolean; data: PaginatedMembers }> => {
    const response = await apiClient.get(`/associations/${associationId}/members`, { params });
    return response.data;
  },

  /**
   * 🔍 Récupérer un membre par ID
   */
  getById: async (
    associationId: number,
    memberId: number
  ): Promise<{ success: boolean; data: { member: AssociationMember } }> => {
    const response = await apiClient.get(`/associations/${associationId}/members/${memberId}`);
    return response.data;
  },

  /**
   * 🎭 Récupérer les rôles d'un membre
   */
  getRoles: async (associationId: number, memberId: number): Promise<GetMemberRolesResponse> => {
    const response = await apiClient.get(`/associations/${associationId}/members/${memberId}/roles`);
    return response.data;
  },

  /**
   * ➕ Attribuer des rôles à un membre
   */
  assignRoles: async (
    associationId: number,
    memberId: number,
    data: AssignRolesPayload
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(
      `/associations/${associationId}/members/${memberId}/roles`,
      data
    );
    return response.data;
  },

  /**
   * 🗑️ Retirer un rôle d'un membre
   */
  removeRole: async (
    associationId: number,
    memberId: number,
    roleId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(
      `/associations/${associationId}/members/${memberId}/roles/${roleId}`
    );
    return response.data;
  },

  /**
   * ✅ Accorder une permission custom à un membre
   */
  grantPermission: async (
    associationId: number,
    memberId: number,
    data: GrantPermissionPayload
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(
      `/associations/${associationId}/members/${memberId}/permissions/grant`,
      data
    );
    return response.data;
  },

  /**
   * ❌ Révoquer une permission custom d'un membre
   */
  revokePermission: async (
    associationId: number,
    memberId: number,
    data: RevokePermissionPayload
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(
      `/associations/${associationId}/members/${memberId}/permissions/revoke`,
      data
    );
    return response.data;
  },

  /**
   * 👑 Transférer le statut d'admin à un autre membre
   */
  transferAdmin: async (
    associationId: number,
    data: TransferAdminPayload
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/associations/${associationId}/transfer-admin`, data);
    return response.data;
  },

  /**
   * ✏️ Modifier un membre
   */
  update: async (
    associationId: number,
    memberId: number,
    data: Partial<AssociationMember>
  ): Promise<{ success: boolean; data: { member: AssociationMember } }> => {
    const response = await apiClient.put(
      `/associations/${associationId}/members/${memberId}`,
      data
    );
    return response.data;
  },

  /**
   * 🗑️ Supprimer un membre
   */
  delete: async (
    associationId: number,
    memberId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/associations/${associationId}/members/${memberId}`);
    return response.data;
  }
};