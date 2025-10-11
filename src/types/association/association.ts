// src/types/association/association.ts

import { RolesConfiguration } from './role';
import { MemberTypeConfig } from './member';

/**
 * 🏛️ Association complète
 */
export interface Association {
  id: number;
  name: string;
  slug: string;
  description: string;
  
  // 🔐 RBAC Configuration
  rolesConfiguration: RolesConfiguration;
  
  // 👥 Types de membres configurables
  memberTypes: Record<string, MemberTypeConfig>; // { "membre_actif": {...}, "membre_honneur": {...} }
  
  // 📍 Infos générales
  country: string;
  city: string;
  address?: string;
  logo?: string;
  
  // 📊 Statistiques
  totalMembers: number;
  activeMembers: number;
  totalBalance?: number;
  
  // 📅 Dates
  foundedAt?: string; // ISO date
  createdAt: string;
  updatedAt: string;
  
  // ⚙️ Paramètres
  settings?: AssociationSettings;
}

/**
 * ⚙️ Paramètres d'une association
 */
export interface AssociationSettings {
  // 💰 Finances
  currency: string; // "EUR", "USD", "XOF"
  fiscalYearStart: string; // "01-01" (MM-DD)
  requireExpenseApproval: boolean;
  maxExpenseWithoutApproval?: number;
  
  // 👥 Membres
  requireMemberApproval: boolean;
  allowSelfRegistration: boolean;
  defaultMemberType?: string;
  
  // 📧 Notifications
  notifyOnNewMember: boolean;
  notifyOnExpenseRequest: boolean;
  notifyOnEventCreated: boolean;
  
  // 🌐 Localisation
  defaultLanguage: 'fr' | 'en' | 'it';
  timezone: string; // "Europe/Paris"
}

/**
 * 📦 Association légère (pour listes)
 */
export interface AssociationSummary {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  totalMembers: number;
  userRole?: string; // Rôle de l'utilisateur connecté dans cette asso
  userIsAdmin: boolean;
  lastActivity?: string; // ISO date dernière activité
}

/**
 * 📦 Réponse API GET /associations/:id
 */
export interface GetAssociationResponse {
  success: boolean;
  data: Association;
}

/**
 * 📦 Réponse API GET /associations (liste)
 */
export interface GetAssociationsResponse {
  success: boolean;
  data: {
    associations: AssociationSummary[];
    total: number;
  };
}

/**
 * 📝 Payload création association
 */
export interface CreateAssociationPayload {
  name: string;
  description: string;
  country: string;
  city: string;
  address?: string;
  settings?: Partial<AssociationSettings>;
}

/**
 * 📝 Payload modification association
 */
export interface UpdateAssociationPayload extends Partial<CreateAssociationPayload> {
  logo?: string; // URL ou base64
}

/**
 * 🔍 Filtres associations (pour recherche)
 */
export interface AssociationFilters {
  search?: string;
  country?: string;
  city?: string;
  hasRoles?: string[]; // Filtrer par rôles utilisateur
}

/**
 * 📊 Statistiques association (dashboard)
 */
export interface AssociationStats {
  // 👥 Membres
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  newMembersThisMonth: number;
  
  // 💰 Finances
  totalBalance: number;
  totalIncomeThisMonth: number;
  totalExpensesThisMonth: number;
  pendingExpenses: number;
  
  // 📅 Événements
  upcomingEvents: number;
  eventsThisMonth: number;
  
  // 📈 Activité
  lastActivityAt: string; // ISO date
  mostActiveMembers: Array<{
    memberId: number;
    name: string;
    activityCount: number;
  }>;
}

/**
 * 🎨 Thème personnalisé association (futur)
 */
export interface AssociationTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo?: string;
  coverImage?: string;
}

/**
 * 📋 Configuration initialisation association (première connexion admin)
 */
export interface AssociationOnboarding {
  step: 'roles' | 'member-types' | 'settings' | 'complete';
  rolesConfigured: boolean;
  memberTypesConfigured: boolean;
  settingsConfigured: boolean;
}

/**
 * 🔄 État Context Provider Association (pour frontend)
 */
export interface AssociationContextState {
  association: Association | null;
  loading: boolean;
  error: Error | null;
  
  // 👤 Membership actuel utilisateur
  currentMembership: {
    id: number;
    isAdmin: boolean;
    assignedRoles: string[];
    effectivePermissions: string[];
  } | null;
  
  // 🔄 Actions
  refetch: () => Promise<void>;
  updateAssociation: (data: UpdateAssociationPayload) => Promise<void>;
}

/**
 * ✅ Validation association
 */
export interface AssociationValidation {
  isNameUnique: boolean;
  isSlugUnique: boolean;
  hasMinimumInfo: boolean; // Nom + description + pays
  errors: string[];
}