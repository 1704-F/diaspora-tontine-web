// src/hooks/association/usePermissions.ts

import { useMemo, useCallback } from 'react';
import { useAssociation } from './useAssociation';
import { useRoles } from './useRoles';

/**
 * 🔐 Hook pour vérifier les permissions d'un membre
 * 
 * @example
 * ```tsx
 * const { hasPermission, effectivePermissions, canManageRoles } = usePermissions(associationId);
 * 
 * if (hasPermission('membres.manage_members')) {
 *   return <AddMemberButton />;
 * }
 * 
 * if (canManageRoles) {
 *   return <RolesManagementUI />;
 * }
 * ```
 */
export function usePermissions(associationId: number) {
  const { currentMembership, isAdmin, association } = useAssociation(associationId);
  const { roles, availablePermissions } = useRoles(associationId);

  /**
   * 📊 Calculer permissions effectives du membre actuel
   * Priorité: Admin > Custom Granted > Custom Revoked > Assigned Roles
   */
const effectivePermissions = useMemo(() => {
  if (!currentMembership) return [];

  // ✅ CRITIQUE : Admin a TOUTES les permissions (hardcodées)
  if (currentMembership.isAdmin) {
    // Liste complète des permissions disponibles dans le système
    return [
      "membres.view_list",
      "membres.manage_members",
      "membres.approve_members",
      "membres.view_details",
      "finances.view_treasury",
      "finances.manage_budgets",
      "finances.validate_expenses",
      "finances.create_income",
      "finances.export_data",
      "administration.manage_roles",
      "administration.modify_settings",
      "administration.view_reports",
      "administration.manage_sections",
      "documents.upload",
      "documents.manage",
      "documents.validate",
      "evenements.create",
      "evenements.manage",
      "evenements.view_attendance",
    ];
  }

  const permissions = new Set<string>();

  // 1️⃣ Permissions des rôles assignés
  const assignedRoleIds = currentMembership.assignedRoles || [];
  assignedRoleIds.forEach((roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (role?.permissions) {
      role.permissions.forEach((p) => permissions.add(p));
    }
  });

  // 2️⃣ Ajouter custom granted
  const customGranted = currentMembership.customPermissions?.granted || [];
  customGranted.forEach((p) => permissions.add(p));

  // 3️⃣ Retirer custom revoked
  const customRevoked = currentMembership.customPermissions?.revoked || [];
  customRevoked.forEach((p) => permissions.delete(p));

  return Array.from(permissions);
}, [currentMembership, roles]); // ✅ Retiré availablePermissions de la dépendance

  /**
   * ✅ Vérifier si le membre a une permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!currentMembership) return false;

      // Admin a tout
      if (currentMembership.isAdmin) return true;

      return effectivePermissions.includes(permission);
    },
    [currentMembership, effectivePermissions]
  );

  /**
   * ✅ Vérifier si le membre a AU MOINS UNE des permissions
   */
  const hasAnyPermission = useCallback(
    (...permissions: string[]): boolean => {
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

  /**
   * ✅ Vérifier si le membre a TOUTES les permissions
   */
  const hasAllPermissions = useCallback(
    (...permissions: string[]): boolean => {
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission]
  );

  /**
   * ✅ Vérifier si le membre a un rôle spécifique
   */
  const hasRole = useCallback(
    (roleId: string): boolean => {
      if (!currentMembership) return false;
      return currentMembership.assignedRoles?.includes(roleId) || false;
    },
    [currentMembership]
  );

  /**
   * ✅ Vérifier si le membre a AU MOINS UN des rôles
   */
  const hasAnyRole = useCallback(
    (...roleIds: string[]): boolean => {
      if (!currentMembership) return false;
      return roleIds.some((roleId) =>
        currentMembership.assignedRoles?.includes(roleId)
      );
    },
    [currentMembership]
  );

  /**
   * ✅ Vérifier si le membre a TOUS les rôles
   */
  const hasAllRoles = useCallback(
    (...roleIds: string[]): boolean => {
      if (!currentMembership) return false;
      return roleIds.every((roleId) =>
        currentMembership.assignedRoles?.includes(roleId) 
      );
    },
    [currentMembership]
  );

  /**
   * 📋 Permissions par catégorie
   */
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, string[]> = {
      finances: [],
      membres: [],
      administration: [],
      documents: [],
      evenements: [],
    };

    effectivePermissions.forEach((permId) => {
      const perm = availablePermissions.find((p) => p.id === permId);
      if (perm?.category) {
        if (!grouped[perm.category]) {
          grouped[perm.category] = [];
        }
        grouped[perm.category].push(permId);
      }
    });

    return grouped;
  }, [effectivePermissions, availablePermissions]);

  /**
   * 📊 Détails des rôles assignés
   */
  const assignedRoleDetails = useMemo(() => {
    if (!currentMembership) return [];

    const assignedRoleIds = currentMembership.assignedRoles || [];
    return assignedRoleIds
      .map((roleId) => roles.find((r) => r.id === roleId))
      .filter((role): role is NonNullable<typeof role> => role !== undefined);
  }, [currentMembership, roles]);

  return {
    // État
    currentMembership,
    effectivePermissions,
    permissionsByCategory,
    assignedRoleDetails,

    // Vérification permissions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Vérification rôles
    hasRole,
    hasAnyRole,
    hasAllRoles,

    // Flags rapides
    isAdmin: currentMembership?.isAdmin || false,
    isMember: !!currentMembership,

    // ✅ NOUVEAUX RACCOURCIS - Permissions communes
    canViewMembers: hasPermission('membres.view_list'),
    canManageMembers: hasPermission('membres.manage_members'),
    canApproveMembers: hasPermission('membres.approve_members'),
    canViewDetails: hasPermission('membres.view_details'),
    canExportMembers: hasPermission('membres.export_data'),
    
    canViewFinances: hasPermission('finances.view_treasury'),
    canManageBudgets: hasPermission('finances.manage_budgets'),
    canValidateExpenses: hasPermission('finances.validate_expenses'),
    canCreateIncome: hasPermission('finances.create_income'),
    canExportFinancialData: hasPermission('finances.export_data'),
    
    canManageRoles: hasPermission('administration.manage_roles'),
    canModifySettings: hasPermission('administration.modify_settings'),
    canViewReports: hasPermission('administration.view_reports'),
    canManageSections: hasPermission('administration.manage_sections'),
    
    canUploadDocuments: hasPermission('documents.upload'),
    canManageDocuments: hasPermission('documents.manage'),
    canValidateDocuments: hasPermission('documents.validate'),
    
    canCreateEvents: hasPermission('evenements.create'),
    canManageEvents: hasPermission('evenements.manage'),
    canViewAttendance: hasPermission('evenements.view_attendance'),
  };
}