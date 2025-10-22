// src/types/association/member.ts

import { CustomPermissions, RolesConfiguration } from './role';

/**
 * 👤 Membre d'une association
 */
export interface AssociationMember {
  id: number;
  userId: number;
  associationId: number;
  sectionId?: number | null;
  
  // 🔐 RBAC
  isAdmin: boolean;
  assignedRoles: string[]; // ✅ MULTI-RÔLES
  customPermissions: CustomPermissions;
  
  // 👤 Infos membre
  memberType: string | null;
  status: 'active' | 'suspended' | 'pending' | 'inactive';
  joinDate: string;
  approvedDate?: string | null;
  approvedBy?: number | null;
  
  // 💰 Cotisations
  cotisationAmount?: number;
  autoPaymentEnabled?: boolean;
  paymentMethod?: 'card' | 'bank_transfer' | null;
  paymentMethodId?: string | null;
  
  // 📊 Statistiques financières
  totalContributed?: number;
  totalAidsReceived?: number;
  totalOwed?: number;
  lastContributionDate?: string | null;
  contributionStatus?: 'up_to_date' | 'late' | 'very_late' | 'inactive';
  
  // 📱 Contact (si inclus via populate)
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    profilePicture?: string;
  };
  
  // 📍 Section (si inclus via populate)
  section?: {
    id: number;
    name: string;
    country: string;
    city: string;
  };
  
  // 🏛️ Association (si inclus via populate pour RBAC)
  association?: {
    rolesConfiguration: RolesConfiguration;
  };
  
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 📊 Membre enrichi avec permissions calculées (pour UI)
 */
