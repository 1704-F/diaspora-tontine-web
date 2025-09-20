// src/components/auth/DataReviewStep.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

interface ExistingDataSource {
  module: {
    name: string
    icon: string
    displayName: string
  }
  source: {
    name: string
    addedBy: string
    type: string
  }
  data: {
    firstName?: string
    lastName?: string
    email?: string
    dateOfBirth?: string
    gender?: string
    address?: string
    city?: string
    country?: string
    postalCode?: string
  }
  metadata: {
    priority: number
    lastUpdated: string
    userId: number
  }
  membershipInfo?: any
  participationInfo?: any
  section?: any
}

interface DataReviewStepProps {
  phoneNumber: string
  existingDataSources: ExistingDataSource[]
  onUseExistingData: (selectedSource: ExistingDataSource) => void
  onManualEntry: () => void
  onModifyAndUse: (selectedSource: ExistingDataSource) => void
}

export function DataReviewStep({ 
  phoneNumber, 
  existingDataSources, 
  onUseExistingData, 
  onManualEntry, 
  onModifyAndUse 
}: DataReviewStepProps) {
  const [selectedSource, setSelectedSource] = useState<ExistingDataSource | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'bg-green-100 text-green-800'
    if (priority >= 70) return 'bg-blue-100 text-blue-800'
    if (priority >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 90) return 'Très fiable'
    if (priority >= 70) return 'Fiable'
    if (priority >= 50) return 'Modérément fiable'
    return 'Ancienne donnée'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleUseSource = async (source: ExistingDataSource) => {
    setIsLoading(true)
    try {
      await onUseExistingData(source)
      toast.success('Données récupérées avec succès!')
    } catch (error) {
      toast.error('Erreur lors de la récupération des données')
    } finally {
      setIsLoading(false)
    }
  }

  const handleModifySource = async (source: ExistingDataSource) => {
    setIsLoading(true)
    try {
      await onModifyAndUse(source)
    } catch (error) {
      toast.error('Erreur lors du traitement')
    } finally {
      setIsLoading(false)
    }
  }

  if (existingDataSources.length === 0) {
    return (
      <div className="text-center space-y-4">
        <div className="text-lg font-medium text-gray-900">
          Aucune donnée existante trouvée
        </div>
        <p className="text-gray-600">
          Nous allons créer votre profil from scratch
        </p>
        <Button onClick={onManualEntry} className="w-full">
          Continuer la création de compte
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">
          🔍 Nous vous connaissons déjà !
        </h3>
        <p className="text-gray-600">
          Nous avons trouvé des informations vous concernant dans {existingDataSources.length} source(s).
          <br />
          Vous pouvez les utiliser pour gagner du temps.
        </p>
      </div>

      {/* Sources de données */}
      <div className="space-y-4">
        {existingDataSources.map((source, index) => (
          <Card 
            key={`${source.module.name}-${source.metadata.userId}-${index}`}
            className={`p-4 border-2 transition-all cursor-pointer ${
              selectedSource?.metadata.userId === source.metadata.userId
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedSource(source)}
          >
            <div className="space-y-3">
              {/* En-tête source */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{source.module.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {source.module.displayName} • {source.source.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Ajouté par {source.source.addedBy}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(source.metadata.priority)}>
                    {getPriorityLabel(source.metadata.priority)}
                  </Badge>
                  <div className="text-xs text-gray-500">
                    {formatDate(source.metadata.lastUpdated)}
                  </div>
                </div>
              </div>

              {/* Données trouvées */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {source.data.firstName && (
                  <div>
                    <span className="text-gray-500">Prénom:</span> 
                    <span className="ml-1 font-medium">{source.data.firstName}</span>
                  </div>
                )}
                {source.data.lastName && (
                  <div>
                    <span className="text-gray-500">Nom:</span> 
                    <span className="ml-1 font-medium">{source.data.lastName}</span>
                  </div>
                )}
                {source.data.email && (
                  <div>
                    <span className="text-gray-500">Email:</span> 
                    <span className="ml-1 font-medium">{source.data.email}</span>
                  </div>
                )}
                {source.data.dateOfBirth && (
                  <div>
                    <span className="text-gray-500">Naissance:</span> 
                    <span className="ml-1 font-medium">
                      {formatDate(source.data.dateOfBirth)}
                    </span>
                  </div>
                )}
                {source.data.address && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Adresse:</span> 
                    <span className="ml-1 font-medium">
                      {source.data.address}
                      {source.data.city && `, ${source.data.city}`}
                      {source.data.country && ` (${source.data.country})`}
                    </span>
                  </div>
                )}
              </div>

              {/* Infos contextuelles */}
              {(source.membershipInfo || source.participationInfo || source.section) && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {source.membershipInfo && (
                      <Badge variant="outline">
                        {source.membershipInfo.memberType}
                      </Badge>
                    )}
                    {source.participationInfo && (
                      <Badge variant="outline">
                        Position {source.participationInfo.position}
                      </Badge>
                    )}
                    {source.section && (
                      <Badge variant="outline">
                        Section {source.section.name}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      {selectedSource && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-900">
            Source sélectionnée: {selectedSource.module.displayName} • {selectedSource.source.name}
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => handleUseSource(selectedSource)}
              loading={isLoading}
              className="flex-1"
            >
              ✅ Utiliser ces données
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleModifySource(selectedSource)}
              loading={isLoading}
              className="flex-1"
            >
              ✏️ Modifier et utiliser
            </Button>
          </div>
        </div>
      )}

      {/* Option saisie manuelle */}
      <div className="pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onManualEntry}
          className="w-full"
          disabled={isLoading}
        >
          🆕 Ignorer et saisir manuellement
        </Button>
      </div>

      {/* Résumé */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <div>
          📊 {existingDataSources.length} source(s) • {existingDataSources.map(s => s.module.displayName).join(', ')}
        </div>
        <div>
          🔐 Vos données sont sécurisées et vous gardez le contrôle total
        </div>
      </div>
    </div>
  )
}