// src/components/modules/associations/BureauSectionForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
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
  firstName?: string
  lastName?: string
  phoneNumber?: string
  role?: string
}

interface BureauSection {
  responsable?: BureauMember
  secretaire?: BureauMember
  tresorier?: BureauMember
}

interface SectionMember {
  id: number
  userId: number
  user: {
    id: number
    firstName: string
    lastName: string
    phoneNumber: string
    email: string
  }
  memberType: string
  status: string
  roles: string[]
}

interface BureauSectionFormProps {
  bureau: BureauSection
  setBureau: (updater: (prev: any) => any) => void
  onSave: () => Promise<void>
  onCancel: () => void
  isSaving?: boolean
  associationId: string
  sectionId: number
}

export default function BureauSectionForm({ 
  bureau, 
  setBureau, 
  onSave, 
  onCancel, 
  isSaving = false,
  associationId,
  sectionId
}: BureauSectionFormProps) {
  const { token } = useAuthStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [initialBureau] = useState(() => JSON.stringify(bureau))
  const [sectionMembers, setSectionMembers] = useState<SectionMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)

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

  // Charger les membres de la section
  useEffect(() => {
    const fetchSectionMembers = async () => {
      if (!token) return

      try {
        setIsLoadingMembers(true)
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${sectionId}/members`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )

        if (response.ok) {
          const result = await response.json()
          setSectionMembers(result.data.members || [])
        } else {
          console.error('Erreur chargement membres section')
        }

      } catch (error) {
        console.error('Erreur chargement membres:', error)
      } finally {
        setIsLoadingMembers(false)
      }
    }

    fetchSectionMembers()
  }, [associationId, sectionId, token])

  useEffect(() => {
    // Détecter les changements pour activer/désactiver le bouton de sauvegarde
    const currentBureau = JSON.stringify(bureau)
    setHasChanges(initialBureau !== currentBureau)
  }, [bureau, initialBureau])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Au moins le responsable doit être assigné
    if (!bureau.responsable?.userId) {
      newErrors.responsable = 'Le responsable de section est obligatoire'
    }

    // Vérifier qu'une même personne n'occupe pas plusieurs postes
    const assignedUsers = new Set()
    roles.forEach(role => {
      const member = bureau[role.key]
      if (member?.userId) {
        if (assignedUsers.has(member.userId)) {
          newErrors[role.key] = 'Une personne ne peut pas occuper plusieurs postes'
        }
        assignedUsers.add(member.userId)
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (validateForm()) {
      try {
        await onSave()
      } catch (error) {
        setErrors({ general: 'Erreur lors de la sauvegarde' })
      }
    }
  }

  const handleMemberSelect = (roleKey: string, userId: string) => {
    if (!userId) {
      // Vider la sélection
      setBureau((prev: any) => ({
        ...prev,
        [roleKey]: undefined
      }))
      return
    }

    const selectedMember = sectionMembers.find(m => m.userId.toString() === userId)
    if (selectedMember) {
      setBureau((prev: any) => ({
        ...prev,
        [roleKey]: {
          userId: selectedMember.userId,
          firstName: selectedMember.user.firstName,
          lastName: selectedMember.user.lastName,
          phoneNumber: selectedMember.user.phoneNumber,
          role: roleKey
        }
      }))
    }

    // Effacer l'erreur du rôle
    if (errors[roleKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[roleKey]
        return newErrors
      })
    }
  }

  const getAvailableMembers = (currentRoleKey: string) => {
    // Membres non assignés + membre actuellement sélectionné pour ce rôle
    const assignedUserIds = new Set()
    roles.forEach(role => {
      if (role.key !== currentRoleKey && bureau[role.key]?.userId) {
        assignedUserIds.add(bureau[role.key]?.userId)
      }
    })

    return sectionMembers.filter(member => 
      member.status === 'active' && !assignedUserIds.has(member.userId)
    )
  }

  const isMemberAssigned = (member?: BureauMember) => {
    return !!member?.userId
  }

  if (isLoadingMembers) {
    return (
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-2" />
          <span className="text-sm text-gray-600">Chargement des membres...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Configuration bureau section</h4>
        <div className="text-xs text-gray-500">
          Sélectionnez les membres parmi les {sectionMembers.length} membres actifs
        </div>
      </div>

      {/* Affichage erreur générale */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        </div>
      )}

      {/* Avertissement si pas assez de membres */}
      {sectionMembers.length < 3 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-yellow-700">
              Cette section n'a que {sectionMembers.length} membre(s) actif(s). 
              Il est recommandé d'avoir au moins 3 membres pour former un bureau complet.
            </p>
          </div>
        </div>
      )}

      {roles.map(role => {
        const member = bureau[role.key]
        const isAssigned = isMemberAssigned(member)
        const availableMembers = getAvailableMembers(role.key)
        const Icon = role.icon

        return (
          <div key={role.key} className="bg-white p-4 rounded-lg border">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-gray-500" />
                <div>
                  <h5 className="font-medium text-sm text-gray-900">{role.label}</h5>
                  <p className="text-xs text-gray-600">{role.description}</p>
                  {role.key === 'responsable' && (
                    <span className="text-xs text-red-600 font-medium">Obligatoire</span>
                  )}
                </div>
              </div>
              
              {isAssigned && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            
            {/* Sélection du membre */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Sélectionner un membre {role.key === 'responsable' && '*'}
              </label>
              <select
                value={member?.userId || ''}
                onChange={(e) => handleMemberSelect(role.key, e.target.value)}
                className={`w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors[role.key] ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Sélectionner un membre...</option>
                {availableMembers.map((sectionMember) => (
                  <option key={sectionMember.userId} value={sectionMember.userId}>
                    {sectionMember.user.firstName} {sectionMember.user.lastName} - 
                    {sectionMember.user.phoneNumber} ({sectionMember.memberType})
                  </option>
                ))}
              </select>
              
              {errors[role.key] && (
                <p className="text-xs text-red-600">{errors[role.key]}</p>
              )}
            </div>

            {/* Affichage des infos du membre sélectionné */}
            {isAssigned && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    {member?.firstName} {member?.lastName}
                  </span>
                  <span className="text-green-600">•</span>
                  <Phone className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">{member?.phoneNumber}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Informations importantes */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="text-sm text-blue-700">
          <h4 className="font-medium text-blue-800 mb-1">Permissions bureau section</h4>
          <ul className="text-xs space-y-1">
            <li>• Le responsable section peut gérer tous les aspects de la section</li>
            <li>• Le secrétaire peut gérer les membres et communications</li>
            <li>• Le trésorier peut valider les aides locales {"<"} 500€</li>
            <li>• Les rôles seront automatiquement assignés aux membres sélectionnés</li>
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
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder bureau'}
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