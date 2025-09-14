// src/app/modules/associations/create/page.tsx
'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Users, 
  Building2,
  Upload,
  Settings,
  MapPin,
  Crown,
  UserCheck,
  DollarSign,
  FileText,
  Globe
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

// Types
interface Association {
  id: number
  name: string
  description: string
  legalStatus: string
  country: string
  city: string
  status: string
  memberTypes: any[]
}

interface BureauRole {
  userId?: number 
  firstName: string
  lastName: string
  phoneNumber: string
  role: string
}

interface FormData {
  // Choix structure
  isMultiSection: boolean
  
  // Bureau central
  bureauCentral: {
    president: BureauRole
    secretaire: BureauRole  
    tresorier: BureauRole
  }
  
  // Première section (si multi-sections)
  firstSection?: {
    name: string
    country: string
    city: string
    currency: string
    language: string
  }
}

const ETAPES = [
  { id: 1, title: 'Structure', icon: Building2, description: 'Choisir le type d\'organisation' },
  { id: 2, title: 'Bureau Central', icon: Users, description: 'Configurer la gouvernance' },
  { id: 3, title: 'Sections', icon: MapPin, description: 'Configuration géographique' },
  { id: 4, title: 'Documents', icon: FileText, description: 'Validation KYB' }
]

const LANGUES_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italiano' },
  { value: 'es', label: 'Español' }
]

const DEVISES_OPTIONS = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'Dollar US ($)' },
  { value: 'GBP', label: 'Livre Sterling (£)' },
  { value: 'CAD', label: 'Dollar Canadien (CAD)' }
]

