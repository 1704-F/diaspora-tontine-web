// src/types/association/section.ts

/**
 * 📍 Section géographique d'une association
 * Aligné avec le modèle backend Section.js
 */
export interface Section {
  id: number;
  associationId: number;
  
  // 📍 IDENTIFICATION
  name: string;
  code?: string | null;
  country: string; // Code pays ISO 3166 (ex: "FR", "IT", "ES")
  city?: string | null;
  region?: string | null;
  
  // 💰 CONFIGURATION FINANCIÈRE
  currency: string; // Devise utilisée (EUR, USD, etc.)
  cotisationRates?: Record<string, number> | null; // Montants cotisations par type membre
  
  // 🌐 LOCALISATION
  language: string; // Langue principale (fr, it, es, en)
  timezone?: string | null; // Fuseau horaire (Europe/Paris, etc.)
  
  // 📞 CONTACT
  contactPhone?: string | null;
  contactEmail?: string | null;
  
  // 📊 STATISTIQUES
  membersCount: number;
  activeMembersCount: number;
  
  // 🔧 PARAMÈTRES
  settings?: Record<string, unknown> | null; // Configuration spécifique section
  
  // ✅ STATUS
  status: 'active' | 'inactive' | 'suspended';
  
  // 📅 DATES
  foundedDate?: string | null;
  lastActivityAt?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // COMPATIBILITÉ SNAKE_CASE (backend peut renvoyer dans ce format)
  created_at?: string;
  updated_at?: string;
  
  // EXTENSIONS (champs additionnels du frontend)
  description?: string; // Description de la section
  address?: string; // Adresse complète
  postalCode?: string; // Code postal
  
  // Responsable section (optionnel - relation avec User)
  responsibleUserId?: number;
  responsibleUser?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  
  // Finances section (calculées)
  balance?: number;
}

/**
 * 📝 Payload création section
 */
export interface CreateSectionPayload {
  name: string;
  code?: string;
  country: string;
  city?: string;
  region?: string;
  
  // Configuration financière
  currency?: string; // Hérite de l'association si non fourni
  cotisationRates?: Record<string, number>;
  
  // Localisation
  language?: string; // Défaut: 'fr'
  timezone?: string; // Défaut: 'Europe/Paris'
  
  // Contact
  contactPhone?: string;
  contactEmail?: string;
  
  // Paramètres
  settings?: Record<string, unknown>;
  
  // Dates
  foundedDate?: string;
  
  // Extensions frontend
  description?: string;
  address?: string;
  postalCode?: string;
  responsibleUserId?: number;
}

/**
 * ✏️ Payload mise à jour section
 */
export interface UpdateSectionPayload {
  name?: string;
  code?: string;
  country?: string;
  city?: string;
  region?: string;
  
  // Configuration financière
  currency?: string;
  cotisationRates?: Record<string, number>;
  
  // Localisation
  language?: string;
  timezone?: string;
  
  // Contact
  contactPhone?: string;
  contactEmail?: string;
  
  // Paramètres
  settings?: Record<string, unknown>;
  
  // Statut
  status?: 'active' | 'inactive' | 'suspended';
  
  // Extensions frontend
  description?: string;
  address?: string;
  postalCode?: string;
  responsibleUserId?: number;
}

/**
 * 📊 Statistiques section
 * ✅ CORRIGÉ : Ajout des champs manquants
 */
export interface SectionStats {
  // Membres
  membersCount: number;
  activeMembersCount: number;
  pendingMembersCount: number;
  
  // ✅ AJOUTÉ : Aliases pour compatibilité avec le code existant
  activeMembers: number; // Alias de activeMembersCount
  pendingMembers: number; // Alias de pendingMembersCount
  
  // Finances
  balance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyContributions?: number; // Total cotisations du mois
  
  // Activité
  eventsCount?: number;
  lastActivityAt?: string;
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
  region?: string;
  status?: Section['status'];
  minMembers?: number;
  maxMembers?: number;
  language?: string;
}

/**
 * 📊 Options tri sections
 */
export interface SectionSortOptions {
  field: 'name' | 'membersCount' | 'createdAt' | 'country' | 'city';
  direction: 'asc' | 'desc';
}

/**
 * 📝 Données formulaire section (pour CreateAssociationPage)
 * Champs minimum requis lors de la création d'association
 */
export interface SectionFormData {
  name: string;
  country: string;
  city: string;
  
  // Optionnels
  description?: string;
  code?: string;
  region?: string;
  address?: string;
  postalCode?: string;
  contactPhone?: string;
  contactEmail?: string;
}

/**
 * 📦 Réponse comparaison sections
 */
export interface SectionsComparisonResponse {
  success: boolean;
  data: {
    sections: Array<{
      id: number;
      name: string;
      country: string;
      city?: string;
      membersCount: number;
      activeMembersCount: number;
      balance?: number;
      monthlyContributions?: number;
      status: string;
    }>;
    totals: {
      totalMembers: number;
      totalActiveMembers: number;
      totalBalance: number;
      totalContributions: number;
    };
  };
}

/**
 * 📦 Payload transfert membre entre sections
 */
export interface TransferMemberPayload {
  memberId: number;
  targetSectionId: number;
  reason?: string;
}