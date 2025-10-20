// src/types/association/association.ts

import { RolesConfiguration } from './role';
import { MemberTypeConfig, AssociationMember } from './member';

/**
 * 🏛️ Association complète
 */
export interface Association {
  id: number;
  name: string;
  slug: string;
  description: string;
  domiciliationCountry: string;
  domiciliationCity: string | null;
  primaryCurrency: string;
  created_at: string;
  updated_at: string;
  
  // 🔐 RBAC Configuration
  rolesConfiguration: RolesConfiguration;
  
  // 👥 Types de membres configurables
  memberTypes: MemberTypeConfig[]; // ✅ MODIFIÉ : Array au lieu de Record
  
  // 🎭 Rôles organisationnels personnalisés
  customRoles?: CustomRole[]; // ✅ NOUVEAU
  
  // 📍 Infos générales
  country: string;
  city: string;
  address?: string;
  logo?: string;
  status?: 'active' | 'pending_validation' | 'suspended' | 'deleted';
  
  // 🏢 Structure
  isMultiSection?: boolean; // ✅ NOUVEAU
  
  // 📊 Statistiques
  totalMembers: number;
  activeMembers: number;
  totalBalance?: number;
  membersCount?: number; // ✅ NOUVEAU (alias)
  
  // 💰 Paramètres cotisations
  cotisationSettings?: CotisationSettings; // ✅ NOUVEAU
  
  // 🔐 Droits d'accès (legacy - à migrer)
  accessRights?: AccessRights; // ✅ NOUVEAU
  
  // 📅 Dates
  foundedAt?: string;
  founderId?: number; // ✅ NOUVEAU
  createdAt: string;
  updatedAt: string;
  
  // ⚙️ Paramètres
  settings?: AssociationSettings;
  
  // 📦 Features/Limits
  features?: AssociationFeatures; // ✅ NOUVEAU
  
  // 📄 Documents KYB
  documentsStatus?: DocumentsStatus; // ✅ NOUVEAU
}

/**
 * 🎭 Rôle organisationnel personnalisé (pour organigramme)
 * Différent des rôles RBAC - ce sont des titres/postes
 */
export interface CustomRole {
  id: string; // UUID généré
  name: string; // "Commissaire aux comptes", "Chargé communication"
  description: string;
  assignedTo: number | null; // userId du membre assigné (null si libre)
  assignedAt?: string; // ISO date
  createdAt?: string; // ISO date
  createdBy?: number; // userId créateur
}

/**
 * 💰 Paramètres des cotisations
 */
export interface CotisationSettings {
  dueDay: number; // Jour du mois (1-28)
  gracePeriodDays: number; // Délai de grâce
  lateFeesEnabled: boolean;
  lateFeesAmount: number;
  inactivityThresholdMonths: number; // Mois avant inactivité
  autoPaymentEnabled?: boolean;
  reminderDaysBefore?: number; // Jours avant rappel
}

/**
 * 🔐 Droits d'accès (système legacy)
 * @deprecated Utiliser rolesConfiguration à la place
 */
export interface AccessRights {
  finances?: 'all_members' | 'central_board_only' | 'bureau_and_sections' | 'disabled';
  membersList?: 'all_members' | 'central_board_only' | 'bureau_and_sections' | 'disabled';
  statistics?: 'all_members' | 'central_board_only' | 'bureau_and_sections' | 'disabled';
  calendar?: 'all_members' | 'central_board_only' | 'bureau_and_sections' | 'disabled';
  expenses?: 'all_members' | 'central_board_only' | 'bureau_and_sections' | 'disabled';
}

/**
 * 📦 Features et limites de l'association
 */
export interface AssociationFeatures {
  maxMembers: number;
  maxSections: number;
  customTypes: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  multiCurrency?: boolean;
  customBranding?: boolean;
}

/**
 * 📄 Statut des documents KYB
 */
export interface DocumentsStatus {
  statuts?: {
    uploaded: boolean;
    validated: boolean;
    expiresAt: string | null;
  };
  receipisse?: {
    uploaded: boolean;
    validated: boolean;
    expiresAt: string | null;
  };
  rib?: {
    uploaded: boolean;
    validated: boolean;
    expiresAt: string | null;
  };
  pv_creation?: {
    uploaded: boolean;
    validated: boolean;
    expiresAt: string | null;
  };
}

/**
 * ⚙️ Paramètres d'une association
 */
export interface AssociationSettings {
   isMultiSection?: boolean;
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
  data: {
    association: Association;
    userMembership?: AssociationMember; // Membership de l'utilisateur connecté
    userPermissions?: string[]; // ✅ MODIFIÉ : Array de permission IDs au lieu de Record
  };
}

/**
 * 📦 Réponse API GET /associations (liste)
 */
export interface GetAssociationsResponse {
  success: boolean;
  data: {
    associations: AssociationSummary[];
    total: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

/**
 * 📝 Payload création association
 */
export interface CreateAssociationPayload {
  name: string;
  description: string;
  domiciliationCountry: string; 
  domiciliationCity: string;  
  address?: string;
  legalStatus?: string;
  registrationNumber?: string;
  primaryCurrency?: string
  memberTypes?: MemberTypeConfig[];
  settings?: Partial<AssociationSettings>;
}

/**
 * 📝 Payload modification association
 */
export interface UpdateAssociationPayload extends Partial<CreateAssociationPayload> {
  logo?: string; // URL ou base64
  customRoles?: CustomRole[]; // ✅ NOUVEAU
  isMultiSection?: boolean; // ✅ NOUVEAU
}

/**
 * 📝 Payload modification configuration
 */
export interface UpdateConfigurationPayload {
  memberTypes?: MemberTypeConfig[];
  customRoles?: CustomRole[];
  accessRights?: AccessRights;
  cotisationSettings?: CotisationSettings;
}

/**
 * 🔍 Filtres associations (pour recherche)
 */
export interface AssociationFilters {
  search?: string;
  country?: string;
  city?: string;
  hasRoles?: string[]; // Filtrer par rôles utilisateur
  status?: 'active' | 'pending_validation' | 'suspended' | 'all';
  page?: number;
  limit?: number;
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
  hasRolesConfigured: boolean; // ✅ NOUVEAU
  hasMemberTypesConfigured: boolean; // ✅ NOUVEAU
  errors: string[];
}

/**
 * 📄 Section d'une association multi-sections
 */
export interface Section {
  id: number;
  associationId: number;
  name: string;
  country: string;
  city: string;
  currency: string;
  language: string;
  membersCount: number;
  bureauSection?: {
    responsable?: { userId: number; name: string; phoneNumber: string };
    secretaire?: { userId: number; name: string; phoneNumber: string };
    tresorier?: { userId: number; name: string; phoneNumber: string };
  };
  createdAt: string;
  updatedAt: string;
}