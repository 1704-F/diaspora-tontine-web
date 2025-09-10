// src/app/modules/associations/[id]/sections/create/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { 
  ArrowLeft, 
  Building2,
  MapPin,
  Globe,
  DollarSign,
  Users,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface Association {
  id: number
  name: string
  isMultiSection: boolean
  features: {
    maxSections: number
  }
  sectionsCount: number
}

interface SectionFormData {
  name: string
  country: string
  city: string
  currency: string
  language: string
  description: string
}

const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' }
]

const CURRENCIES = [
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'Dollar US', symbol: '$' },
  { code: 'GBP', name: 'Livre Sterling', symbol: '£' },
  { code: 'CAD', name: 'Dollar Canadien', symbol: 'CAD' },
  { code: 'CHF', name: 'Franc Suisse', symbol: 'CHF' }
]

const LANGUAGES = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italiano' },
  { code: 'es', name: 'Español' },
  { code: 'de', name: 'Deutsch' }
]

export default function CreateSectionPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  
  const [association, setAssociation] = useState<Association | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<SectionFormData>({
    name: '',
    country: 'FR',
    city: '',
    currency: 'EUR',
    language: 'fr',
    description: ''
  })

  const associationId = params.id as string

  useEffect(() => {
    fetchAssociation()
  }, [associationId, token])

  const fetchAssociation = async () => {
    if (!associationId || !token) return
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      if (response.ok) {
        const result = await response.json()
        setAssociation(result.data.association)
        
        // Pré-remplir le nom avec le pays sélectionné
        const selectedCountry = COUNTRIES.find(c => c.code === formData.country)
        if (selectedCountry && result.data.association.name) {
          setFormData(prev => ({
            ...prev,
            name: `Section ${selectedCountry.name}`
          }))
        }
      } else {
        setErrors({ general: 'Association introuvable' })
      }
    } catch (error) {
      console.error('Erreur chargement association:', error)
      setErrors({ general: 'Erreur de connexion' })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la section est requis'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères'
    }

    if (!formData.country) {
      newErrors.country = 'Le pays est requis'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ville est requise'
    }

    if (!formData.currency) {
      newErrors.currency = 'La devise est requise'
    }

    if (!formData.language) {
      newErrors.language = 'La langue est requise'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !token) return

    setIsSaving(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      )

      if (response.ok) {
        const result = await response.json()
        // Rediriger vers la page de la section créée
        router.push(`/modules/associations/${associationId}/sections/${result.data.section.id}`)
      } else {
        const error = await response.json()
        setErrors({ general: error.message || 'Erreur lors de la création' })
      }
    } catch (error) {
      console.error('Erreur création section:', error)
      setErrors({ general: 'Erreur de connexion' })
    } finally {
      setIsSaving(false)
    }
  }

  const updateFormData = (field: keyof SectionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Mise à jour automatique du nom quand le pays change
    if (field === 'country' && association) {
      const selectedCountry = COUNTRIES.find(c => c.code === value)
      if (selectedCountry) {
        setFormData(prev => ({
          ...prev,
          name: `Section ${selectedCountry.name}`
        }))
      }
    }
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

  if (!association) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Association introuvable</h1>
            <Button onClick={() => router.back()}>Retour</Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!association.isMultiSection) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Association simple</h1>
            <p className="text-gray-600 mb-4">
              Cette association n'utilise pas de sections géographiques.
            </p>
            <Button onClick={() => router.push(`/modules/associations/${associationId}/settings`)}>
              Configurer multi-sections
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const canCreateMore = association.sectionsCount < association.features.maxSections

  if (!canCreateMore) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Limite atteinte</h1>
            <p className="text-gray-600 mb-4">
              Vous avez atteint le nombre maximum de sections autorisées ({association.features.maxSections}).
            </p>
            <Button onClick={() => router.back()}>Retour</Button>
          </div>
        </div>
      </ProtectedRoute>
    )
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
              Créer une nouvelle section
            </h1>
            <p className="text-gray-600">
              {association.name} - Section {association.sectionsCount + 1}/{association.features.maxSections}
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de la section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Erreur générale */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-700 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Nom et pays */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la section *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Ex: Section France"
                    error={errors.name}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => updateFormData('country', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.country ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <p className="text-xs text-red-600 mt-1">{errors.country}</p>
                  )}
                </div>
              </div>

              {/* Ville et devise */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville principale *
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="Ex: Paris, Rome, Madrid..."
                    error={errors.city}
                  />
                  {errors.city && (
                    <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => updateFormData('currency', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.currency ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name}
                      </option>
                    ))}
                  </select>
                  {errors.currency && (
                    <p className="text-xs text-red-600 mt-1">{errors.currency}</p>
                  )}
                </div>
              </div>

              {/* Langue et description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue interface *
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => updateFormData('language', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.language ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {LANGUAGES.map(language => (
                      <option key={language.code} value={language.code}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                  {errors.language && (
                    <p className="text-xs text-red-600 mt-1">{errors.language}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnelle)
                  </label>
                  <Input
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Spécificités de cette section..."
                  />
                </div>
              </div>

              {/* Aperçu */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Aperçu de la section</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{formData.name || 'Nom de la section'}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {formData.city || 'Ville'}, {COUNTRIES.find(c => c.code === formData.country)?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {CURRENCIES.find(c => c.code === formData.currency)?.symbol}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {LANGUAGES.find(l => l.code === formData.language)?.name}
                        </span>
                      </div>
                      {formData.description && (
                        <p className="text-sm text-gray-600 mt-2">{formData.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      0 membres
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informations importantes */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="text-sm text-blue-700">
                  <h4 className="font-medium text-blue-800 mb-2">Après création</h4>
                  <ul className="space-y-1 text-xs">
                    <li>• Vous pourrez configurer le bureau de section (responsable, secrétaire, trésorier)</li>
                    <li>• Les cotisations pourront être adaptées selon le coût de la vie local</li>
                    <li>• Le bureau section pourra valider les aides inférieures à 500€</li>
                    <li>• Les membres pourront être transférés entre sections</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between pt-6">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            
            <Button 
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Création...' : 'Créer la section'}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}