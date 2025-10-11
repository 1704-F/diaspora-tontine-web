// src/hooks/association/useRoles.ts

import { useState, useEffect, useCallback } from 'react';
import { rolesApi } from '@/lib/api/association/roles';
import {
  RoleWithUsage,
  Permission,
  CreateRolePayload,
  UpdateRolePayload,
  GroupedPermissions
} from '@/types/association/role';
import { useAssociation } from './useAssociation';

/**
 * 🎭 Hook pour gérer les rôles RBAC
 * 
 * @example
 * ```tsx
 * const { roles, availablePermissions, createRole, loading } = useRoles(associationId);
 * 
 * const handleCreate = async () => {
 *   await createRole({
 *     name: 'Coordinateur',
 *     description: 'Coordination des activités',
 *     permissions: ['create_events', 'view_members'],
 *     color: '#3B82F6'
 *   });
 * };
 * ```
 */
export function useRoles(associationId: number) {
  const { association, refetch: refetchAssociation } = useAssociation(associationId);

  const [roles, setRoles] = useState<RoleWithUsage[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 📥 Charger tous les rôles
   */
  const fetchRoles = useCallback(async () => {
    if (!associationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await rolesApi.getAll(associationId);

      if (response.success) {
        setRoles(response.data.roles);
        setAvailablePermissions(response.data.availablePermissions);

        // Grouper permissions par catégorie
        const grouped: GroupedPermissions = {
          finances: [],
          membres: [],
          administration: [],
          documents: [],
          evenements: []
        };

        response.data.availablePermissions.forEach((perm) => {
          if (perm.category && perm.category in grouped) {
            grouped[perm.category].push(perm);
          }
        });

        setGroupedPermissions(grouped);
      }
    } catch (err) {
      console.error('Erreur chargement rôles:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  }, [associationId]);

  /**
   * ➕ Créer un rôle
   */
  const createRole = useCallback(
    async (data: CreateRolePayload) => {
      if (!associationId) throw new Error('ID association manquant');

      try {
        const response = await rolesApi.create(associationId, data);

        if (response.success) {
          // Recharger les rôles pour avoir les données à jour
          await fetchRoles();
          await refetchAssociation();
          return response.data.role;
        }

        throw new Error('Échec création rôle');
      } catch (err) {
        console.error('Erreur création rôle:', err);
        throw err;
      }
    },
    [associationId, fetchRoles, refetchAssociation]
  );

  /**
   * ✏️ Modifier un rôle
   */
  const updateRole = useCallback(
    async (roleId: string, data: UpdateRolePayload) => {
      if (!associationId) throw new Error('ID association manquant');

      try {
        const response = await rolesApi.update(associationId, roleId, data);

        if (response.success) {
          await fetchRoles();
          await refetchAssociation();
          return response.data.role;
        }

        throw new Error('Échec modification rôle');
      } catch (err) {
        console.error('Erreur modification rôle:', err);
        throw err;
      }
    },
    [associationId, fetchRoles, refetchAssociation]
  );

  /**
   * 🗑️ Supprimer un rôle
   */
  const deleteRole = useCallback(
    async (roleId: string) => {
      if (!associationId) throw new Error('ID association manquant');

      try {
        const response = await rolesApi.delete(associationId, roleId);

        if (response.success) {
          await fetchRoles();
          await refetchAssociation();
          return true;
        }

        throw new Error('Échec suppression rôle');
      } catch (err) {
        console.error('Erreur suppression rôle:', err);
        throw err;
      }
    },
    [associationId, fetchRoles, refetchAssociation]
  );

  /**
   * 🔍 Récupérer détails d'un rôle
   */
  const getRoleDetails = useCallback(
    async (roleId: string) => {
      if (!associationId) return null;

      try {
        const response = await rolesApi.getById(associationId, roleId);
        return response.success ? response.data : null;
      } catch (err) {
        console.error('Erreur récupération détails rôle:', err);
        return null;
      }
    },
    [associationId]
  );

  /**
   * 🎨 Récupérer templates suggérés
   */
  const getTemplates = useCallback(async () => {
    if (!associationId) return [];

    try {
      const response = await rolesApi.getTemplates(associationId);
      return response.success ? response.data.templates : [];
    } catch (err) {
      console.error('Erreur récupération templates:', err);
      return [];
    }
  }, [associationId]);

  // Charger au mount
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Sync avec association context si rolesConfiguration change
  useEffect(() => {
    if (association?.rolesConfiguration) {
      const rolesFromContext = association.rolesConfiguration.roles;
      const permissionsFromContext = association.rolesConfiguration.availablePermissions;

      if (rolesFromContext.length > 0) {
        // Enrichir avec membersCount = 0 par défaut (sera mis à jour par fetchRoles)
        const enriched = rolesFromContext.map((r) => ({
          ...r,
          membersCount: 0 // Toujours 0 ici, fetchRoles mettra la vraie valeur
        }));
        setRoles(enriched);
      }

      if (permissionsFromContext.length > 0) {
        setAvailablePermissions(permissionsFromContext);
      }
    }
  }, [association?.rolesConfiguration]);

  return {
    // État
    roles,
    availablePermissions,
    groupedPermissions,
    loading,
    error,

    // Actions
    createRole,
    updateRole,
    deleteRole,
    getRoleDetails,
    getTemplates,
    refetch: fetchRoles,

    // Helpers
    getRoleById: (roleId: string) => roles.find((r) => r.id === roleId),
    getRolesByIds: (roleIds: string[]) => roles.filter((r) => roleIds.includes(r.id)),
    getPermissionById: (permId: string) => availablePermissions.find((p) => p.id === permId),
    getTotalRoles: () => roles.length,
    hasRoles: roles.length > 0
  };
}