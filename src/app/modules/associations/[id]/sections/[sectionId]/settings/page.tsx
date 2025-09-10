// src/app/modules/associations/[id]/sections/[sectionId]/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { 
  ArrowLeft, 
  Settings,
  Building2,
  MapPin,
  Globe,
  DollarSign,
  Save,
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react'

interface SectionSettings {
  name: string
  description: string
  contactPhone: string
  contactEmail: string
  country: string
  city: string
  currency: string
  language: string
}

interface Section {
  id: number
  name: string
  description?: string
  contactPhone?: string
  contactEmail?: string
  country: string
  city: string
  currency: string
  language: string
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

export default function SectionSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  
  const [section, setSection] = useState<Section | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  
  const [formData, setFormData] = useState<SectionSettings>({
    name: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    country: 'FR',
    city: '',
    currency: 'EUR',
    language: 'fr'
  })

  const associationId = params.id as string
  const sectionId = params.sectionId as string

  useEffect(() => {
    fetchSection()
  }, [associationId, sectionId, token])

  useEffect(() => {
    if (section) {
      const initialData = {
        name: section.name,
        description: section.description || '',
        contactPhone: section.contactPhone || '',
        contactEmail: section.contactEmail || '',
        country: section.country,
        city: section.city,
        currency: section.currency,
        language: section.language
      }
      setFormData(initialData)
    }
  }, [section])

  useEffect(() => {
    setHasChanges(section && JSON.stringify(formData) !== JSON.stringify({
      name: section.name,
      description: section.description || '',
      contactPhone: section.contactPhone || '',
      contactEmail: section.contactEmail || '',
      country: section.country,
      city: section.city,
      currency: section.currency,
      language: section.language
    }))
  }, [formData, section])

  const fetchSection = async () => {
    if (!associationId || !sectionId || !token) return
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${sectionId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      if (response.ok) {
        const result = await response.json()
        setSection(result.data.section)
      } else {
        setErrors({ general: 'Section introuvable' })
      }
    } catch (error) {
      console.error('Erreur chargement section:', error)
      setErrors({ general: 'Erreur de connexion' })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ville est requise'
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Format email invalide'
    }

    if (formData.contactPhone && !/^[\+]?[0-9\s\-\(\)\.]{8,}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Format téléphone invalide'
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
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${sectionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      )

      if (response.ok) {
        const result = await response.json()
        setSection(result.data.section)
        setHasChanges(false)
      } else {
        const error = await response.json()
        setErrors({ general: error.message || 'Erreur lors de la mise à jour' })
      }
    } catch (error) {
      console.error('Erreur mise à jour section:', error)
      setErrors({ general: 'Erreur de connexion' })
    } finally {
      setIsSaving(false)
    }
  }

  const updateFormData = (field: keyof SectionSettings, value: string) => {
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
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    )
  }

  if (!section) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">Section introuvable</h1>
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
              Paramètres - {section.name}
            </h1>
            <p className="text-gray-600">
              Configuration de la section
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
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

              {/* Nom et description */}
              <div className="grid grid-cols-1 gap-4">
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
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Description de la section..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Localisation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => updateFormData('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>

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
              </div>

              {/* Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => updateFormData('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue interface
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => updateFormData('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {LANGUAGES.map(language => (
                      <option key={language.code} value={language.code}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone contact
                  </label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => updateFormData('contactPhone', e.target.value)}
                    placeholder="+33 6 XX XX XX XX"
                    error={errors.contactPhone}
                  />
                  {errors.contactPhone && (
                    <p className="text-xs text-red-600 mt-1">{errors.contactPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email contact
                  </label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData('contactEmail', e.target.value)}
                    placeholder="contact@section.fr"
                    error={errors.contactEmail}
                  />
                  {errors.contactEmail && (
                    <p className="text-xs text-red-600 mt-1">{errors.contactEmail}</p>
                  )}
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
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}