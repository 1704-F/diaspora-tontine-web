'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Building2, Users, Plus, ArrowLeft, Crown } from 'lucide-react'

export function AssociationsDashboard() {
  const { user, getUserModuleState, loadUserProfile } = useAuthStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const userState = getUserModuleState('associations')

  // Forcer le chargement du profil si pas d'associations
  useEffect(() => {
    if (!user?.associations || user.associations.length === 0) {
      setIsLoading(true)
      loadUserProfile().finally(() => setIsLoading(false))
    }
  }, [user, loadUserProfile])

  const handleBackToModules = () => {
    router.push('/dashboard')
  }

  const userAssociations = user?.associations || []

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement de vos associations...</p>
        </div>
      </div>
    )
  }

  if (userState === 'new') {
    return (
      <div className="space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Module Associations</h1>
            <p className="text-gray-600">Gérez vos associations diaspora</p>
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
          <p className="text-gray-600">Gérez vos {userAssociations.length} association(s)</p>
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
          <Button
          onClick={() => router.push('/modules/associations/create')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle association
          </Button>
        </div>
      </div>

      {/* Liste des associations réelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userAssociations.map((association) => (
          <Card key={association.id} 
           className="hover:shadow-lg transition-shadow cursor-pointer"
           onClick={() => router.push(`/modules/associations/${association.id}`)}
           >

            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Building2 className="h-8 w-8 text-slate-600" />
                <div className="flex flex-col gap-1 items-end">
                  {association.role === 'fondateur' && (
                    <Badge variant="default" className="text-xs bg-amber-100 text-amber-700">
                      <Crown className="h-3 w-3 mr-1" />
                      Fondateur
                    </Badge>
                  )}
                  <Badge 
                    variant={association.status === 'active' ? 'default' : 'secondary'} 
                    className="text-xs"
                  >
                    {association.status === 'active' ? 'Actif' : 'En attente'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">{association.name}</CardTitle>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rôle :</span>
                  <span className="font-medium capitalize">{association.role}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Statut :</span>
                  <span className="font-medium capitalize">{association.status}</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Voir détails
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Associations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{userAssociations.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Associations Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userAssociations.filter(a => a.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Rôles Fondateur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {userAssociations.filter(a => a.role === 'fondateur').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Button debug temporaire - à supprimer */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <p className="text-sm text-gray-600 mb-2">Debug:</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => loadUserProfile()}
        >
          Recharger profil
        </Button>
      </div>
    </div>
  )
}