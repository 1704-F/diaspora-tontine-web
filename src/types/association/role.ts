// src/types/association/role.ts

/**
 * 🔐 Permission disponible dans le système RBAC
 */
export interface Permission {
  id: string;
  name: string;
  category: 'finances' | 'membres' | 'administration' | 'documents' | 'evenements';
  description: string;
}

/**
 * 👔 Rôle configurable par l'association
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // IDs des permissions
  isUnique: boolean; // Un seul membre peut avoir ce rôle (ex: Président)
  isMandatory: boolean; // Au moins 1 membre doit avoir ce rôle
  canBeRenamed: boolean; // L'admin peut renommer ce rôle
  color: string; // Couleur hex (ex: "#3B82F6")
  iconName?: string; // Nom de l'icône Lucide (ex: "Crown", "Wallet")
}

/**
 * 📋 Configuration complète des rôles d'une association
 */
export interface RolesConfiguration {
  version: string; // "1.0"
  roles: Role[];
  availablePermissions: Permission[];
}

/**
 * 🎭 Rôle enrichi avec compteur de membres (pour UI)
 */
export interface RoleWithUsage extends Role {
  membersCount: number;
}

/**
 * 📊 Permissions custom d'un membre (override rôles)
 */
export interface CustomPermissions {
  granted: string[]; // Permissions ajoutées manuellement
  revoked: string[]; // Permissions retirées manuellement
}

/**
 * 🏷️ Template de rôle suggéré (pour création rapide)
 */
export interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  suggestedPermissions: string[];
  category: 'bureau' | 'gestion' | 'operationnel';
  iconName: string;
  color: string;
}

/**
 * ✅ Validation rules pour création/modification rôle
 */
export interface RoleValidation {
  isNameUnique: boolean;
  hasMinimumPermissions: boolean; // Au moins 1 permission
  isUniqueRoleConflict: boolean; // Vérifier si déjà un rôle unique existe
  errors: string[];
}

/**
 * 🔍 Options de filtrage des rôles (pour UI liste)
 */
export interface RoleFilters {
  search?: string;
  categories?: Permission['category'][];
  onlyUnique?: boolean;
  onlyMandatory?: boolean;
}

/**
 * 📦 Réponse API GET /roles
 */
export interface GetRolesResponse {
  success: boolean;
  data: {
    roles: RoleWithUsage[];
    availablePermissions: Permission[];
    totalRoles: number;
    totalPermissions: number;
  };
}

/**
 * 📦 Réponse API GET /roles/:roleId
 */
export interface GetRoleDetailsResponse {
  success: boolean;
  data: {
    role: RoleWithUsage;
    assignedMembers: Array<{
      id: number;
      name: string;
      memberType: string;
    }>;
  };
}

/**
 * 📝 Payload création/modification rôle
 */
export interface CreateRolePayload {
  name: string;
  description: string;
  permissions: string[];
  isUnique?: boolean;
  isMandatory?: boolean;
  color: string;
  iconName?: string;
}

export type UpdateRolePayload = Partial<CreateRolePayload>;

/**
 * 🎨 Catégories de permissions groupées (pour UI grid)
 */
export interface GroupedPermissions {
  finances: Permission[];
  membres: Permission[];
  administration: Permission[];
  documents: Permission[];
  evenements: Permission[];
}

/**
 * 🔄 État du formulaire de rôle (pour UI)
 */
export interface RoleFormState {
  name: string;
  description: string;
  selectedPermissions: Set<string>;
  isUnique: boolean;
  isMandatory: boolean;
  color: string;
  iconName: string;
}

// ============================================
// TEMPLATES PRÉ-DÉFINIS (pour suggestions)
// ============================================

export const DEFAULT_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'president',
    name: 'Président',
    description: 'Direction générale de l\'association',
    suggestedPermissions: [
      'modify_settings',
      'manage_members',
      'validate_expenses',
      'view_finances',
      'create_events',
      'manage_documents'
    ],
    category: 'bureau',
    iconName: 'Crown',
    color: '#EF4444'
  },
  {
    id: 'treasurer',
    name: 'Trésorier',
    description: 'Gestion financière et comptabilité',
    suggestedPermissions: [
      'validate_expenses',
      'view_finances',
      'manage_budgets',
      'export_reports'
    ],
    category: 'bureau',
    iconName: 'Wallet',
    color: '#10B981'
  },
  {
    id: 'secretary',
    name: 'Secrétaire',
    description: 'Gestion administrative et documents',
    suggestedPermissions: [
      'manage_documents',
      'create_events',
      'view_members',
      'send_notifications'
    ],
    category: 'bureau',
    iconName: 'FileText',
    color: '#3B82F6'
  },
  {
    id: 'coordinator',
    name: 'Coordinateur',
    description: 'Coordination des activités',
    suggestedPermissions: [
      'create_events',
      'view_members',
      'send_notifications',
      'view_finances'
    ],
    category: 'gestion',
    iconName: 'Users',
    color: '#8B5CF6'
  }
];

// ============================================
// COULEURS SUGGESTIONS (pour sélecteur UI)
// ============================================

export const ROLE_COLOR_PALETTE = [
  { name: 'Rouge', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Jaune', hex: '#EAB308' },
  { name: 'Vert', hex: '#10B981' },
  { name: 'Bleu', hex: '#3B82F6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Rose', hex: '#EC4899' },
  { name: 'Gris', hex: '#6B7280' }
] as const;