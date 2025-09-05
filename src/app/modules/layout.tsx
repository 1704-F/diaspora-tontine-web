// 3. src/app/modules/layout.tsx
'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { useAuthStore } from '@/stores/authStore'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { selectedModule } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  
  // Extraire le module actuel depuis l'URL
  const currentModule = pathname.split('/')[2] as 'associations' | 'tontines'
  
  const handleBackToModules = () => {
    router.push('/dashboard')
  }

  return (
    <MainLayout 
      currentModule={currentModule}
      additionalHeaderActions={
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleBackToModules}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Changer de module
        </Button>
      }
    >
      {children}
    </MainLayout>
  )
}