// src/hooks/association/useAssociationMembers.ts

import { useState, useEffect, useCallback } from 'react';
import { membersApi } from '@/lib/api/association/members';
import {
  AssociationMember,
  MemberWithPermissions,
  AssignRolesPayload,
  GrantPermissionPayload,
  RevokePermissionPayload,
  TransferAdminPayload
} from '@/types/association/member';
import { useRoles } from './useRoles';

/**
 * 👥 Hook pour gérer les membres d'une association
 * 
 * @example
 * ```tsx
 * const { members, assignRoles, grantPermission, loading } = useAssociationMembers(associationId);
 * 
 * const handleAssignRole = async (memberId: number) => {
 *   await assignRoles(memberId, { roleIds: ['president', 'tresorier'] });
 * };
 * ```
 */
export function useAssociationMembers(associationId: number) {
  const { roles } = useRoles(associationId);

  const [members, setMembers] = useState<AssociationMember[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 📥 Charger tous les membres
   */
  const fetchMembers = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      memberType?: string;
    }) => {
      if (!associationId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await membersApi.getAll(associationId, params);

        if (response.success) {
          setMembers(response.data.members);
          setPagination(response.data.pagination);
        }
      } catch (err) {
        console.error('Erreur chargement membres:', err);
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setLoading(false);
      }
    },
    [associationId]
  );

  /**
   * 🔍 Récupérer un membre par ID
   */
  const getMemberById = useCallback(
    async (memberId: number): Promise<AssociationMember | null> => {
      if (!associationId) return null;

      try {
        const response = await membersApi.getById(associationId, memberId);
        return response.success ? response.data.member : null;
      } catch (err) {
        console.error('Erreur récupération membre:', err);
        return null;
      }
    },
    [associationId]
  );

  /**
   * 🎭 Récupérer rôles et permissions d'un membre
   */
  const getMemberRoles = useCallback(
    async (memberId: number) => {
      if (!associationId) return null;

      try {
        const response = await membersApi.getRoles(associationId, memberId);
        return response.success ? response.data : null;
      } catch (err) {
        console.error('Erreur récupération rôles membre:', err);
        return null;
      }
    },
    [associationId]
  );

  /**
   * ➕ Attribuer des rôles à un membre
   */
  const assignRoles = useCallback(
    async (memberId: number, data: AssignRolesPayload) => {
      if (!associationId) throw new Error('ID association manquant');

      try {
        const response = await membersApi.assignRoles(associationId, memberId, data);

        if (response.success) {
          // Recharger les membres pour mettre à jour l'UI
          await fetchMembers();
          return true;
        }

        throw new Error('Échec attribution rôles');
      } catch (err) {
        console.error('Erreur attribution rôles:', err);
        throw err;
      }
    },
    [associationId, fetchMembers]
  );

  /**
   * 🗑️ Retirer un rôle d'un membre
   */
  const removeRole = useCallback(
    async (memberId: number, roleId: string) => {
      if (!associationId) throw new Error('ID association manquant');

      try {
        const response = await membersApi.removeRole(associationId, memberId, roleId);

        if (response.success) {
          await fetchMembers();
          return true;
        }

        throw new Error('Échec retrait rôle');
      } catch (err) {
        console.error('Erreur retrait rôle:', err);
        throw err;
      }
    },
    [associationId, fetchMembers]
  );

  /**
   * ✅ Accorder une permission custom
   */
  const grantPermission = useCallback(
    async (memberId: number, data: GrantPermissionPayload) => {
      if (!associationId) throw new Error('ID association manquant');

      try {
        const response = await membersApi.grantPermission(associationId, memberId, data);

        if (response.success) {
          await fetchMembers();
          return true;
        }

        throw new Error('Échec ajout permission');
      } catch (err) {
        console.error('Erreur ajout permission:', err);
        throw err;
      }
    },
    [associationId, fetchMembers]
  );

  /**
   * ❌ Révoquer une permission custom
   */
  const revokePermission = useCallback(
    async (memberId: number, data: RevokePermissionPayload) => {
      if (!associationId) throw new Error('ID association manquant');

      try {
        const response = await membersApi.revokePermission(associationId, memberId, data);

        if (response.success) {
          await fetchMembers();
          return true;
        }

        throw new Error('Échec retrait permission');
      } catch (err) {
        console.error('Erreur retrait permission:', err);
        throw err;
      }
    },
    [associationId, fetchMembers]
  );

  /**
   * 👑 Transférer statut admin
   */
  const transferAdmin = useCallback(
    async (data: TransferAdminPayload) => {
      if (!associationId) throw new Error('ID association manquant');

      try {
        const response = await membersApi.transferAdmin(associationId, data);

        if (response.success) {
          await fetchMembers();
          return true;
        }

        throw new Error('Échec transfert admin');
      } catch (err) {
        console.error('Erreur transfert admin:', err);
        throw err;
      }
    },
    [associationId, fetchMembers]
  );

  /**
   * ✏️ Modifier un membre
   */
  const updateMember = useCallback(
    async (memberId: number, data: Partial<AssociationMember>) => {
      if (!associationId) throw new Error('ID association manquant');

      try {
        const response = await membersApi.update(associationId, memberId, data);

        if (response.success) {
          await fetchMembers();
          return response.data.member;
        }

        throw new Error('Échec modification membre');
      } catch (err) {
        console.error('Erreur modification membre:', err);
        throw err;
      }
    },
    [associationId, fetchMembers]
  );

  /**
   * 🗑️ Supprimer un membre
   */
  const deleteMember = useCallback(
    async (memberId: number) => {
      if (!associationId) throw new Error('ID association manquant');

      try {
        const response = await membersApi.delete(associationId, memberId);

        if (response.success) {
          await fetchMembers();
          return true;
        }

        throw new Error('Échec suppression membre');
      } catch (err) {
        console.error('Erreur suppression membre:', err);
        throw err;
      }
    },
    [associationId, fetchMembers]
  );

  /**
   * 📊 Enrichir membres avec détails rôles
   */
  const membersWithRoleDetails = useCallback((): MemberWithPermissions[] => {
    return members.map((member) => {
      const assignedRoleIds = member.assignedRoles || [];
      const roleDetails = assignedRoleIds
        .map((roleId) => {
          const role = roles.find((r) => r.id === roleId);
          return role
            ? {
                id: role.id,
                name: role.name,
                color: role.color
              }
            : null;
        })
        .filter((r): r is { id: string; name: string; color: string } => r !== null);

      // Calculer permissions effectives
      const permissions = new Set<string>();
      
      if (member.isAdmin) {
        // Admin a toutes les permissions (à adapter selon vos besoins)
        return {
          ...member,
          roleDetails,
          effectivePermissions: ['*'] // Toutes permissions
        };
      }

      // Permissions des rôles
      assignedRoleIds.forEach((roleId) => {
        const role = roles.find((r) => r.id === roleId);
        role?.permissions?.forEach((p) => permissions.add(p));
      });

      // Custom granted
      member.customPermissions?.granted?.forEach((p) => permissions.add(p));

      // Custom revoked
      member.customPermissions?.revoked?.forEach((p) => permissions.delete(p));

      return {
        ...member,
        roleDetails,
        effectivePermissions: Array.from(permissions)
      };
    });
  }, [members, roles]);

  // Charger au mount
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    // État
    members,
    membersWithRoleDetails: membersWithRoleDetails(),
    pagination,
    loading,
    error,

    // Actions CRUD
    fetchMembers,
    getMemberById,
    updateMember,
    deleteMember,

    // Actions Rôles
    getMemberRoles,
    assignRoles,
    removeRole,
    grantPermission,
    revokePermission,
    transferAdmin,

    // Helpers
    getTotalMembers: () => pagination.total,
    getActiveMembers: () => members.filter((m) => m.status === 'active'),
    getMembersByRole: (roleId: string) =>
      members.filter((m) => m.assignedRoles.includes(roleId)),
    getAdminMembers: () => members.filter((m) => m.isAdmin)
  };
}