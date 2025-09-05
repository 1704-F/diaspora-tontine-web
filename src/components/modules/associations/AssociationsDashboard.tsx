// 4. src/components/modules/associations/AssociationsDashboard.tsx
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Building2, Users, Plus } from 'lucide-react'

export function AssociationsDashboard() {
  const { user, getUserModuleState } = useAuthStore()
  const userState = getUserModuleState('associations')

  // ⚠️ ICI ON AURA BESOIN DU BACKEND
  // Pour récupérer les associations de l'utilisateur
  useEffect(() => {
    // TODO: Fetch user associations from API
    // fetchUserAssociations()
  }, [])

  if (userState === 'new') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue dans vos Associations
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Commencez par rejoindre une association existante ou créez la vôtre
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600 mx-auto" />
                <CardTitle className="text-center">Rejoindre</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Rejoignez une association existante de votre communauté
                </p>
                <Button className="w-full">
                  Rechercher des associations
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <Plus className="h-8 w-8 text-green-600 mx-auto" />
                <CardTitle className="text-center">Créer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Créez votre propre association et invitez des membres
                </p>
                <Button className="w-full" variant="outline">
                  Créer une association
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // État "active" - utilisateur avec associations
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Associations</h1>
          <p className="text-gray-600">Gérez vos participations associatives</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle association
        </Button>
      </div>

      {/* ⚠️ ICI ON AFFICHERA LES VRAIES ASSOCIATIONS DU USER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* TODO: Map des associations réelles */}
        <Card>
          <CardHeader>
            <CardTitle>Association Example</CardTitle>
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