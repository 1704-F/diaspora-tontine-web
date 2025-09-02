'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

function AssociationsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Module Associations
        </h1>
        <p className="text-gray-600 mt-1">
          Gérez vos associations diaspora
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mes Associations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Voir toutes mes associations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Créer Association</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Nouvelle association</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Vue d&apos;ensemble</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AssociationsPage() {
  return (
    <ProtectedRoute requiredModule="associations">
      <MainLayout currentModule="associations">
        <AssociationsContent />
      </MainLayout>
    </ProtectedRoute>
  )
}