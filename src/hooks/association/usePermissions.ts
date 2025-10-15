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
 * if (hasPermission('validate_expenses')) {
 *   return <ApproveButton />;
 * }
 * 
 * if (canManageRoles) {
 *   return <RolesManagementUI />;
 * }
 * ```
 */
export function usePermissions(associationId: number) {
  const { currentMembership, isAdmin } = useAssociation(associationId);
  const { roles, availablePermissions } = useRoles(associationId);

  /**
   * 📊 Calculer permissions effectives du membre actuel
   * Priorité: Admin > Custom Granted > Custom Revoked > Assigned Roles
   */
  const effectivePermissions = useMemo(() => {
    if (!currentMembership) return [];

    // Admin a toutes les permissions
    if (currentMembership.isAdmin) {
      return availablePermissions.map((p) => p.id);
    }

    const permissions = new Set<string>();

    // 1. Permissions des rôles assignés
    const assignedRoleIds = currentMembership.assignedRoles || [];
    assignedRoleIds.forEach((roleId) => {
      const role = roles.find((r) => r.id === roleId);
      if (role?.permissions) {
        role.permissions.forEach((p) => permissions.add(p));
      }
    });

    // 2. Ajouter custom granted
    const customGranted = currentMembership.customPermissions?.granted || [];
    customGranted.forEach((p) => permissions.add(p));

    // 3. Retirer custom revoked
    const customRevoked = currentMembership.customPermissions?.revoked || [];
    customRevoked.forEach((p) => permissions.delete(p));

    return Array.from(permissions);
  }, [currentMembership, roles, availablePermissions]);

  /**
   * ✅ Vérifier si le membre a une permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!currentMembership) return false;
    return effectivePermissions.includes(permission);
  }, [currentMembership, effectivePermissions]);

  /**
   * ✅ Vérifier si le membre a AU MOINS UNE des permissions
   */
  const hasAnyPermission = useCallback((...permissions: string[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  }, [hasPermission]);

  /**
   * ✅ Vérifier si le membre a TOUTES les permissions
   */
  const hasAllPermissions = useCallback((...permissions: string[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  }, [hasPermission]);

  /**
   * 📋 Permissions par catégorie
   */
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, string[]> = {
      finances: [],
      membres: [],
      administration: [],
      documents: [],
      evenements: []
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
   * 🎯 Permissions spécifiques métier (helpers)
   * ✅ FIX: Vérification directe des customPermissions.granted pour éviter race conditions
   */
  
  // ✅ FIX CRITIQUE: canManageRoles vérifie customPermissions.granted directement
  const canManageRoles = useMemo(() => {
    if (isAdmin) {
      console.log('🔐 canManageRoles: TRUE (isAdmin)');
      return true;
    }
    
    // Vérifier si manage_roles est dans customPermissions.granted DIRECTEMENT
    const customGranted = currentMembership?.customPermissions?.granted || [];
    if (customGranted.includes('manage_roles')) {
      console.log('🔐 canManageRoles: TRUE (customPermissions.granted)', customGranted);
      return true;
    }
    
    // Sinon vérifier via effectivePermissions (rôles assignés)
    const hasViaEffective = effectivePermissions.includes('manage_roles');
    console.log('🔐 canManageRoles:', hasViaEffective, {
      effectivePermissions,
      customGranted,
      isAdmin
    });
    return hasViaEffective;
  }, [isAdmin, currentMembership, effectivePermissions]);

  const canManageFinances = useMemo(
    () => hasAnyPermission('validate_expenses', 'manage_budgets', 'view_finances'),
    [hasAnyPermission]
  );

  const canManageMembers = useMemo(
    () => hasPermission('manage_members'),
    [hasPermission]
  );

  const canViewFinances = useMemo(
    () => hasPermission('view_finances'),
    [hasPermission]
  );

  const canValidateExpenses = useMemo(
    () => hasPermission('validate_expenses'),
    [hasPermission]
  );

  const canCreateEvents = useMemo(
    () => hasPermission('create_events'),
    [hasPermission]
  );

  const canManageDocuments = useMemo(
    () => hasPermission('manage_documents'),
    [hasPermission]
  );

  // ✅ FIX APPLIQUÉ AUSSI: canModifySettings vérifie customPermissions.granted directement
  const canModifySettings = useMemo(() => {
    if (isAdmin) return true;
    
    const customGranted = currentMembership?.customPermissions?.granted || [];
    if (customGranted.includes('modify_settings')) return true;
    
    return effectivePermissions.includes('modify_settings');
  }, [isAdmin, currentMembership, effectivePermissions]);

  return {
    // État
    effectivePermissions,
    permissionsByCategory,
    isAdmin,

    // Vérifications génériques
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Helpers métier
    canManageFinances,
    canManageMembers,
    canManageRoles,
    canViewFinances,
    canValidateExpenses,
    canCreateEvents,
    canManageDocuments,
    canModifySettings,

    // Info
    totalPermissions: effectivePermissions.length,
    hasAnyPermissions: effectivePermissions.length > 0
  };
}