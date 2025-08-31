// ============================================
// 5. PERMISSION GATE COMPONENT (src/components/auth/PermissionGate.tsx)
// ============================================
'use client'

import { useAuthStore } from '@/stores/authStore'

interface PermissionGateProps {
  module: 'associations' | 'tontines' | 'family' | 'commerce'
  permission?: string
  role?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ 
  module, 
  permission, 
  role, 
  fallback, 
  children 
}: PermissionGateProps) {
  const { user } = useAuthStore()

  if (!user) {
    return fallback || null
  }

  // Vérifier accès module
  const hasModuleAccess = user.enabledModules[module]?.enabled
  if (!hasModuleAccess) {
    return fallback || null
  }

  // Vérifier rôle global
  if (role && !role.includes(user.role)) {
    return fallback || null
  }

  // Vérifier permission spécifique (TODO: implémenter logique permissions)
  if (permission) {
    // Logique de vérification des permissions contextuelles
    // À implémenter selon les besoins spécifiques
  }

  return <>{children}</>
}