export default function AssociationSetupPage() {
  const { user, token } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const associationId = params?.id as string
  
  const [etapeActuelle, setEtapeActuelle] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAssociation, setIsLoadingAssociation] = useState(true)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [association, setAssociation] = useState<Association | null>(null)
  const [uploadedDocuments, setUploadedDocuments] = useState<{[key: string]: any}>({})
  const [members, setMembers] = useState<any[]>([])

  
  const [formData, setFormData] = useState<FormData>({
  isMultiSection: false,
  bureauCentral: {
    president: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'president'
    },
    secretaire: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'secretaire'
    },
    tresorier: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'tresorier'
    }
  }
})

  // Charger les données de l'association
  useEffect(() => {
  const fetchData = async () => {
    if (!associationId || !token) {
      setIsLoadingAssociation(false)
      return
    }
    
    try {
      // Charger l'association ET les membres
      const [associationResponse, membersResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      if (associationResponse.ok) {
        const result = await associationResponse.json()
        setAssociation(result.data.association)
      }
      
      if (membersResponse.ok) {
        const membersResult = await membersResponse.json()
        setMembers(membersResult.data.members || [])
      }
      
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setIsLoadingAssociation(false)
    }
  }
  
  fetchData()
}, [associationId, token])

  // Validation par étape
  const validateEtape = (etape: number): boolean => {
    const newErrors: {[key: string]: string} = {}
    
    switch (etape) {
      case 2:
  // Validation bureau central : président obligatoire
  if (!formData.bureauCentral.president.userId) {
    newErrors.president_firstName = 'Sélection du président requise'
  }
  break
      
      case 3:
        if (formData.isMultiSection && formData.firstSection) {
          if (!formData.firstSection.name.trim()) {
            newErrors.sectionName = 'Nom de section requis'
          }
          if (!formData.firstSection.country) {
            newErrors.sectionCountry = 'Pays requis'
          }
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
  if (validateEtape(etapeActuelle)) {
    // Toujours inclure toutes les étapes maintenant
    setEtapeActuelle(prev => Math.min(prev + 1, 4))
  }
}

const handlePrevious = () => {
  // Navigation normale, plus de saut d'étapes
  setEtapeActuelle(prev => Math.max(prev - 1, 1))
}

  const handleSaveSetup = async () => {
  if (!validateEtape(etapeActuelle)) return
  
  setIsLoading(true)
  try {
    const setupData = {
      bureauCentral: formData.bureauCentral,
      isMultiSection: formData.isMultiSection,
      ...(formData.isMultiSection && formData.firstSection ? { 
        firstSection: formData.firstSection 
      } : {})
    }
    
    console.log('Données envoyées au backend:', setupData)

    const bureauResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/setup`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(setupData)
    })

    if (!bureauResponse.ok) {
      const errorData = await bureauResponse.text()
      console.error('Erreur détaillée du serveur:', errorData)
      throw new Error('Erreur sauvegarde bureau')
    }

    const result = await bureauResponse.json()
    console.log('Setup réussi:', result)

    const refreshUrl = `/modules/associations/${associationId}?refresh=${Date.now()}`
    console.log('Redirection avec refresh vers:', refreshUrl)
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`association_${associationId}`)
      localStorage.removeItem(`association_${associationId}`)
    }
    
    router.push(refreshUrl)
    
  } catch (error) {
    console.error('Erreur setup:', error)
    setErrors({ submit: 'Erreur lors de la sauvegarde' })
  } finally {
    setIsLoading(false)
  }
}

  const updateBureauRole = (role: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      bureauCentral: {
        ...prev.bureauCentral,
        [role]: {
          ...prev.bureauCentral[role as keyof typeof prev.bureauCentral],
          [field]: value
        }
      }
    }))
  }

  const handleDocumentUpload = async (documentType: string, file: File) => {
  try {
    setIsLoading(true)
    
    const formData = new FormData()
    formData.append('document', file)
    formData.append('type', documentType)
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    if (response.ok) {
      const result = await response.json() // Cette ligne doit déjà exister
      console.log(`Document ${documentType} uploadé avec succès`)
      
      // AJOUTER CES LIGNES ICI :
      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: {
          id: result.data.document.id,
          fileName: result.data.document.fileName,
          status: result.data.document.status,
          type: documentType
        }
      }))
      
    } else {
      const error = await response.text()
      console.error('Erreur upload document:', error)
      setErrors({ [`upload_${documentType}`]: 'Erreur lors de l\'upload' })
    }
  } catch (error) {
    console.error('Erreur upload:', error)
    setErrors({ [`upload_${documentType}`]: 'Erreur de connexion' })
  } finally {
    setIsLoading(false)
  }
}

const handleDocumentDelete = async (documentType: string, documentId: number) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      setUploadedDocuments(prev => {
        const newDocs = { ...prev }
        delete newDocs[documentType]
        return newDocs
      })
    } else {
      console.error('Erreur suppression document')
    }
  } catch (error) {
    console.error('Erreur suppression:', error)
  }
}

  const updateFirstSection = (field: string, value: any) => {
  setFormData(prev => ({
    ...prev,
    firstSection: {
      name: prev.firstSection?.name || (prev.isMultiSection ? '' : association?.name || ''),
      country: prev.firstSection?.country || association?.country || 'FR',
      city: prev.firstSection?.city || association?.city || '',
      currency: prev.firstSection?.currency || 'EUR',
      language: prev.firstSection?.language || 'fr',
      [field]: value
    }
  }))
}

  if (isLoadingAssociation) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    )
  }

  if (!association) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Association introuvable</h1>
            <Button onClick={() => router.push('/modules/associations')}>
              Retour aux associations
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/modules/associations/${associationId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Configuration de {association.name}
            </h1>
            <p className="text-gray-600">
              Terminez la configuration de votre association
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between">
          {ETAPES.map((etape, index) => {
            const Icon = etape.icon
            const isActive = etapeActuelle === etape.id
            const isCompleted = etapeActuelle > etape.id
            const isSkipped = !formData.isMultiSection && etape.id === 3
            
            return (
              <div key={etape.id} className="flex items-center">
                <div className={`
                  flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                  ${isActive ? 'bg-primary-50 text-primary-600' : 
                    isCompleted ? 'bg-green-50 text-green-600' : 
                    isSkipped ? 'bg-gray-100 text-gray-300' :
                    'bg-gray-50 text-gray-400'}
                `}>
                  <Icon className="h-5 w-5" />
                  <div className="hidden sm:block">
                    <div className="font-medium">{etape.title}</div>
                    <div className="text-xs opacity-75">{etape.description}</div>
                  </div>
                  {isCompleted && <Check className="h-4 w-4" />}
                  {isSkipped && <div className="text-xs">Ignoré</div>}
                </div>
                {index < ETAPES.length - 1 && (
                  <div className="w-8 h-px bg-gray-200 mx-2" />
                )}
              </div>
            )
          })}
        </div>

        {/* Contenu des étapes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(ETAPES[etapeActuelle - 1].icon, { className: "h-5 w-5" })}
              {ETAPES[etapeActuelle - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* ÉTAPE 1: Structure Association */}
            {etapeActuelle === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Type d'organisation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Association Simple */}
                    <Card 
                      className={`p-4 cursor-pointer border-2 transition-colors ${
                        !formData.isMultiSection ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, isMultiSection: false }))}
                    >
                      <div className="flex items-start gap-3">
                        <Building2 className="h-6 w-6 text-primary-600 mt-1" />
                        <div>
                          <h4 className="font-medium">Association Simple</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Une seule zone géographique. Structure simple avec un bureau central.
                          </p>
                          <div className="mt-2">
                            <Badge variant="secondary">Recommandé pour débuter</Badge>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Association Multi-Sections */}
                    <Card 
                      className={`p-4 cursor-pointer border-2 transition-colors ${
                        formData.isMultiSection ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        isMultiSection: true,
                        firstSection: {
                          name: `Section ${association.country}`,
                          country: association.country,
                          city: association.city || '',
                          currency: 'EUR',
                          language: 'fr'
                        }
                      }))}
                    >
                      <div className="flex items-start gap-3">
                        <Globe className="h-6 w-6 text-primary-600 mt-1" />
                        <div>
                          <h4 className="font-medium">Multi-Sections</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Plusieurs zones géographiques. Bureau central + bureaux sections.
                          </p>
                          <div className="mt-2">
                            <Badge variant="outline">Avancé</Badge>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Explication du choix */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="text-sm text-blue-700">
                    <h4 className="font-medium text-blue-800 mb-2">
                      {formData.isMultiSection ? 'Association Multi-Sections' : 'Association Simple'}
                    </h4>
                    {formData.isMultiSection ? (
                      <p>
                        Parfait pour les communautés présentes dans plusieurs pays/villes. 
                        Chaque section aura son propre bureau local et peut adapter les cotisations selon le coût de la vie local.
                      </p>
                    ) : (
                      <p>
                        Idéal pour commencer. Vous pourrez toujours évoluer vers une structure multi-sections plus tard 
                        si votre communauté s'étend géographiquement.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2: Bureau Central */}
            {etapeActuelle === 2 && (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium">Bureau Central</h3>
      <p className="text-sm text-gray-600">
        Sélectionnez les membres pour former le bureau dirigeant
      </p>
    </div>

    {/* Président */}
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Crown className="h-4 w-4 text-yellow-500" />
        Président *
      </label>
      <select 
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={formData.bureauCentral.president.userId || ''}
        onChange={(e) => {
          const selectedMember = members.find(m => m.userId.toString() === e.target.value)
          if (selectedMember) {
            setFormData(prev => ({
              ...prev,
              bureauCentral: {
                ...prev.bureauCentral,
                president: {
                  userId: selectedMember.userId,
                  firstName: selectedMember.user.firstName,
                  lastName: selectedMember.user.lastName,
                  phoneNumber: selectedMember.user.phoneNumber,
                  role: 'president'
                }
              }
            }))
          }
        }}
      >
        <option value="">Sélectionner le président...</option>
        {members.map((member) => (
  <option key={member.userId} value={member.userId}>
    {member.user.firstName} {member.user.lastName} - {member.user.phoneNumber} ({member.memberType})
  </option>
))}
      </select>
      {errors.president_firstName && (
        <p className="text-red-500 text-sm">{errors.president_firstName}</p>
      )}
    </div>

    {/* Secrétaire */}
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-blue-500" />
        Secrétaire (optionnel)
      </label>
      <select 
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={formData.bureauCentral.secretaire.userId || ''}
        onChange={(e) => {
          const selectedMember = members.find(m => m.userId.toString() === e.target.value)
          if (selectedMember) {
            setFormData(prev => ({
              ...prev,
              bureauCentral: {
                ...prev.bureauCentral,
                secretaire: {
                  userId: selectedMember.userId,
                  firstName: selectedMember.user.firstName,
                  lastName: selectedMember.user.lastName,
                  phoneNumber: selectedMember.user.phoneNumber,
                  role: 'secretaire'
                }
              }
            }))
          } else {
            // Vider si aucun membre sélectionné
            setFormData(prev => ({
              ...prev,
              bureauCentral: {
                ...prev.bureauCentral,
                secretaire: {
                  firstName: '',
                  lastName: '',
                  phoneNumber: '',
                  role: 'secretaire'
                }
              }
            }))
          }
        }}
      >
        <option value="">Sélectionner le secrétaire...</option>

        {members.filter(m => m.userId !== formData.bureauCentral.president.userId).map((member) => (
  <option key={member.userId} value={member.userId}>
    {member.user.firstName} {member.user.lastName} - {member.user.phoneNumber} ({member.memberType})
  </option>
))}

      </select>
    </div>

    {/* Trésorier */}
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-green-500" />
        Trésorier (optionnel)
      </label>
      <select 
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={formData.bureauCentral.tresorier.userId || ''}
        onChange={(e) => {
          const selectedMember = members.find(m => m.userId.toString() === e.target.value)
          if (selectedMember) {
            setFormData(prev => ({
              ...prev,
              bureauCentral: {
                ...prev.bureauCentral,
                tresorier: {
                  userId: selectedMember.userId,
                  firstName: selectedMember.user.firstName,
                  lastName: selectedMember.user.lastName,
                  phoneNumber: selectedMember.user.phoneNumber,
                  role: 'tresorier'
                }
              }
            }))
          } else {
            setFormData(prev => ({
              ...prev,
              bureauCentral: {
                ...prev.bureauCentral,
                tresorier: {
                  firstName: '',
                  lastName: '',
                  phoneNumber: '',
                  role: 'tresorier'
                }
              }
            }))
          }
        }}
      >
        <option value="">Sélectionner le trésorier...</option>

        {members.filter(m => 
  m.userId !== formData.bureauCentral.president.userId && 
  m.userId !== formData.bureauCentral.secretaire.userId
).map((member) => (
  <option key={member.userId} value={member.userId}>
    {member.user.firstName} {member.user.lastName} - {member.user.phoneNumber} ({member.memberType})
  </option>
))}

      </select>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
      <p className="text-sm text-blue-700">
        Les rôles seront automatiquement assignés aux membres sélectionnés. 
        Seul le président est obligatoire pour continuer.
      </p>
    </div>
  </div>
)}

            {/* ÉTAPE 3: Configuration géographique */}
{etapeActuelle === 3 && (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-medium">
        {formData.isMultiSection ? 'Première Section' : 'Configuration Locale'}
      </h3>
      <p className="text-sm text-gray-600">
        {formData.isMultiSection 
          ? 'Configurez votre première section géographique'
          : 'Configurez les paramètres locaux de votre association'
        }
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {formData.isMultiSection ? 'Nom de la section *' : 'Nom complet association'}
        </label>
        <Input
          value={formData.firstSection?.name || ''}
          onChange={(e) => updateFirstSection('name', e.target.value)}
          placeholder={formData.isMultiSection ? "Ex: Section France" : association?.name || ""}
          error={errors.sectionName}
          disabled={!formData.isMultiSection}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pays *
        </label>
        <select 
          value={formData.firstSection?.country || association?.country || ''}
          onChange={(e) => updateFirstSection('country', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="FR">France</option>
          <option value="IT">Italie</option>
          <option value="ES">Espagne</option>
          <option value="BE">Belgique</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ville principale
        </label>
        <Input
          value={formData.firstSection?.city || ''}
          onChange={(e) => updateFirstSection('city', e.target.value)}
          placeholder="Ex: Paris, Rome, Madrid..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Devise
        </label>
        <select 
          value={formData.firstSection?.currency || ''}
          onChange={(e) => updateFirstSection('currency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {DEVISES_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Langue interface
        </label>
        <select 
          value={formData.firstSection?.language || ''}
          onChange={(e) => updateFirstSection('language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {LANGUES_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>

    {formData.isMultiSection && (
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <p className="text-sm text-green-700">
          Vous pourrez ajouter d'autres sections après la création de l'association.
        </p>
      </div>
    )}
  </div>
)}

            {/* ÉTAPE 4: Documents KYB */}
            {etapeActuelle === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Documents de validation</h3>
                  <p className="text-sm text-gray-600">
                    Téléchargez les documents requis pour activer votre association
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Documents requis */}
                  {[
                    { key: 'statuts', label: 'Statuts de l\'association', required: true },
                    { key: 'receipisse', label: 'Récépissé de déclaration', required: true },
                    { key: 'rib', label: 'RIB de l\'association', required: true },
                    { key: 'pv_creation', label: 'PV de création', required: false }
                  ].map(doc => (
                    <Card key={doc.key} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{doc.label}</h4>
                        {doc.required && (
                          <Badge variant="secondary" className="text-xs">Obligatoire</Badge>
                        )}
                      </div>
                      
                      {/* Document uploadé */}
                      {uploadedDocuments[doc.key] ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">
                              {uploadedDocuments[doc.key].fileName}
                            </span>
                            <Badge 
                              variant="outline" 
                              className="text-xs text-green-600 border-green-300"
                            >
                              {uploadedDocuments[doc.key].status}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentDelete(doc.key, uploadedDocuments[doc.key].id)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        /* Bouton upload */
                        <div className="relative">
                          <input
                            type="file"
                            id={`upload-${doc.key}`}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleDocumentUpload(doc.key, file)
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            className="w-full flex items-center gap-2"
                            onClick={() => {
                              document.getElementById(`upload-${doc.key}`)?.click()
                            }}
                          >
                            <Upload className="h-4 w-4" />
                            Télécharger
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="text-sm text-blue-700">
                    <h4 className="font-medium text-blue-800 mb-2">
                      Validation en cours
                    </h4>
                    <p>
                      Votre association sera activée dans 3-5 jours ouvrés après réception 
                      et validation de tous les documents obligatoires.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={etapeActuelle === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>

          {etapeActuelle < 4 ? (
            <Button 
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSaveSetup}
              disabled={isLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {isLoading && <LoadingSpinner size="sm" />}
              Terminer la configuration
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}