export interface MemberWithPermissions extends AssociationMember {
  effectivePermissions: string[];
  roleDetails: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

/**
 * 🎭 Configuration type de membre (défini par association)
 * ✅ MODIFIÉ : defaultRole SUPPRIMÉ
 */
export interface MemberTypeConfig {
  name: string;
  cotisationAmount: number;
  description: string;
  // ❌ SUPPRIMÉ : defaultRole
  requiresApproval?: boolean;
  color?: string;
}

/**
 * 🆕 Statut administrateur (pour création association)
 */
export interface AdminStatusFormData {
  isMember: boolean; // L'admin est-il membre ?
  memberType: string; // Si oui, son type de membre
  assignedRoles: string[]; // Si oui, ses rôles (MULTI-RÔLES)
}

/**
 * 📋 Rôles d'un membre avec détails (réponse API)
 */
export interface MemberRolesDetails {
  member: {
    id: number;
    userId: number;
    name: string;
    memberType: string | null;
    isAdmin: boolean;
  };
  assignedRoles: Array<{
    id: string;
    name: string;
    description: string;
    permissions: string[];
    color: string;
    iconName?: string;
  }>;
  customPermissions: CustomPermissions;
  effectivePermissions: string[];
}

/**
 * 📦 Réponse API GET /members/:memberId/roles
 */
export interface GetMemberRolesResponse {
  success: boolean;
  data: MemberRolesDetails;
}

/**
 * 📦 Réponse API GET /members (liste)
 */
export interface GetMembersResponse {
  success: boolean;
  data: {
    members: AssociationMember[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * 📦 Réponse API GET /members/:memberId
 */
export interface GetMemberResponse {
  success: boolean;
  data: {
    member: AssociationMember;
  };
}

/**
 * 📝 Payload attribution rôles (MULTI-RÔLES)
 */
export interface AssignRolesPayload {
  roleIds: string[]; // ✅ Plusieurs rôles possibles
}

/**
 * 📝 Payload permissions custom
 */
export interface GrantPermissionPayload {
  permission: string;
}

export interface RevokePermissionPayload {
  permission: string;
}

/**
 * 📝 Payload création membre
 * ✅ MODIFIÉ : assignedRoles au lieu de defaultRole
 */
export interface CreateMemberPayload {
  userId?: number; // Optionnel si création à partir du user courant
  memberType?: string | null;
  sectionId?: number | null;
  assignedRoles?: string[]; // ✅ MULTI-RÔLES
  cotisationAmount?: number;
  autoPaymentEnabled?: boolean;
  paymentMethod?: 'card' | 'bank_transfer';
  status?: 'active' | 'pending';
}

/**
 * 📝 Payload mise à jour membre
 */
export interface UpdateMemberPayload {
  memberType?: string | null;
  status?: 'active' | 'suspended' | 'pending' | 'inactive';
  sectionId?: number | null;
  assignedRoles?: string[]; // ✅ MULTI-RÔLES
  cotisationAmount?: number;
  autoPaymentEnabled?: boolean;
  paymentMethod?: 'card' | 'bank_transfer';
  customPermissions?: CustomPermissions;
}

/**
 * 🔍 Filtres membres (pour UI liste)
 */
export interface MemberFilters {
  search?: string;
  memberTypes?: string[];
  roles?: string[];
  status?: AssociationMember['status'][];
  isAdmin?: boolean;
  sectionId?: number;
  contributionStatus?: 'up_to_date' | 'late' | 'very_late' | 'inactive';
  page?: number;
  limit?: number;
}

/**
 * 📊 Options tri membres
 */
export interface MemberSortOptions {
  field: 'name' | 'joinDate' | 'memberType' | 'totalContributed' | 'lastContributionDate';
  direction: 'asc' | 'desc';
}

/**
 * 📦 Liste paginée membres
 */
export interface PaginatedMembers {
  members: AssociationMember[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * ✅ Validation membre
 */
export interface MemberValidation {
  canAssignRoles: boolean;
  canGrantPermissions: boolean;
  canRemoveRoles: boolean;
  canMakeAdmin: boolean;
  canSuspend: boolean;
  canDelete: boolean;
  errors: string[];
}

/**
 * 🔄 État formulaire membre (pour UI)
 */
export interface MemberFormState {
  selectedRoles: Set<string>; // ✅ MULTI-RÔLES
  grantedPermissions: Set<string>;
  revokedPermissions: Set<string>;
  memberType?: string | null;
  cotisationAmount?: number;
}

/**
 * 👑 Transfert admin
 */
export interface TransferAdminPayload {
  newAdminMemberId: number;
  reason?: string;
}

/**
 * 📦 Réponse transfert admin
 */
export interface TransferAdminResponse {
  success: boolean;
  message: string;
  data?: {
    formerAdmin: {
      memberId: number;
      userId: number;
      name: string;
    };
    newAdmin: {
      memberId: number;
      userId: number;
      name: string;
    };
    transferredAt: string;
  };
}

/**
 * 📊 Statistiques membre (pour profil)
 */
export interface MemberStats {
  totalContributions: number;
  totalExpensesRequested: number;
  totalAidsReceived: number;
  attendanceRate: number;
  activeSince: string;
  monthsSinceLatePayment?: number;
  consecutivePaymentsOnTime: number;
  rolesHistory: Array<{
    roleId: string;
    roleName: string;
    assignedAt: string;
    removedAt?: string;
  }>;
}

/**
 * 🔔 Notification changement rôle (pour logs/audit)
 */
export interface RoleChangeNotification {
  memberId: number;
  memberName: string;
  action: 'assigned' | 'removed' | 'admin_transferred';
  roleId?: string;
  roleName?: string;
  changedBy: number;
  changedAt: string;
  reason?: string;
}

/**
 * 💰 Historique cotisations membre
 */
export interface MemberContributionHistory {
  memberId: number;
  contributions: Array<{
    id: number;
    amount: number;
    date: string;
    status: 'completed' | 'pending' | 'failed';
    method: 'card' | 'bank_transfer';
    transactionId?: string;
  }>;
  totalContributed: number;
  averageMonthlyAmount: number;
  lastContributionDate: string | null;
}

/**
 * 📧 Invitation membre (pour ajout via email/téléphone)
 */
export interface InviteMemberPayload {
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  memberType?: string;
  assignedRoles?: string[]; // ✅ MULTI-RÔLES
  message?: string;
}

/**
 * 📦 Réponse invitation membre
 */
export interface InviteMemberResponse {
  success: boolean;
  message: string;
  data?: {
    invitationId: string;
    expiresAt: string;
    invitedUser: {
      phoneNumber?: string;
      email?: string;
      name?: string;
    };
  };
}

/**
 * 🔄 Réponse suspension/réactivation membre
 */
export interface SuspendMemberResponse {
  success: boolean;
  message: string;
  data?: {
    memberId: number;
    previousStatus: string;
    newStatus: string;
    suspendedBy: number;
    suspendedAt: string;
    reason?: string;
  };
}

/**
 * 📊 Vue d'ensemble membre (pour dashboard admin)
 */
export interface MemberOverview {
  member: AssociationMember;
  stats: MemberStats;
  recentActivity: Array<{
    type: 'contribution' | 'event_attendance' | 'role_change' | 'aid_request';
    date: string;
    description: string;
  }>;
  alerts: Array<{
    type: 'late_payment' | 'inactive' | 'role_expiring';
    severity: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

/**
 * 🔍 Recherche membre avancée
 */
export interface MemberSearchParams {
  query?: string;
  filters?: MemberFilters;
  sort?: MemberSortOptions;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

/**
 * 📦 Réponse recherche membre
 */
export interface MemberSearchResponse {
  success: boolean;
  data: {
    members: MemberWithPermissions[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    facets?: {
      memberTypes: Record<string, number>;
      statuses: Record<string, number>;
      sections: Record<string, number>;
    };
  };
}

/**
 * 📋 Bulk operations (pour admin)
 */
export interface BulkMemberOperation {
  memberIds: number[];
  action: 'assign_role' | 'remove_role' | 'suspend' | 'reactivate' | 'change_type';
  params?: {
    roleId?: string;
    memberType?: string;
    reason?: string;
  };
}

/**
 * 📦 Réponse bulk operation
 */
export interface BulkMemberOperationResponse {
  success: boolean;
  data: {
    successful: number[];
    failed: Array<{
      memberId: number;
      error: string;
    }>;
    totalProcessed: number;
  };
}