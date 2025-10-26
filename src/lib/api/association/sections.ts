// src/lib/api/association/sections.ts
import { apiClient } from '@/lib/api/client';
import type { 
  Section,
  CreateSectionPayload,
  UpdateSectionPayload,
  GetSectionsResponse,
  GetSectionResponse,
  CreateSectionResponse,
  UpdateSectionResponse,
  DeleteSectionResponse,
  SectionFilters,
  SectionSortOptions
} from '@/types/association/section';

const BASE_PATH = '/associations';

/**
 * 🏗️ API Sections - Gestion des sections géographiques
 */
export const sectionsApi = {
  /**
   * Créer une nouvelle section
   */
  async createSection(
    associationId: number,
    payload: CreateSectionPayload
  ): Promise<CreateSectionResponse> {
    const response = await apiClient.post<CreateSectionResponse>(
      `${BASE_PATH}/${associationId}/sections`,
      payload
    );
    return response.data;
  },

  /**
   * Lister toutes les sections d'une association
   */
  async listSections(
    associationId: number,
    filters?: SectionFilters,
    sort?: SectionSortOptions,
    pagination?: {
      page?: number;
      limit?: number;
    }
  ): Promise<GetSectionsResponse> {
    const response = await apiClient.get<GetSectionsResponse>(
      `${BASE_PATH}/${associationId}/sections`,
      { 
        params: { 
          ...filters, 
          ...sort,
          ...pagination 
        } 
      }
    );
    return response.data;
  },

  /**
   * Obtenir les détails d'une section
   */
  async getSectionDetails(
    associationId: number,
    sectionId: number
  ): Promise<GetSectionResponse> {
    const response = await apiClient.get<GetSectionResponse>(
      `${BASE_PATH}/${associationId}/sections/${sectionId}`
    );
    return response.data;
  },

  /**
   * Mettre à jour une section
   */
  async updateSection(
    associationId: number,
    sectionId: number,
    payload: UpdateSectionPayload
  ): Promise<UpdateSectionResponse> {
    const response = await apiClient.put<UpdateSectionResponse>(
      `${BASE_PATH}/${associationId}/sections/${sectionId}`,
      payload
    );
    return response.data;
  },

  /**
   * Supprimer une section
   */
  async deleteSection(
    associationId: number,
    sectionId: number
  ): Promise<DeleteSectionResponse> {
    const response = await apiClient.delete<DeleteSectionResponse>(
      `${BASE_PATH}/${associationId}/sections/${sectionId}`
    );
    return response.data;
  },

  /**
   * Obtenir les statistiques d'une section
   */
  async getSectionStats(
    associationId: number,
    sectionId: number
  ): Promise<GetSectionResponse> {
    const response = await apiClient.get<GetSectionResponse>(
      `${BASE_PATH}/${associationId}/sections/${sectionId}/stats`
    );
    return response.data;
  },

  /**
   * Transférer un membre entre sections
   */
  async transferMember(
    associationId: number,
    sectionId: number,
    payload: {
      memberId: number;
      targetSectionId: number;
      reason?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${BASE_PATH}/${associationId}/sections/${sectionId}/transfer-member`,
      payload
    );
    return response.data;
  },

  /**
   * Obtenir la comparaison entre sections
   */
  async getSectionsComparison(
    associationId: number
  ): Promise<{
    success: boolean;
    data: {
      sections: Array<{
        id: number;
        name: string;
        membersCount: number;
        activeMembersCount: number;
        balance: number;
        status: string;
      }>;
      totals: {
        totalMembers: number;
        totalActiveMembers: number;
        totalBalance: number;
      };
    };
  }> {
    const response = await apiClient.get(
      `${BASE_PATH}/${associationId}/sections-comparison`
    );
    return response.data;
  },
};