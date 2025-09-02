'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

function TontinesContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Module Tontines
        </h1>
        <p className="text-gray-600 mt-1">
          Épargne collective et solidarité
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mes Tontines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Voir toutes mes tontines</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Créer Tontine</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Nouvelle tontine</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Participations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Mes participations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TontinesPage() {
  return (
    <ProtectedRoute requiredModule="tontines">
      <MainLayout currentModule="tontines">
        <TontinesContent />
      </MainLayout>
    </ProtectedRoute>
  )
}