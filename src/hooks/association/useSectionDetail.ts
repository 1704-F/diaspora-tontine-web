// src/hooks/association/useSectionDetail.ts
import { useState, useCallback, useEffect } from 'react';
import { sectionsApi } from '@/lib/api/association/sections';
import type { Section, SectionStats } from '@/types/association/section';

interface UseSectionDetailReturn {
  section: Section | null;
  stats: SectionStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSection: (sectionId: number) => Promise<void>;
  deleteSection: (sectionId: number) => Promise<void>;
  
  // Utils
  clearError: () => void;
}

/**
 * Hook spécialisé pour gérer les détails d'une section
 * À utiliser dans la page de détail d'une section
 */
export function useSectionDetail(associationId: number): UseSectionDetailReturn {
  const [section, setSection] = useState<Section | null>(null);
  const [stats, setStats] = useState<SectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les détails d'une section
  const fetchSection = useCallback(async (sectionId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await sectionsApi.getSectionDetails(associationId, sectionId);
      setSection(response.data.section);
      
      // Si les stats sont incluses dans la réponse
      if (response.data.stats) {
        setStats(response.data.stats);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de la section';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [associationId]);

  // Supprimer une section
  const deleteSection = useCallback(async (sectionId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await sectionsApi.deleteSection(associationId, sectionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la section';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [associationId]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    section,
    stats,
    isLoading,
    error,
    fetchSection,
    deleteSection,
    clearError,
  };
}