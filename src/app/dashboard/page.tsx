'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { Building2, Wallet, Users, Store } from 'lucide-react'

const moduleCards = [
  {
    id: 'associations',
    title: 'Associations',
    description: 'Gérez vos associations diaspora',
    icon: Building2,
    colors: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      button: 'bg-slate-600 hover:bg-slate-700'
    },
    available: true,
  },
  {
    id: 'tontines',
    title: 'Tontines',
    description: 'Épargne collective et solidarité',
    icon: Wallet,
    colors: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700'
    },
    available: true,
  },
  {
    id: 'family',
    title: 'Budget Famille',
    description: 'Gestion financière familiale',
    icon: Users,
    colors: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      button: 'bg-rose-600 hover:bg-rose-700'
    },
    available: false,
  },
  {
    id: 'commerce',
    title: 'Commerce Diaspora',
    description: 'Marketplace communautaire',
    icon: Store,
    colors: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700'
    },
    available: false,
  },
]

function DashboardContent() {
  const { user, setSelectedModule } = useAuthStore()
  const router = useRouter()

  // Redirection automatique vers le dernier module utilisé
  useEffect(() => {
    const lastModule = localStorage.getItem('lastSelectedModule')
    const validModules = ['associations', 'tontines']
    
    if (lastModule && validModules.includes(lastModule)) {
      // Optionnel : redirection automatique
      // router.push(`/modules/${lastModule}`)
    }
  }, [router])

  const handleModuleSelect = (moduleId: string) => {
    if (moduleId === 'associations' || moduleId === 'tontines') {
      // Sauvegarder le module sélectionné
      setSelectedModule(moduleId as 'associations' | 'tontines')
      localStorage.setItem('lastSelectedModule', moduleId)
      
      // Rediriger vers le dashboard du module
      router.push(`/modules/${moduleId}`)
    }
  }

  const getLastUsedBadge = (moduleId: string) => {
    const lastModule = localStorage.getItem('lastSelectedModule')
    return lastModule === moduleId ? (
      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
        Dernier utilisé
      </Badge>
    ) : null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-500 rounded text-white font-bold text-sm">
                DT
              </div>
              <span className="text-xl font-semibold text-gray-900">
                DiasporaTontine
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <Button variant="outline" size="sm">
                Profil
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Bienvenue, {user?.firstName} !
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez le module que vous souhaitez utiliser pour gérer vos activités communautaires
          </p>
        </div>

        {/* Grid des modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {moduleCards.map((module) => {
            const IconComponent = module.icon
            const isEnabled = user?.enabledModules?.[module.id as keyof typeof user.enabledModules]?.enabled || false
            
            // Déterminer si l'utilisateur a des données dans ce module
            let hasData = false
            let dataCount = 0
            
            if (module.id === 'associations' && user?.associations) {
              hasData = user.associations.length > 0
              dataCount = user.associations.length
            } else if (module.id === 'tontines' && user?.tontines) {
              hasData = user.tontines.length > 0
              dataCount = user.tontines.length
            }
            
            return (
              <Card 
                key={module.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                  module.available 
                    ? `${module.colors.bg} ${module.colors.border} hover:shadow-lg` 
                    : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                }`}
                onClick={() => module.available && handleModuleSelect(module.id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-4 rounded-xl ${module.colors.iconBg}`}>
                      <IconComponent className={`h-8 w-8 ${module.colors.iconColor}`} />
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {!module.available && (
                        <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                          Bientôt disponible
                        </Badge>
                      )}
                      {isEnabled && module.available && (
                        <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                          Activé
                        </Badge>
                      )}
                      {hasData && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          {dataCount} {module.id === 'associations' ? 'association(s)' : 'tontine(s)'}
                        </Badge>
                      )}
                      {getLastUsedBadge(module.id)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardTitle className="text-xl mb-3 text-gray-900">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mb-6 text-sm leading-relaxed">
                    {module.description}
                    {hasData && (
                      <span className="block mt-2 text-xs text-green-600 font-medium">
                        Vous avez {dataCount} {module.id === 'associations' ? 'association(s)' : 'tontine(s)'}
                      </span>
                    )}
                  </CardDescription>
                  <Button 
                    className={`w-full text-white ${
                      module.available 
                        ? module.colors.button
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!module.available}
                  >
                    {module.available ? 'Accéder au module' : 'Prochainement'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Section info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Nouveaux modules à venir
            </h3>
            <p className="text-gray-600 text-sm">
              Nous travaillons sur les modules <strong>Budget Famille</strong> et <strong>Commerce Diaspora</strong> 
              pour enrichir votre expérience communautaire. Restez connectés !
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}