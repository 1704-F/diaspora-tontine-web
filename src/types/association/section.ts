// src/types/association/section.ts

/**
 * 📍 Section géographique d'une association
 */
export interface Section {
  id: number;
  associationId: number;
  name: string;
  description?: string;
  country: string;
  city: string;
  address?: string;
  postalCode?: string;
  
  // Responsable section (optionnel)
  responsibleUserId?: number;
  responsibleUser?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  
  // Statistiques
  membersCount?: number;
  activeMembersCount?: number;
  
  // Finances section
  balance?: number;
  currency?: string;
  
  // Métadonnées
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  created_at?: string; // Compatibilité snake_case backend
  updated_at?: string;
}

/**
 * 📝 Payload création section
 */
export interface CreateSectionPayload {
  name: string;
  description?: string;
  country: string;
  city: string;
  address?: string;
  postalCode?: string;
  responsibleUserId?: number;
}

/**
 * ✏️ Payload mise à jour section
 */
export interface UpdateSectionPayload {
  name?: string;
  description?: string;
  country?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  responsibleUserId?: number;
  status?: Section['status'];
}

/**
 * 📊 Statistiques section
 */
export interface SectionStats {
  membersCount: number;
  activeMembersCount: number;
  pendingMembersCount: number;
  balance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

/**
 * 📦 Réponse API GET /sections
 */
export interface GetSectionsResponse {
  success: boolean;
  data: {
    sections: Section[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * 📦 Réponse API GET /sections/:id
 */
export interface GetSectionResponse {
  success: boolean;
  data: {
    section: Section;
    stats?: SectionStats;
  };
}

/**
 * 📦 Réponse API POST /sections
 */
export interface CreateSectionResponse {
  success: boolean;
  message: string;
  data: {
    section: Section;
  };
}

/**
 * 📦 Réponse API PUT /sections/:id
 */
export interface UpdateSectionResponse {
  success: boolean;
  message: string;
  data: {
    section: Section;
  };
}

/**
 * 📦 Réponse API DELETE /sections/:id
 */
export interface DeleteSectionResponse {
  success: boolean;
  message: string;
}

/**
 * 🔍 Filtres sections
 */
export interface SectionFilters {
  search?: string;
  country?: string;
  status?: Section['status'];
  minMembers?: number;
  maxMembers?: number;
}

/**
 * 📊 Options tri sections
 */
export interface SectionSortOptions {
  field: 'name' | 'membersCount' | 'createdAt' | 'country';
  direction: 'asc' | 'desc';
}