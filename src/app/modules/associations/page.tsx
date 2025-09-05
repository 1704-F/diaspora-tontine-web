// 1. src/app/modules/associations/page.tsx
'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AssociationsDashboard } from '@/components/modules/associations/AssociationsDashboard'

export default function AssociationsModulePage() {
  return (
    <ProtectedRoute requiredModule="associations">
      <AssociationsDashboard />
    </ProtectedRoute>
  )
}
