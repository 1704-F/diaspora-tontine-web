// src/types/user.ts
/**
 * Types pour les utilisateurs de la plateforme
 * Transversal - Utilisé par tous les modules
 * 
 * ✅ Mis à jour pour système RBAC dynamique
 */

// ============================================
// USER DE BASE
// ============================================
export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  profilePicture?: string
  
  // ✅ CORRECTION : Rôle plateforme global (super_admin pour gestion globale)
  role: 'member' | 'super_admin'
  
  // Modules activés
  enabledModules: {
    associations: { enabled: boolean; plan: string }
    tontines: { enabled: boolean; plan: string }
    family: { enabled: boolean; plan: string }
    commerce: { enabled: boolean; plan: string }
  }
  
  // Scores réputation
  associationReputationScore?: number
  tontineReputationScore?: number
  
  // ✅ CORRECTION : Union type pour supporter les 2 formats
  associations?: (UserAssociationMembership | UserAssociationSimple)[]
  tontines?: (UserTontineParticipation | UserTontineSimple)[]
  
  createdAt: string
  updatedAt: string
}

// ============================================
// RELATIONS USER - ASSOCIATIONS
// ============================================

/**
 * ✅ NOUVEAU : Membership complet avec RBAC
 * Représente l'appartenance d'un user à une association
 */
export interface UserAssociationMembership {
  // Identifiants
  id: number                    // ID association
  associationId: number         // ID association (dupliqué pour cohérence)
  name: string                  // ✅ CORRECTION : Backend renvoie 'name', pas 'associationName'
  
  // ✅ RBAC - Admin status
  isAdmin: boolean              // Admin de cette association ?
  
  // ✅ RBAC - Rôles attribués (ex: ["president_role", "tresorier_role"])
  assignedRoles: string[]
  
  // ✅ RBAC - Permissions custom
  customPermissions: {
    granted: string[]           // Permissions ajoutées manuellement
    revoked: string[]           // Permissions retirées
  }
  
  // Type cotisation (ex: "CDI", "Étudiant", "Retraité")
  memberType: string
  
  // Status membership
  status: 'pending' | 'active' | 'suspended' | 'excluded' | 'inactive'
  
  // Dates (optionnelles, pas dans réponse GET /users/me)
  joinDate?: string
  approvedDate?: string
}

/**
 * Version simplifiée pour affichage rapide
 * (ce que renvoie actuellement GET /users/me)
 */
export interface UserAssociationSimple {
  id: number                    // ID association
  name: string                  // Nom association
  role: string                  // ⚠️ Backend renvoie memberType ici (ex: "CDI")
  status: 'active' | 'suspended' | 'inactive'
}

// ============================================
// RELATIONS USER - TONTINES
// ============================================

/**
 * Participation d'un user à une tontine
 */
export interface UserTontineParticipation {
  id: number                    // ID tontine
  title: string                 // Titre tontine
  role: 'organizer' | 'participant'
  status: 'pending' | 'active' | 'approved' | 'defaulted' | 'completed'
  
  // Position si attribuée
  position?: number
  
  // Montant contribution
  contributionAmount?: number
  
  // Dates
  joinedAt: string
  wonAt?: string
}

/**
 * Version simplifiée pour affichage rapide
 * (ce que renvoie actuellement GET /users/me)
 */
export interface UserTontineSimple {
  id: number
  name: string
  role: 'organizer' | 'participant'
  status: string
}

// ============================================
// USER MINIMAL (pour affichage dans listes)
// ============================================
export interface UserMinimal {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  profilePicture?: string
}

// ============================================
// RÉPONSE API /users/me
// ============================================

/**
 * ✅ NOUVEAU : Type exact de la réponse API GET /users/me
 * Correspond à ce que renvoie userController.getProfile()
 */
export interface UserProfileResponse {
  success: boolean
  data: {
    user: User & {
      associations: UserAssociationSimple[]  // Format actuel backend
      tontines: UserTontineSimple[]          // Format actuel backend
    }
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Calculer la réputation globale d'un user
 */
export function calculateUserReputation(user: User): number {
  const associationScore = user.associationReputationScore || 0
  const tontineScore = user.tontineReputationScore || 0
  return Math.round((associationScore + tontineScore) / 2)
}

/**
 * Obtenir le nom complet d'un user
 */
export function getUserFullName(user: User | UserMinimal): string {
  return `${user.firstName} ${user.lastName}`
}

/**
 * Obtenir les initiales d'un user (pour avatar)
 */
export function getUserInitials(user: User | UserMinimal): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
}

/**
 * ✅ NOUVEAU : Vérifier si user est admin d'une association
 */
export function isAssociationAdmin(
  user: User, 
  associationId: number
): boolean {
  if (!user.associations) return false
  
  const membership = user.associations.find(a => {
    // UserAssociationMembership a associationId
    if ('associationId' in a) {
      return a.associationId === associationId
    }
    // UserAssociationSimple a id directement
    return a.id === associationId
  })
  
  if (!membership) return false
  
  // Si c'est UserAssociationMembership (format complet avec isAdmin)
  if ('isAdmin' in membership) {
    return membership.isAdmin
  }
  
  return false
}

/**
 * ✅ NOUVEAU : Obtenir les rôles d'un user dans une association
 */
export function getUserRolesInAssociation(
  user: User,
  associationId: number
): string[] {
  if (!user.associations) return []
  
  const membership = user.associations.find(a => {
    // UserAssociationMembership a associationId
    if ('associationId' in a) {
      return a.associationId === associationId
    }
    // UserAssociationSimple a id directement
    return a.id === associationId
  })
  
  if (!membership) return []
  
  // Si c'est UserAssociationMembership (format complet avec assignedRoles)
  if ('assignedRoles' in membership) {
    return membership.assignedRoles
  }
  
  return []
}

/**
 * ✅ NOUVEAU : Vérifier si user est organisateur d'une tontine
 */
export function isTontineOrganizer(
  user: User,
  tontineId: number
): boolean {
  const participation = user.tontines?.find(t => t.id === tontineId)
  return participation?.role === 'organizer'
}

/**
 * ✅ NOUVEAU : Vérifier si user est super admin plateforme
 */
export function isSuperAdmin(user: User): boolean {
  return user.role === 'super_admin'
}