'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, loadUserProfile } = useAuthStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user || !user.associations) {
      setIsLoading(true)
      loadUserProfile().finally(() => setIsLoading(false))
    }
  }, [user, loadUserProfile])

  if (isLoading) {
    return <div className="p-6">Chargement du profil...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Mon Profil</h1>
        </div>

        {/* Profil utilisateur */}
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Prénom</label>
                <p className="text-gray-900">{user?.firstName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Nom</label>
                <p className="text-gray-900">{user?.lastName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Téléphone</label>
                <p className="text-gray-900">{user?.phoneNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{user?.email || 'Non renseigné'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules activés */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Modules activés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {user?.enabledModules && Object.entries(user.enabledModules).map(([module, config]) => (
                <div key={module} className="flex items-center justify-between p-3 border rounded">
                  <span className="capitalize">{module}</span>
                  <span className={`text-xs px-2 py-1 rounded ${config.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {config.enabled ? 'Activé' : 'Désactivé'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}