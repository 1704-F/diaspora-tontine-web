// src/hooks/association/useAssociation.ts

import { useState, useEffect, useCallback } from 'react';
import { associationsApi } from '@/lib/api/association/associations';
import { Association, AssociationStats } from '@/types/association/association';
import { AssociationMember } from '@/types/association/member';
import { membersApi } from '@/lib/api/association/members';
import { useAuthStore } from '@/stores/authStore';

/**
 * 🏛️ Hook principal pour gérer une association
 * 
 * @example
 * ```tsx
 * const { association, currentMembership, loading, refetch } = useAssociation(associationId);
 * 
 * if (currentMembership?.isAdmin) {
 *   // Afficher fonctionnalités admin
 * }
 * ```
 */
export function useAssociation(associationId: number) {
  const { user } = useAuthStore();
  
  const [association, setAssociation] = useState<Association | null>(null);
  const [currentMembership, setCurrentMembership] = useState<AssociationMember | null>(null);
  const [stats, setStats] = useState<AssociationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 📥 Charger données association
   */
  const fetchAssociation = useCallback(async () => {
    if (!associationId) return;

    setLoading(true);
    setError(null);

    try {
      // Charger association
      const response = await associationsApi.getById(associationId);
      
      if (response.success) {
        setAssociation(response.data);
      }

      // Charger membership actuel de l'utilisateur
      if (user?.id) {
        const membersResponse = await membersApi.getAll(associationId, {
          // Filtrer pour avoir seulement le membre actuel
          // Note: Adapter selon votre API backend
        });

        if (membersResponse.success) {
          const myMembership = membersResponse.data.members.find(
            (m) => m.userId === user.id
          );
          setCurrentMembership(myMembership || null);
        }
      }
    } catch (err) {
      console.error('Erreur chargement association:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  }, [associationId, user?.id]);

  /**
   * 📊 Charger statistiques
   */
  const fetchStats = useCallback(async () => {
    if (!associationId) return;

    try {
      const response = await associationsApi.getStats(associationId);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  }, [associationId]);

  /**
   * ✏️ Mettre à jour association
   */
  const updateAssociation = useCallback(
    async (data: Partial<Association>) => {
      if (!associationId) return;

      try {
        const response = await associationsApi.update(associationId, data);
        if (response.success) {
          setAssociation(response.data);
        }
      } catch (err) {
        console.error('Erreur mise à jour association:', err);
        throw err;
      }
    },
    [associationId]
  );

  /**
   * 🔄 Recharger toutes les données
   */
  const refetch = useCallback(async () => {
    await Promise.all([fetchAssociation(), fetchStats()]);
  }, [fetchAssociation, fetchStats]);

  // Charger au mount
  useEffect(() => {
    fetchAssociation();
  }, [fetchAssociation]);

  return {
    // État
    association,
    currentMembership,
    stats,
    loading,
    error,

    // Actions
    refetch,
    updateAssociation,
    fetchStats,

    // Helpers
    isAdmin: currentMembership?.isAdmin || false,
    isMember: !!currentMembership,
    hasRole: (roleId: string) =>
      currentMembership?.assignedRoles.includes(roleId) || false
  };
}