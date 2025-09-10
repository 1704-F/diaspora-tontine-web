// src/app/modules/associations/[id]/sections/[sectionId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import BureauSectionForm from '@/components/modules/associations/BureauSectionForm'
import { 
  ArrowLeft, 
  Building2,
  Users,
  MapPin,
  Globe,
  DollarSign,
  Settings,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Trash2
} from 'lucide-react'

interface Section {
  id: number
  name: string
  country: string
  city: string
  currency: string
  language: string
  description?: string
  membersCount: number
  contactPhone?: string
  contactEmail?: string
  bureauSection?: {
    responsable?: { userId?: number; name?: string; phoneNumber?: string }
    secretaire?: { userId?: number; name?: string; phoneNumber?: string }
    tresorier?: { userId?: number; name?: string; phoneNumber?: string }
  }
  stats?: {
    monthlyRevenue?: number
    bureauComplete?: boolean
    activeMembers?: number
    pendingMembers?: number
  }
  created_at: string
}

interface Association {
  id: number
  name: string
  isMultiSection: boolean
}

export default function SectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  
  const [section, setSection] = useState<Section | null>(null)
  const [association, setAssociation] = useState<Association | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingBureau, setIsEditingBureau] = useState(false)
  const [bureauForm, setBureauForm] = useState({})
  const [error, setError] = useState<string | null>(null)

  const associationId = params.id as string
  const sectionId = params.sectionId as string

  useEffect(() => {
    fetchSectionData()
  }, [associationId, sectionId, token])

  const fetchSectionData = async () => {
    if (!associationId || !sectionId || !token) return
    
    setIsLoading(true)
    try {
      // Charger les données de la section et de l'association
      const [sectionResponse, associationResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${sectionId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
      ])

      if (sectionResponse.ok && associationResponse.ok) {
        const [sectionResult, associationResult] = await Promise.all([
          sectionResponse.json(),
          associationResponse.json()
        ])
        
        setSection(sectionResult.data.section)
        setAssociation(associationResult.data.association)
        setBureauForm(sectionResult.data.section.bureauSection || {})
      } else {
        setError('Section ou association introuvable')
      }
    } catch (error) {
      console.error('Erreur chargement section:', error)
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateBureau = async () => {
    if (!token) return
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${sectionId}/bureau`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ bureauSection: bureauForm })
        }
      )
      
      if (response.ok) {
        setIsEditingBureau(false)
        fetchSectionData() // Recharger les données
      } else {
        console.error('Erreur mise à jour bureau section')
      }
    } catch (error) {
      console.error('Erreur mise à jour bureau section:', error)
    }
  }

  const handleDeleteSection = async () => {
    if (!token) return
    
    const confirmMessage = section?.membersCount && section.membersCount > 0 
      ? `Attention : Cette section contient ${section.membersCount} membre(s). La suppression déplacera ces membres vers la section principale. Continuer ?`
      : `Êtes-vous sûr de vouloir supprimer la section "${section?.name}" ?`
    
    if (!confirm(confirmMessage)) return
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${sectionId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      if (response.ok) {
        router.push(`/modules/associations/${associationId}/settings?tab=sections`)
      } else {
        const error = await response.json()
        alert(`Erreur : ${error.message || 'Impossible de supprimer cette section'}`)
      }
    } catch (error) {
      console.error('Erreur suppression section:', error)
      alert('Erreur de connexion lors de la suppression')
    }
  }

  const bureauCompleteness = () => {
    if (!section?.bureauSection) return { filled: 0, total: 3 }
    
    const bureau = section.bureauSection
    const roles = ['responsable', 'secretaire', 'tresorier']
    const filledRoles = roles.filter(role => bureau[role as keyof typeof bureau]?.name)
    return { filled: filledRoles.length, total: roles.length }
  }

  if (isLoading) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !section || !association) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">{error || 'Section introuvable'}</h1>
            <Button onClick={() => router.back()}>Retour</Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const completeness = bureauCompleteness()
  const isComplete = completeness.filled === completeness.total

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
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
              <h1 className="text-2xl font-bold text-gray-900">{section.name}</h1>
              <p className="text-gray-600">{association.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isComplete ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Bureau complet
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Bureau {completeness.filled}/{completeness.total}
              </Badge>
            )}
            
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 border-red-300"
              onClick={handleDeleteSection}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
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
                  <label className="text-sm font-medium text-gray-600">Localisation</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{section.city}, {section.country}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Devise</label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{section.currency}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Langue</label>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{section.language.toUpperCase()}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Créée le</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {new Date(section.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
              
              {section.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900">{section.description}</p>
                </div>
              )}
              
              {(section.contactPhone || section.contactEmail) && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact</label>
                  <div className="space-y-1">
                    {section.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">{section.contactPhone}</span>
                      </div>
                    )}
                    {section.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">{section.contactEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{section.membersCount}</div>
                <div className="text-sm text-gray-600">Total membres</div>
              </div>
              
              {section.stats?.activeMembers !== undefined && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{section.stats.activeMembers}</div>
                  <div className="text-sm text-gray-600">Membres actifs</div>
                </div>
              )}
              
              {section.stats?.pendingMembers !== undefined && section.stats.pendingMembers > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{section.stats.pendingMembers}</div>
                  <div className="text-sm text-gray-600">En attente</div>
                </div>
              )}
              
              {section.stats?.monthlyRevenue && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{section.stats.monthlyRevenue}€</div>
                  <div className="text-sm text-gray-600">Revenus/mois</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bureau de section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Bureau de section
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setIsEditingBureau(!isEditingBureau)}
              >
                {isEditingBureau ? (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditingBureau ? (
              <BureauSectionForm 
                bureau={bureauForm}
                setBureau={setBureauForm}
                onSave={handleUpdateBureau}
                onCancel={() => setIsEditingBureau(false)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['responsable', 'secretaire', 'tresorier'] as const).map(role => {
                  const member = section.bureauSection?.[role]
                  return (
                    <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 capitalize mb-2">
                        {role} section
                      </h4>
                      {member?.name ? (
                        <div>
                          <p className="text-gray-900 font-medium">{member.name}</p>
                          {member.phoneNumber && (
                            <p className="text-sm text-gray-600 flex items-center justify-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {member.phoneNumber}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Non assigné</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            
            {!isEditingBureau && !isComplete && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Le bureau de section n'est pas complet. Assignez au moins un responsable pour activer toutes les fonctionnalités.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button 
            className="flex items-center gap-2"
            onClick={() => router.push(`/modules/associations/${associationId}/sections/${sectionId}/members`)}
          >
            <Users className="h-4 w-4" />
            Gérer les membres ({section.membersCount})
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => router.push(`/modules/associations/${associationId}/sections/${sectionId}/settings`)}
          >
            <Settings className="h-4 w-4" />
            Paramètres section
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push(`/modules/associations/${associationId}/settings?tab=sections`)}
          >
            Voir toutes les sections
          </Button>
        </div>

        {/* Informations importantes */}
        <Card>
          <CardHeader>
            <CardTitle>Responsabilités du bureau section</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Responsable Section</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Coordination locale</li>
                  <li>• Liaison avec bureau central</li>
                  <li>• Validation aides {"<"} 500€</li>
                  <li>• Suivi activités section</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Secrétaire Section</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Gestion des membres</li>
                  <li>• Communications locales</li>
                  <li>• Organisation événements</li>
                  <li>• Tenue registres</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Trésorier Section</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Suivi cotisations locales</li>
                  <li>• Rapports financiers</li>
                  <li>• Validation aides {"<"} 500€</li>
                  <li>• Liaison trésorier central</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}