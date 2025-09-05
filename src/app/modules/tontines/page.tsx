// 2. src/app/modules/tontines/page.tsx
'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { TontinesDashboard } from '@/components/modules/tontines/TontinesDashboard'

export default function TontinesModulePage() {
  return (
    <ProtectedRoute requiredModule="tontines">
      <TontinesDashboard />
    </ProtectedRoute>
  )
}