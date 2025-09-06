// 5. src/components/modules/tontines/TontinesDashboard.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Wallet, Users, Plus, ArrowLeft } from 'lucide-react'

export function TontinesDashboard() {
  const { user, getUserModuleState } = useAuthStore()
  const router = useRouter()
  const userState = getUserModuleState('tontines')

  // ⚠️ ICI ON AURA BESOIN DU BACKEND
  // Pour récupérer les tontines de l'utilisateur
  useEffect(() => {
    // TODO: Fetch user tontines from API
    // fetchUserTontines()
  }, [])

  const handleBackToModules = () => {
    router.push('/dashboard')
  }

  if (userState === 'new') {
    return (
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Module Tontines</h1>
            <p className="text-gray-600">Épargne collective et solidarité</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleBackToModules}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Changer de module
          </Button>
        </div>

        <div className="text-center py-12">
          <Wallet className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue dans vos Tontines
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Découvrez l&apos;épargne collective et rejoignez ou créez une tontine
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mx-auto" />
                <CardTitle className="text-center">Rejoindre</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Participez à une tontine existante
                </p>
                <Button className="w-full">
                  Explorer les tontines
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <Plus className="h-8 w-8 text-green-600 mx-auto" />
                <CardTitle className="text-center">Organiser</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Créez et organisez votre propre tontine
                </p>
                <Button className="w-full" variant="outline">
                  Créer une tontine
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // État "active" - utilisateur avec tontines
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Tontines</h1>
          <p className="text-gray-600">Gérez vos participations aux tontines</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleBackToModules}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Changer de module
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tontine
          </Button>
        </div>
      </div>

      {/* ⚠️ ICI ON AFFICHERA LES VRAIES TONTINES DU USER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* TODO: Map des tontines réelles */}
        <Card>
          <CardHeader>
            <CardTitle>Tontine Example</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Données à venir du backend...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}