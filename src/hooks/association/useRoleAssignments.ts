// src/hooks/association/useRoleAssignments.ts
import { useState, useEffect } from 'react';
import { membersApi } from '@/lib/api/association/members';
import type { AssociationMember } from '@/types/association/member';

export function useRoleAssignments(associationId: number) {
  const [assignments, setAssignments] = useState<Map<string, AssociationMember>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAssignments = async () => {
      setLoading(true);
      try {
        const response = await membersApi.getAll(associationId);
        if (response.success && response.data?.members) {
          const map = new Map<string, AssociationMember>();
          
          response.data.members.forEach((member) => {
            if (member.status === 'active' && member.assignedRoles) {
              member.assignedRoles.forEach((roleId) => {
                map.set(roleId, member);
              });
            }
          });
          
          setAssignments(map);
        }
      } catch (error) {
        console.error('Erreur chargement assignations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [associationId]);

  const isRoleAssigned = (roleId: string): boolean => {
    return assignments.has(roleId);
  };

  const getRoleAssignee = (roleId: string): AssociationMember | undefined => {
    return assignments.get(roleId);
  };

  return { isRoleAssigned, getRoleAssignee, loading };
}