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
  centralBoard?: {
    [key: string]: {
      userId: number
      name: string
      role: string
      phoneNumber?: string
      assignedAt?: string
    }
  }
  isMultiSection?: boolean
  sectionsCount: number
  sections?: Array<{
    id: number
    name: string
    country: string
    city: string
    membersCount: number
  }>
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

  // Fonction helper pour vérifier si le setup est terminé
  const isSetupComplete = (assoc: Association): boolean => {
    return !!(
      assoc.centralBoard && 
      Object.keys(assoc.centralBoard).length > 0
    )
  }

  useEffect(() => {
    const fetchAssociation = async () => {
      if (!associationId || !token) return
      
      setIsLoading(true)
      try {
        const timestamp = Date.now()
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}?t=${timestamp}`, 
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        )
        
        if (response.ok) {
          const result = await response.json()
          console.log('🔄 Données association rechargées:', result.data.association)
          console.log('🔍 CentralBoard:', result.data.association.centralBoard)
          console.log('🔍 IsSetupComplete:', isSetupComplete(result.data.association))
          
          // Assigner correctement toutes les données
          setAssociation(result.data)
          
        } else {
          console.error('Erreur chargement association')
          setError('Erreur chargement association')
        }
      } catch (error) {
        console.error('Erreur fetch association:', error)
        setError('Erreur de connexion')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAssociation()
    
    // Vérifier paramètre refresh dans URL
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('refresh')) {
      console.log('🔄 Refresh détecté, rechargement des données...')
      window.history.replaceState({}, '', window.location.pathname)
    }
    
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

  const refreshAssociationData = async () => {
    console.log('🔄 Refresh manuel des données...')
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}?t=${Date.now()}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        setAssociation(result.data)
        console.log('✅ Données rafraîchies:', result.data.association.centralBoard)
      }
    } catch (error) {
      console.error('Erreur refresh:', error)
    }
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

      {/* Bureau Central - Affiché si setup terminé */}
      {isSetupComplete(assoc) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bureau Central
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(assoc.centralBoard!).map(([role, member]) => (
                <div key={role} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-600 capitalize">{member.role}</div>
                  {member.phoneNumber && (
                    <div className="text-xs text-gray-500">{member.phoneNumber}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections - Affiché si multi-section */}
      {assoc.isMultiSection && assoc.sections && assoc.sections.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        Sections géographiques ({assoc.sections.length})
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assoc.sections.map((section) => (
          <div key={section.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{section.name}</h4>
              <Badge variant="secondary" className="text-xs">
                {section.membersCount} membres
              </Badge>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{section.city}, {section.country}</span>
              </div>
            </div>
            <div className="mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => router.push(`/modules/associations/${params.id}/sections/${section.id}`)}
              >
                Gérer la section
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Bouton ajouter section si moins que le maximum autorisé */}
      {assoc.sections.length < assoc.features.maxSections && (
        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => router.push(`/modules/associations/${params.id}/sections/create`)}
          >
            <Building2 className="h-4 w-4" />
            Ajouter une section
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
      )}





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
    <label className="text-sm font-medium text-gray-600">Type structure</label>
    <p className="text-gray-900 flex items-center gap-2">
      {assoc.isMultiSection ? (
        <>
          <Building2 className="h-4 w-4" />
          Multi-sections
        </>
      ) : (
        <>
          <Building2 className="h-4 w-4" />
          Association simple
        </>
      )}
    </p>
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

      {/* Statistiques - Mise à jour */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Users className="h-5 w-5" />
      Statistiques
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {assoc.isMultiSection && (
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600">{assoc.sectionsCount}</div>
        <div className="text-sm text-gray-600">Sections actives</div>
      </div>
    )}
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
        <Button 
        className="flex items-center gap-2"
        onClick={() => router.push(`/modules/associations/${params.id}/members`)}
      >
        <Users className="h-4 w-4" />
        Voir les membres
      </Button>
        
        {/* BOUTON TEMPORAIRE DEBUG */}
        <Button 
          onClick={refreshAssociationData}
          variant="outline"
          className="border-blue-500 text-blue-600"
        >
          🔄 Refresh Data
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => {
            const setupComplete = isSetupComplete(assoc)
            router.push(`/modules/associations/${params.id}/${setupComplete ? 'settings' : 'setup'}`)
          }}
        >
          <Settings className="h-4 w-4" />
          {isSetupComplete(assoc) ? 'Paramètres' : 'Terminer la configuration'}
        </Button>
        
        <Button variant="outline">
          Finances
        </Button>
      </div>
    </div>
  )
} 