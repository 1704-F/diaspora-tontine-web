// src/types/association/member.ts

import { CustomPermissions } from './role';

/**
 * 👤 Membre d'une association
 */
export interface AssociationMember {
  id: number;
  userId: number;
  associationId: number;
  
  // 🔐 RBAC
  isAdmin: boolean; // Admin association (créateur)
  assignedRoles: string[]; // IDs des rôles attribués
  customPermissions: CustomPermissions; // Override permissions
  
  // 👤 Infos membre
  memberType: string; // Ex: "membre_actif", "membre_honneur"
  status: 'active' | 'suspended' | 'pending';
  joinedAt: string; // ISO date
  
  // 📱 Contact (si inclus via populate)
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
  
  // 💰 Finances (optionnel)
  totalContributed?: number;
  totalOwed?: number;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * 📊 Membre enrichi avec permissions calculées (pour UI)
 */
export interface MemberWithPermissions extends AssociationMember {
  effectivePermissions: string[]; // Toutes permissions finales
  roleDetails: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

/**
 * 🎭 Configuration type de membre (défini par association)
 */
export interface MemberTypeConfig {
  id: string;
  name: string;
  description: string;
  requiresApproval: boolean; // Adhésion nécessite validation
  defaultRoles?: string[]; // Rôles attribués automatiquement
  color?: string;
}

/**
 * 📋 Rôles d'un membre avec détails (réponse API)
 */
export interface MemberRolesDetails {
  member: {
    id: number;
    userId: number;
    name: string;
    memberType: string;
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
  effectivePermissions: string[]; // Permissions finales calculées
}

/**
 * 📦 Réponse API GET /members/:memberId/roles
 */
export interface GetMemberRolesResponse {
  success: boolean;
  data: MemberRolesDetails;
}

/**
 * 📝 Payload attribution rôles
 */
export interface AssignRolesPayload {
  roleIds: string[];
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
 * 🔍 Filtres membres (pour UI liste)
 */
export interface MemberFilters {
  search?: string; // Recherche nom/prénom
  memberTypes?: string[];
  roles?: string[];
  status?: AssociationMember['status'][];
  isAdmin?: boolean;
}

/**
 * 📊 Options tri membres
 */
export interface MemberSortOptions {
  field: 'name' | 'joinedAt' | 'memberType' | 'totalContributed';
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
  errors: string[];
}

/**
 * 🔄 État formulaire membre (pour UI)
 */
export interface MemberFormState {
  selectedRoles: Set<string>;
  grantedPermissions: Set<string>;
  revokedPermissions: Set<string>;
}

/**
 * 👑 Transfert admin
 */
export interface TransferAdminPayload {
  newAdminMemberId: number;
  reason?: string; // Optionnel, pour logs
}

/**
 * 📊 Statistiques membre (pour profil)
 */
export interface MemberStats {
  totalContributions: number;
  totalExpensesRequested: number;
  attendanceRate: number; // % présence événements
  activeSince: string; // ISO date
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
  changedBy: number; // userId qui a fait le changement
  changedAt: string; // ISO date
  reason?: string;
}