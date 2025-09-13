// src/app/modules/associations/[id]/members/add/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  ArrowLeft, 
  UserPlus,
  Phone,
  User,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface Association {
  id: number
  name: string
  isMultiSection: boolean
  memberTypes: Array<{
    name: string
    cotisationAmount: number
    description: string
    permissions?: string[]
  }>
}

interface Section {
  id: number
  name: string
  country: string
  city: string
}

interface FormData {
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  dateOfBirth: string
  gender: string
  address: string
  memberType: string
  sectionId: string
}

export default function AddMemberPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  
  const [association, setAssociation] = useState<Association | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    memberType: '',
    sectionId: ''
  })

  const associationId = params.id as string

  useEffect(() => {
    fetchData()
  }, [associationId, token])

  const fetchData = async () => {
    if (!associationId || !token) return
    
    setIsLoading(true)
    try {
      const assocResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      if (assocResponse.ok) {
        const assocResult = await assocResponse.json()
        const assocData = assocResult.data.association
        setAssociation(assocData)
        
        if (assocData.isMultiSection) {
          const sectionsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          )
          
          if (sectionsResponse.ok) {
            const sectionsResult = await sectionsResponse.json()
            setSections(sectionsResult.data.sections || [])
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom de famille est obligatoire'
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Le numéro de téléphone est obligatoire'
    } else {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)\.]{8,}$/
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Format de téléphone invalide'
      }
    }
    if (!formData.memberType) {
      newErrors.memberType = 'Le type de membre est obligatoire'
    }
    
    if (association?.isMultiSection && !formData.sectionId) {
      newErrors.sectionId = 'La section est obligatoire'
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Format email invalide'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('État du formulaire avant validation:', formData)
    
    if (!validateForm()) {
      console.log('Validation échouée, erreurs:', errors)
      return
    }

    setIsSubmitting(true)
    try {
      const addMemberData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email || null,
        memberType: formData.memberType,
        ...(association?.isMultiSection && { sectionId: parseInt(formData.sectionId) })
      }

      console.log('Données envoyées au backend:', addMemberData)

      const addMemberResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(addMemberData)
        }
      )

      if (addMemberResponse.ok) {
        router.push(`/modules/associations/${associationId}/members`)
      } else {
        const errorResult = await addMemberResponse.json()
        setErrors({ general: errorResult.error || 'Erreur lors de l\'ajout du membre' })
      }

    } catch (error) {
      console.error('Erreur ajout membre:', error)
      setErrors({ general: 'Erreur de connexion' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    console.log(`Changement ${field}:`, value)
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!association) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-red-600 mb-4">Association introuvable</h1>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
          <h1 className="text-2xl font-bold text-gray-900">Ajouter un membre</h1>
          <p className="text-gray-600">{association.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Informations du nouveau membre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`pl-10 ${errors.firstName ? 'border-red-300' : ''}`}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de famille *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`pl-10 ${errors.lastName ? 'border-red-300' : ''}`}
                  />
                </div>
                {errors.lastName && (
                  <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="+33612345678"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className={`pl-10 ${errors.phoneNumber ? 'border-red-300' : ''}`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-red-600 mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optionnel)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="jean.dupont@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 ${errors.email ? 'border-red-300' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance (optionnel)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genre (optionnel)
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sélectionner</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                  <option value="prefer_not_to_say">Préfère ne pas dire</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse (optionnel)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="123 Rue de la Paix, 75000 Paris"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration association</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de membre *
                  </label>
                  <select
                    value={formData.memberType}
                    onChange={(e) => handleInputChange('memberType', e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.memberType ? 'border-red-300' : ''}`}
                  >
                    <option value="">Sélectionner un type</option>
                    {association.memberTypes.map(type => (
                      <option key={type.name} value={type.name}>
                        {type.name} - {type.cotisationAmount}€/mois
                      </option>
                    ))}
                  </select>
                  {errors.memberType && (
                    <p className="text-xs text-red-600 mt-1">{errors.memberType}</p>
                  )}
                </div>

                {association.isMultiSection && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section *
                    </label>
                    <select
                      value={formData.sectionId}
                      onChange={(e) => handleInputChange('sectionId', e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors.sectionId ? 'border-red-300' : ''}`}
                    >
                      <option value="">Sélectionner une section</option>
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>
                          {section.name} ({section.city}, {section.country})
                        </option>
                      ))}
                    </select>
                    {errors.sectionId && (
                      <p className="text-xs text-red-600 mt-1">{errors.sectionId}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? 'Ajout en cours...' : 'Ajouter le membre'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Le membre recevra un SMS pour configurer son compte et définir son code PIN</p>
            <p>• Il pourra ensuite se connecter et configurer ses préférences de paiement</p>
            <p>• Les cotisations seront calculées automatiquement selon le type de membre</p>
            {association.isMultiSection && (
              <p>• Le membre sera assigné à la section sélectionnée et pourra participer aux activités locales</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}