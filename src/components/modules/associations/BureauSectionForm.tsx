// src/components/modules/associations/BureauSectionForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Save,
  X,
  User,
  Phone,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface BureauMember {
  userId?: number
  name?: string
  phoneNumber?: string
}

interface BureauSection {
  responsable?: BureauMember
  secretaire?: BureauMember
  tresorier?: BureauMember
}

interface BureauSectionFormProps {
  bureau: BureauSection
  setBureau: (updater: (prev: any) => any) => void
  onSave: () => void
  onCancel: () => void
  isSaving?: boolean
}

export default function BureauSectionForm({ 
  bureau, 
  setBureau, 
  onSave, 
  onCancel, 
  isSaving = false 
}: BureauSectionFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const roles = [
    { 
      key: 'responsable', 
      label: 'Responsable Section', 
      description: 'Coordination locale et liaison avec le bureau central',
      icon: User
    },
    { 
      key: 'secretaire', 
      label: 'Secrétaire Section', 
      description: 'Gestion des membres et communications',
      icon: User
    },
    { 
      key: 'tresorier', 
      label: 'Trésorier Section', 
      description: 'Suivi des cotisations et finances locales',
      icon: User
    }
  ] as const

  useEffect(() => {
    // Détecter les changements pour activer/désactiver le bouton de sauvegarde
    const initialBureau = JSON.stringify(bureau)
    const currentBureau = JSON.stringify(bureau)
    setHasChanges(initialBureau !== currentBureau)
  }, [bureau])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    roles.forEach(role => {
      const member = bureau[role.key]
      
      // Si un nom est fourni, vérifier qu'il est valide
      if (member?.name) {
        if (member.name.trim().length < 2) {
          newErrors[`${role.key}_name`] = 'Le nom doit contenir au moins 2 caractères'
        }
        
        // Si nom fourni, téléphone recommandé
        if (!member.phoneNumber) {
          newErrors[`${role.key}_phone`] = 'Numéro de téléphone recommandé'
        }
      }
      
      // Validation du téléphone si fourni
      if (member?.phoneNumber) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)\.]{8,}$/
        if (!phoneRegex.test(member.phoneNumber)) {
          newErrors[`${role.key}_phone`] = 'Format de téléphone invalide'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave()
    }
  }

  const updateMember = (roleKey: string, field: 'name' | 'phoneNumber', value: string) => {
    setBureau((prev: any) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey],
        [field]: value
      }
    }))
    
    // Effacer l'erreur du champ modifié
    if (errors[`${roleKey}_${field === 'phoneNumber' ? 'phone' : field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`${roleKey}_${field === 'phoneNumber' ? 'phone' : field}`]
        return newErrors
      })
    }
  }

  const clearMember = (roleKey: string) => {
    setBureau((prev: any) => ({
      ...prev,
      [roleKey]: undefined
    }))
  }

  const getMemberCompleteness = (member?: BureauMember) => {
    if (!member?.name) return 0
    if (member.name && member.phoneNumber) return 100
    return 50
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Configuration bureau section</h4>
        <div className="text-xs text-gray-500">
          Remplissez au moins le responsable de section
        </div>
      </div>

      {roles.map(role => {
        const member = bureau[role.key]
        const completeness = getMemberCompleteness(member)
        const Icon = role.icon

        return (
          <div key={role.key} className="bg-white p-4 rounded-lg border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-500" />
                <div>
                  <h5 className="font-medium text-sm text-gray-900">{role.label}</h5>
                  <p className="text-xs text-gray-600">{role.description}</p>
                </div>
              </div>
              
              {completeness > 0 && (
                <div className="flex items-center gap-2">
                  {completeness === 100 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => clearMember(role.key)}
                    className="text-red-600 hover:text-red-700 text-xs p-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <Input
                  placeholder="Prénom Nom"
                  value={member?.name || ''}
                  onChange={(e) => updateMember(role.key, 'name', e.target.value)}
                  className={`text-sm ${errors[`${role.key}_name`] ? 'border-red-300' : ''}`}
                />
                {errors[`${role.key}_name`] && (
                  <p className="text-xs text-red-600 mt-1">{errors[`${role.key}_name`]}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <Input
                  placeholder="+33 6 XX XX XX XX"
                  value={member?.phoneNumber || ''}
                  onChange={(e) => updateMember(role.key, 'phoneNumber', e.target.value)}
                  className={`text-sm ${errors[`${role.key}_phone`] ? 'border-red-300' : ''}`}
                />
                {errors[`${role.key}_phone`] && (
                  <p className="text-xs text-red-600 mt-1">{errors[`${role.key}_phone`]}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Informations importantes */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="text-sm text-blue-700">
          <h4 className="font-medium text-blue-800 mb-1">Processus d'assignation</h4>
          <ul className="text-xs space-y-1">
            <li>• Si la personne a déjà un compte : assignation automatique au rôle</li>
            <li>• Si pas de compte : création automatique + SMS d'invitation</li>
            <li>• Le responsable section peut gérer les cotisations locales</li>
            <li>• Tous les membres bureau peuvent valider les aides {"<"} 500€</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
          className="flex-1"
        >
          {isSaving ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent mr-1" />
          ) : (
            <Save className="h-3 w-3 mr-1" />
          )}
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isSaving}
          className="flex-1"
        >
          <X className="h-3 w-3 mr-1" />
          Annuler
        </Button>
      </div>
    </div>
  )
}