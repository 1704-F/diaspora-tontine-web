//src/components/modules/associations/CreateAssociationPage
'use client'
import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { apiClient } from '@/lib/api/client'

import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Plus, 
  Trash2, 
  FileText,
  Users,
  Settings,
  Building2
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

// Types pour TypeScript
interface MemberType {
  name: string
  cotisationAmount: number
  description?: string
  benefits?: string[]
}

interface BureauRole {
  role: string
  userId: number | null
  name: string | null
  isRequired: boolean
}

interface FormData {
  // Étape 1 - Informations de base
  name: string
  description: string
  legalStatus: string
  country: string
  city: string
  registrationNumber: string
  
  // Étape 2 - Types de membres
  memberTypes: MemberType[]
  
  // Étape 3 - Bureau central
  bureauCentral: {[key: string]: BureauRole}
  
  // Étape 4 - Permissions (optionnel)
  permissionsMatrix: any
}

const ETAPES = [
  { id: 1, title: 'Informations de base', icon: Building2 },
  { id: 2, title: 'Types de membres', icon: Users },
  { id: 3, title: 'Bureau central', icon: Settings },
  { id: 4, title: 'Finalisation', icon: Check }
]

const LEGAL_STATUS_OPTIONS = [
  { value: 'association_1901', label: 'Association loi 1901 (France)' },
  { value: 'asbl', label: 'ASBL (Belgique)' },
  { value: 'nonprofit_501c3', label: 'Nonprofit 501(c)(3) (USA)' },
  { value: 'other', label: 'Autre statut' }
]

const PAYS_OPTIONS = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'IT', label: 'Italie' },
  { value: 'ES', label: 'Espagne' },
  { value: 'US', label: 'États-Unis' },
  { value: 'CA', label: 'Canada' }
]

const DEFAULT_MEMBER_TYPES: MemberType[] = [
  {
    name: 'membre_simple',
    cotisationAmount: 20,
    description: 'Cotisation de base avec accès aux services essentiels'
  },
  {
    name: 'membre_actif',
    cotisationAmount: 40,
    description: 'Participation active aux décisions et événements'
  },
  {
    name: 'fondateur',
    cotisationAmount: 60,
    description: 'Membre fondateur avec privilèges historiques'
  }
]

