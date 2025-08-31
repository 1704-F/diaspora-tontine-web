// ============================================
// 4. PROTECTED ROUTE COMPONENT (src/components/auth/ProtectedRoute.tsx)
// ============================================
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredModule?: 'associations' | 'tontines' | 'family' | 'commerce'
  requiredRole?: string[]
}

export function ProtectedRoute({ 
  children, 
  requiredModule,
  requiredRole 
}: ProtectedRouteProps) {
  const { user, token, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Vérifier si utilisateur connecté
    if (!isLoading && !token) {
      router.push('/login')
      return
    }

    // Vérifier accès module
    if (user && requiredModule) {
      const hasModuleAccess = user.enabledModules[requiredModule]?.enabled
      if (!hasModuleAccess) {
        router.push('/dashboard')
        return
      }
    }

    // Vérifier rôle (si spécifié)
    if (user && requiredRole) {
      const hasRole = requiredRole.includes(user.role)
      if (!hasRole) {
        router.push('/unauthorized')
        return
      }
    }
  }, [user, token, isLoading, requiredModule, requiredRole, router])

  if (isLoading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}