//src\lib\constants\features.ts
/**
 * 🎯 Constantes centralisées - Features & Limites des associations
 * 
 * Utilisé pour définir les valeurs par défaut et les limites
 */

import type { AssociationFeatures } from '@/types/association';

/**
 * Features par défaut pour une nouvelle association
 */
export const DEFAULT_ASSOCIATION_FEATURES: AssociationFeatures = {
  maxMembers: 1000,
  maxSections: 10,
  customTypes: true,
  advancedReports: false,
  apiAccess: false,
  multiCurrency: false,
  customBranding: false,
};

/**
 * Limites pour les différents plans (futur usage)
 */
export const PLAN_LIMITS = {
  free: {
    maxMembers: 50,
    maxSections: 1,
    customTypes: false,
    advancedReports: false,
    apiAccess: false,
    multiCurrency: false,
    customBranding: false,
  },
  basic: {
    maxMembers: 200,
    maxSections: 10,
    customTypes: true,
    advancedReports: false,
    apiAccess: false,
    multiCurrency: false,
    customBranding: false,
  },
  premium: {
    maxMembers: 1000,
    maxSections: 10,
    customTypes: true,
    advancedReports: true,
    apiAccess: true,
    multiCurrency: true,
    customBranding: true,
  },
  unlimited: {
    maxMembers: Infinity,
    maxSections: Infinity,
    customTypes: true,
    advancedReports: true,
    apiAccess: true,
    multiCurrency: true,
    customBranding: true,
  },
} as const;

/**
 * Type pour les plans disponibles
 */
export type PlanType = keyof typeof PLAN_LIMITS;