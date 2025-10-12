// src/components/modules/associations/roles/modals/AssignRolesModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useRoles } from '@/hooks/association'
import { AssociationMember } from '@/types/association/member'
import { toast } from 'sonner'
import {
  X,
  Save,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
  Crown,
} from 'lucide-react'

// ============================================
// INTERFACES
// ============================================

interface AssignRolesModalProps {
  isOpen: boolean
  onClose: () => void
  associationId: number
  member: AssociationMember
  onSuccess: () => void
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const AssignRolesModal: React.FC<AssignRolesModalProps> = ({
  isOpen,
  onClose,
  associationId,
  member,
  onSuccess,
}) => {
  const t = useTranslations('roles')
  const tCommon = useTranslations('common')
  
  const { roles } = useRoles(associationId)
  
  const [selectedRoles, setSelectedRoles] = useState<string[]>(member.assignedRoles || [])
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setSelectedRoles(member.assignedRoles || [])
    }
  }, [isOpen, member])

  // ============================================
  // HANDLERS
  // ============================================

  const handleToggleRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    
    // Si rôle unique, décocher les autres rôles uniques
    if (role?.isUnique && !selectedRoles.includes(roleId)) {
      const otherUniqueRoles = roles
        .filter(r => r.isUnique && r.id !== roleId)
        .map(r => r.id)
      
      setSelectedRoles(prev => 
        prev.filter(id => !otherUniqueRoles.includes(id)).concat(roleId)
      )
    } else {
      setSelectedRoles(prev =>
        prev.includes(roleId)
          ? prev.filter(id => id !== roleId)
          : [...prev, roleId]
      )
    }
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    
    try {
      // TODO: Appeler l'API pour attribuer les rôles
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members/${member.id}/roles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ roleIds: selectedRoles })
        }
      )

      if (!response.ok) throw new Error('Erreur API')

      setShowSuccess(true)

      setTimeout(() => {
        setShowSuccess(false)
        onSuccess()
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Erreur attribution rôles:', error)
      toast.error('Erreur lors de l\'attribution des rôles')
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // CALCULER PERMISSIONS EFFECTIVES
  // ============================================

  const effectivePermissions = () => {
    const permissions = new Set<string>()
    
    selectedRoles.forEach(roleId => {
      const role = roles.find(r => r.id === roleId)
      role?.permissions.forEach(p => permissions.add(p))
    })

    return Array.from(permissions)
  }

  // ============================================
  // SUCCESS MESSAGE
  // ============================================

  const SuccessMessage = () => {
    if (!showSuccess) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg shadow-2xl p-8 mx-4 max-w-md w-full text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 animate-bounce" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('success.roles_assigned')}
          </h3>
          <div className="text-gray-600">
            <p><strong>{member.user?.firstName} {member.user?.lastName}</strong></p>
            <p className="text-sm">{selectedRoles.length} rôle(s) attribué(s)</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('actions.assign_roles')}
                </h2>
                <p className="text-sm text-gray-600">
                  {member.user?.firstName} {member.user?.lastName}
                  {member.isAdmin && (
                    <Badge className="ml-2 bg-amber-100 text-amber-700 text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Contenu */}
          <div className="p-6 space-y-6">

            {/* Info Admin */}
            {member.isAdmin && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Crown className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-1">Administrateur</p>
                    <p>
                      Les administrateurs ont automatiquement toutes les permissions, 
                      indépendamment des rôles attribués.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Rôles actuels */}
            {member.assignedRoles && member.assignedRoles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Rôles actuels
                </p>
                <div className="flex flex-wrap gap-2">
                  {member.assignedRoles.map(roleId => {
                    const role = roles.find(r => r.id === roleId)
                    if (!role) return null
                    return (
                      <Badge
                        key={roleId}
                        style={{ backgroundColor: role.color }}
                        className="text-white"
                      >
                        {role.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sélection des rôles */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Attribuer des rôles
              </p>

              {roles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Aucun rôle configuré</p>
                  <p className="text-sm">Créez d'abord des rôles pour les attribuer</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {roles.map(role => {
                    const isSelected = selectedRoles.includes(role.id)
                    const isDisabled = role.isUnique && 
                      selectedRoles.some(id => {
                        const r = roles.find(r => r.id === id)
                        return r?.isUnique && r.id !== role.id
                      })

                    return (
                      <label
                        key={role.id}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRole(role.id)}
                          disabled={isSaving || isDisabled}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: role.color }}
                        >
                          <Shield className="h-4 w-4 text-white" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{role.name}</p>
                            {role.isUnique && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Unique
                              </Badge>
                            )}
                            {role.isMandatory && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                Obligatoire
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {role.permissions.length} permission(s)
                          </p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Aperçu permissions effectives */}
            {selectedRoles.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-2">
                      Permissions effectives : {effectivePermissions().length}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {effectivePermissions().slice(0, 10).map(perm => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      {effectivePermissions().length > 10 && (
                        <Badge variant="secondary" className="text-xs">
                          +{effectivePermissions().length - 10} autres
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning si aucun rôle sélectionné */}
            {selectedRoles.length === 0 && member.assignedRoles && member.assignedRoles.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-700">
                    <p className="font-medium">Attention</p>
                    <p>Aucun rôle sélectionné. Tous les rôles actuels seront retirés.</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || roles.length === 0}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Attribution...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Attribuer {selectedRoles.length} rôle(s)
                </>
              )}
            </Button>
          </div>

        </div>
      </div>

      <SuccessMessage />
    </>
  )
}