export default function CreateAssociationPage() {
  const { user, token } = useAuthStore()
  const router = useRouter()
  
  const [etapeActuelle, setEtapeActuelle] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    legalStatus: 'association_1901',
    country: 'FR',
    city: '',
    registrationNumber: '',
    memberTypes: DEFAULT_MEMBER_TYPES,
    bureauCentral: {
      president: {
        role: 'president',
        userId: user?.id || null,
        name: user ? `${user.firstName} ${user.lastName}`.trim() : '',
        isRequired: true
      },
      secretaire: {
        role: 'secretaire',
        userId: null,
        name: '',
        isRequired: true
      },
      tresorier: {
        role: 'tresorier',
        userId: null,
        name: '',
        isRequired: true
      }
    },
    permissionsMatrix: {}
  })

  // Validation par étape
  const validateEtape = (etape: number): boolean => {
    const newErrors: {[key: string]: string} = {}
    
    switch (etape) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Nom de l\'association requis'
        if (formData.name.length < 3) newErrors.name = 'Nom trop court (min 3 caractères)'
        if (!formData.legalStatus) newErrors.legalStatus = 'Statut légal requis'
        if (!formData.country) newErrors.country = 'Pays requis'
        break
        
      case 2:
        if (formData.memberTypes.length === 0) {
          newErrors.memberTypes = 'Au moins un type de membre requis'
        }
        formData.memberTypes.forEach((type, index) => {
          if (!type.name.trim()) {
            newErrors[`memberType_${index}_name`] = 'Nom du type requis'
          }
          if (type.cotisationAmount < 0) {
            newErrors[`memberType_${index}_amount`] = 'Montant doit être positif'
          }
        })
        break
        
      case 3:
        const requiredRoles = ['president', 'secretaire', 'tresorier']
        requiredRoles.forEach(role => {
          if (!formData.bureauCentral[role]?.name?.trim()) {
            newErrors[`bureau_${role}`] = `${role} requis`
          }
        })
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateEtape(etapeActuelle)) {
      setEtapeActuelle(prev => Math.min(prev + 1, 4))
    }
  }

  const handlePrevious = () => {
    setEtapeActuelle(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateEtape(etapeActuelle)) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/associations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // Redirection vers la page de l'association créée
        router.push(`/modules/associations/${result.data.association.id}`)
      } else {
        setErrors({ submit: result.error || 'Erreur lors de la création' })
      }
    } catch (error) {
      setErrors({ submit: 'Erreur de connexion' })
    } finally {
      setIsLoading(false)
    }
  }

  // Gestionnaires pour types de membres
  const ajouterMemberType = () => {
    setFormData(prev => ({
      ...prev,
      memberTypes: [...prev.memberTypes, {
        name: '',
        cotisationAmount: 0,
        description: ''
      }]
    }))
  }

  const supprimerMemberType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      memberTypes: prev.memberTypes.filter((_, i) => i !== index)
    }))
  }

  const updateMemberType = (index: number, field: keyof MemberType, value: any) => {
    setFormData(prev => ({
      ...prev,
      memberTypes: prev.memberTypes.map((type, i) => 
        i === index ? { ...type, [field]: value } : type
      )
    }))
  }

  const updateBureauRole = (role: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      bureauCentral: {
        ...prev.bureauCentral,
        [role]: {
          ...prev.bureauCentral[role],
          [field]: value
        }
      }
    }))
  }

  return (
    <ProtectedRoute requiredModule="associations">
    
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
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
              <h1 className="text-2xl font-bold text-gray-900">
                Créer une nouvelle association
              </h1>
              <p className="text-gray-600">
                Configurez votre association selon vos besoins communautaires
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between">
            {ETAPES.map((etape, index) => {
              const Icon = etape.icon
              const isActive = etapeActuelle === etape.id
              const isCompleted = etapeActuelle > etape.id
              
              return (
                <div key={etape.id} className="flex items-center">
                  <div className={`
                    flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                    ${isActive ? 'bg-primary-50 text-primary-600' : 
                      isCompleted ? 'bg-green-50 text-green-600' : 
                      'bg-gray-50 text-gray-400'}
                  `}>
                    <Icon className="h-5 w-5" />
                    <span className="font-medium hidden sm:block">{etape.title}</span>
                    {isCompleted && <Check className="h-4 w-4" />}
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

              {/* ÉTAPE 1: Informations de base */}
              {etapeActuelle === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de l'association *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Diaspora Malienne de France"
                        error={errors.name}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statut légal *
                      </label>
                      <select 
                        value={formData.legalStatus}
                        onChange={(e) => setFormData(prev => ({ ...prev, legalStatus: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {LEGAL_STATUS_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Décrivez les objectifs et missions de votre association..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pays principal *
                      </label>
                      <select 
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {PAYS_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville principale
                      </label>
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Ex: Paris, Bruxelles..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro d'enregistrement (optionnel)
                    </label>
                    <Input
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                      placeholder="Ex: W751234567 (pour association française)"
                    />
                  </div>
                </div>
              )}

              {/* ÉTAPE 2: Types de membres */}
              {etapeActuelle === 2 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">Types de membres</h3>
                      <p className="text-sm text-gray-600">
                        Définissez les différents types de membres et leurs cotisations
                      </p>
                    </div>
                    <Button onClick={ajouterMemberType} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Ajouter un type
                    </Button>
                  </div>

                  {errors.memberTypes && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {errors.memberTypes}
                    </div>
                  )}

                  <div className="space-y-3">
                    {formData.memberTypes.map((memberType, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nom du type *
                              </label>
                              <Input
                                value={memberType.name}
                                onChange={(e) => updateMemberType(index, 'name', e.target.value)}
                                placeholder="Ex: Membre actif"
                                error={errors[`memberType_${index}_name`]}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cotisation mensuelle (€) *
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={memberType.cotisationAmount}
                                onChange={(e) => updateMemberType(index, 'cotisationAmount', parseFloat(e.target.value) || 0)}
                                error={errors[`memberType_${index}_amount`]}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <Input
                                value={memberType.description || ''}
                                onChange={(e) => updateMemberType(index, 'description', e.target.value)}
                                placeholder="Avantages et privilèges..."
                              />
                            </div>
                          </div>
                          {formData.memberTypes.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => supprimerMemberType(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ÉTAPE 3: Bureau central */}
              {etapeActuelle === 3 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Bureau central</h3>
                    <p className="text-sm text-gray-600">
                      Définissez les membres du bureau dirigeant de l'association
                    </p>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(formData.bureauCentral).map(([roleKey, roleData]) => (
                      <Card key={roleKey} className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium capitalize">{roleData.role}</h4>
                              {roleData.isRequired && (
                                <Badge variant="secondary" className="text-xs">Obligatoire</Badge>
                              )}
                            </div>
                            <Input
                              value={roleData.name || ''}
                              onChange={(e) => updateBureauRole(roleKey, 'name', e.target.value)}
                              placeholder={`Nom et prénom du ${roleData.role}...`}
                              error={errors[`bureau_${roleKey}`]}
                            />
                          </div>
                          {roleKey === 'president' && (
                            <div className="text-sm text-gray-500">
                              Vous êtes automatiquement président(e)
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Information importante
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Vous pouvez modifier ces informations après la création de l'association.
                            Les autres membres du bureau recevront une invitation à rejoindre l'association.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAPE 4: Finalisation */}
              {etapeActuelle === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Récapitulatif</h3>
                    <p className="text-sm text-gray-600">
                      Vérifiez les informations avant de créer votre association
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4">
                      <h4 className="font-medium mb-3">Informations générales</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Nom:</strong> {formData.name}</div>
                        <div><strong>Statut:</strong> {LEGAL_STATUS_OPTIONS.find(s => s.value === formData.legalStatus)?.label}</div>
                        <div><strong>Pays:</strong> {PAYS_OPTIONS.find(p => p.value === formData.country)?.label}</div>
                        {formData.city && <div><strong>Ville:</strong> {formData.city}</div>}
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="font-medium mb-3">Types de membres ({formData.memberTypes.length})</h4>
                      <div className="space-y-2 text-sm">
                        {formData.memberTypes.map((type, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{type.name}</span>
                            <span className="font-medium">{type.cotisationAmount}€/mois</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Bureau central</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {Object.entries(formData.bureauCentral).map(([role, data]) => (
                        <div key={role}>
                          <div className="font-medium capitalize">{data.role}</div>
                          <div className="text-gray-600">{data.name || 'Non défini'}</div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {errors.submit && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {errors.submit}
                    </div>
                  )}
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
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isLoading && <LoadingSpinner size="sm" />}
                Créer l'association
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
     
    </ProtectedRoute>
  )
}