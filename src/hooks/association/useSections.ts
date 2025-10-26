// src/hooks/association/useSections.ts
import { useState, useCallback } from 'react';
import { sectionsApi } from '@/lib/api/association/sections';
import type { 
  Section,
  CreateSectionPayload,
  UpdateSectionPayload,
  SectionStats,
  SectionFilters,
  SectionSortOptions
} from '@/types/association/section';

interface UseSectionsReturn {
  sections: Section[];
  selectedSection: Section | null;
  sectionStats: SectionStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSections: (
    associationId: number, 
    filters?: SectionFilters,
    sort?: SectionSortOptions
  ) => Promise<void>;
  fetchSectionDetails: (associationId: number, sectionId: number) => Promise<void>;
  createSection: (associationId: number, payload: CreateSectionPayload) => Promise<Section>;
  updateSection: (associationId: number, sectionId: number, payload: UpdateSectionPayload) => Promise<Section>;
  deleteSection: (associationId: number, sectionId: number) => Promise<void>;
  fetchSectionStats: (associationId: number, sectionId: number) => Promise<void>;
  transferMember: (
    associationId: number,
    sectionId: number,
    memberId: number,
    targetSectionId: number,
    reason?: string
  ) => Promise<void>;
  
  // Utils
  clearError: () => void;
  setSelectedSection: (section: Section | null) => void;
}

export function useSections(): UseSectionsReturn {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [sectionStats, setSectionStats] = useState<SectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer la liste des sections
  const fetchSections = useCallback(async (
    associationId: number,
    filters?: SectionFilters,
    sort?: SectionSortOptions
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await sectionsApi.listSections(associationId, filters, sort);
      setSections(response.data.sections || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des sections';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Récupérer les détails d'une section
  const fetchSectionDetails = useCallback(async (
    associationId: number,
    sectionId: number
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await sectionsApi.getSectionDetails(associationId, sectionId);
      setSelectedSection(response.data.section);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération de la section';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Créer une section
  const createSection = useCallback(async (
    associationId: number,
    payload: CreateSectionPayload
  ): Promise<Section> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await sectionsApi.createSection(associationId, payload);
      const newSection = response.data.section;
      setSections(prev => [...prev, newSection]);
      
      return newSection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la section';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mettre à jour une section
  const updateSection = useCallback(async (
    associationId: number,
    sectionId: number,
    payload: UpdateSectionPayload
  ): Promise<Section> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await sectionsApi.updateSection(associationId, sectionId, payload);
      const updatedSection = response.data.section;
      
      setSections(prev =>
        prev.map(section => section.id === sectionId ? updatedSection : section)
      );
      
      if (selectedSection?.id === sectionId) {
        setSelectedSection(updatedSection);
      }
      
      return updatedSection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la section';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedSection]);

  // Supprimer une section
  const deleteSection = useCallback(async (
    associationId: number,
    sectionId: number
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await sectionsApi.deleteSection(associationId, sectionId);
      
      setSections(prev => prev.filter(section => section.id !== sectionId));
      
      if (selectedSection?.id === sectionId) {
        setSelectedSection(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la section';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedSection]);

  // Récupérer les statistiques d'une section
  const fetchSectionStats = useCallback(async (
    associationId: number,
    sectionId: number
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await sectionsApi.getSectionStats(associationId, sectionId);
      if (response.data.stats) {
        setSectionStats(response.data.stats);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des statistiques';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Transférer un membre entre sections
  const transferMember = useCallback(async (
    associationId: number,
    sectionId: number,
    memberId: number,
    targetSectionId: number,
    reason?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await sectionsApi.transferMember(associationId, sectionId, {
        memberId,
        targetSectionId,
        reason,
      });
      
      // Rafraîchir les sections après le transfert
      await fetchSections(associationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du transfert du membre';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSections]);

  // Effacer l'erreur
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sections,
    selectedSection,
    sectionStats,
    isLoading,
    error,
    
    fetchSections,
    fetchSectionDetails,
    createSection,
    updateSection,
    deleteSection,
    fetchSectionStats,
    transferMember,
    
    clearError,
    setSelectedSection,
  };
}