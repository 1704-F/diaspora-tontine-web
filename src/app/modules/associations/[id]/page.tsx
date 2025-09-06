// src/app/modules/associations/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  FileText, 
  Settings, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Crown,
  Euro,
  Calendar
} from 'lucide-react'

interface Association {
  id: number
  name: string
  slug: string
  description: string
  status: string
  legalStatus: string
  registrationNumber: string
  domiciliationCountry: string
  primaryCurrency: string
  memberTypes: Array<{
    name: string
    cotisationAmount: number
    permissions: string[]
    description: string
  }>
  accessRights: {
    finances: string
    membersList: string
    statistics: string
    calendar: string
    expenses: string
  }
  cotisationSettings: {
    dueDay: number
    gracePeriodDays: number
    lateFeesEnabled: boolean
    lateFeesAmount: number
    inactivityThresholdMonths: number
  }
  documentsStatus: {
    statuts: { uploaded: boolean; validated: boolean; expiresAt: null }
    receipisse: { uploaded: boolean; validated: boolean; expiresAt: null }
    rib: { uploaded: boolean; validated: boolean; expiresAt: null }
    pv_creation: { uploaded: boolean; validated: boolean; expiresAt: null }
  }
  totalMembers: number
  activeMembers: number
  totalFundsRaised: string
  totalAidsGiven: string
  subscriptionPlan: string
  features: {
    maxMembers: number
    maxSections: number
    customTypes: boolean
    advancedReports: boolean
    apiAccess: boolean
  }
  theme: {
    primaryColor: string
    secondaryColor: string
    logo: null
  }
  created_at: string
}

interface UserMembership {
  memberType: string
  roles: string[]
  status: string
  totalContributed: string
  totalAidsReceived: string
  contributionStatus: string
}

interface AssociationDetailData {
  association: Association
  userMembership: UserMembership
  userPermissions: Record<string, boolean>
}

export default function AssociationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const [association, setAssociation] = useState<AssociationDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const associationId = params.id as string

  useEffect(() => {
    const fetchAssociation = async () => {
      if (!token) return

      try {
        setIsLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Erreur lors du chargement de l\'association')
        }

        const data = await response.json()
        
        if (data.success) {
          setAssociation(data.data)
        } else {
          setError('Association introuvable')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssociation()
  }, [associationId, token])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Actif</Badge>
      case 'pending_validation':
        return <Badge className="bg-yellow-100 text-yellow-700">En attente validation</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700">Suspendu</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDocumentStatus = (doc: { uploaded: boolean; validated: boolean }) => {
    if (doc.validated) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else if (doc.uploaded) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('president')) {
      return (
        <Badge className="bg-amber-100 text-amber-700">
          <Crown className="h-3 w-3 mr-1" />
          Président
        </Badge>
      )
    }
    return <Badge variant="secondary">{roles[0]}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement de l&apos;association...</p>
        </div>
      </div>
    )
  }

  if (error || !association) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
        <p className="text-gray-600 mb-4">{error || 'Association introuvable'}</p>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    )
  }

  const { association: assoc, userMembership } = association

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assoc.name}</h1>
            <p className="text-gray-600">{assoc.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(assoc.status)}
          {getRoleBadge(userMembership.roles)}
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Informations générales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Statut légal</label>
                <p className="text-gray-900">{assoc.legalStatus}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Numéro RNA</label>
                <p className="text-gray-900">{assoc.registrationNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Pays</label>
                <p className="text-gray-900">{assoc.domiciliationCountry}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Devise</label>
                <p className="text-gray-900 flex items-center gap-1">
                  <Euro className="h-4 w-4" />
                  {assoc.primaryCurrency}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Plan</label>
                <p className="text-gray-900 capitalize">{assoc.subscriptionPlan}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Créée le</label>
                <p className="text-gray-900">
                  {new Date(assoc.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{assoc.totalMembers}</div>
              <div className="text-sm text-gray-600">Total membres</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{assoc.activeMembers}</div>
              <div className="text-sm text-gray-600">Membres actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{assoc.totalFundsRaised}€</div>
              <div className="text-sm text-gray-600">Fonds levés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{assoc.totalAidsGiven}€</div>
              <div className="text-sm text-gray-600">Aides données</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents et statuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents légaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(assoc.documentsStatus).map(([key, doc]) => (
              <div key={key} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium text-sm capitalize">
                    {key.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-600">
                    {doc.validated ? 'Validé' : doc.uploaded ? 'En attente' : 'Non fourni'}
                  </div>
                </div>
                {getDocumentStatus(doc)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Types de membres */}
      <Card>
        <CardHeader>
          <CardTitle>Types de membres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assoc.memberTypes.map((type) => (
              <div key={type.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{type.name.replace('_', ' ')}</h4>
                  <span className="text-lg font-bold text-green-600">{type.cotisationAmount}€</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                <div className="flex flex-wrap gap-1">
                  {type.permissions.map((perm) => (
                    <Badge key={perm} variant="secondary" className="text-xs">
                      {perm.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paramètres cotisations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Paramètres cotisations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{assoc.cotisationSettings.dueDay}</div>
              <div className="text-sm text-gray-600">Jour d&apos;échéance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{assoc.cotisationSettings.gracePeriodDays}</div>
              <div className="text-sm text-gray-600">Délai de grâce (jours)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{assoc.cotisationSettings.inactivityThresholdMonths}</div>
              <div className="text-sm text-gray-600">Seuil inactivité (mois)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Voir les membres
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Paramètres
        </Button>
        <Button variant="outline">
          Finances
        </Button>
      </div>
    </div>
  )
}