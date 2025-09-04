// ============================================
// 4. PAGE DASHBOARD (src/app/dashboard/page.tsx)
// ============================================
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'

const moduleCards = [
  {
    id: 'associations',
    title: 'Associations',
    description: 'Gérez vos associations diaspora',
    icon: '🏛️',
    color: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    available: true,
  },
  {
    id: 'tontines',
    title: 'Tontines',
    description: 'Épargne collective et solidarité',
    icon: '💰', 
    color: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100',
    available: true,
  },
  {
    id: 'family',
    title: 'Budget Famille',
    description: 'Gestion financière familiale',
    icon: '👨‍👩‍👧‍👦',
    color: 'bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-100',
    available: false,
  },
  {
    id: 'commerce',
    title: 'Commerce Diaspora',
    description: 'Marketplace communautaire',
    icon: '🏪',
    color: 'bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100',
    available: false,
  },
]

function DashboardContent() {
  const { user } = useAuthStore()
  const router = useRouter()

  const handleModuleSelect = (moduleId: string) => {
    if (moduleId === 'associations' || moduleId === 'tontines') {
      router.push(`/modules/${moduleId}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue, {user?.firstName} !
        </h1>
        <p className="text-gray-600 mt-1">
          Choisissez le module que vous souhaitez utiliser
        </p>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {moduleCards.map((module) => {
          

          const isEnabled = user?.enabledModules?.[module.id as keyof typeof user.enabledModules]?.enabled || false
          
          return (
            <Card 
              key={module.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                module.available ? module.color : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
              onClick={() => module.available && handleModuleSelect(module.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${module.iconBg}`}>
                    <span className="text-2xl">{module.icon}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!module.available && (
                      <Badge variant="secondary" className="text-xs">
                        Bientôt
                      </Badge>
                    )}
                    {isEnabled && (
                      <Badge variant="success" className="text-xs">
                        Activé
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl mb-2">{module.title}</CardTitle>
                <CardDescription className="mb-4">
                  {module.description}
                </CardDescription>
                <Button 
                  variant={module.available ? "default" : "secondary"}
                  disabled={!module.available}
                  className="w-full"
                >
                  {module.available ? 'Accéder' : 'Bientôt disponible'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {user?.associations?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Associations</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {user?.tontines?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Tontines</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Object.values(user?.enabledModules || {}).filter(m => m.enabled).length}
              </div>
              <div className="text-sm text-gray-600">Modules actifs</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout currentModule="associations">
        <DashboardContent />
      </MainLayout>
    </ProtectedRoute>
  )
}