// src/components/modules/associations/roles/modals/CustomPermissionsModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useRoles } from '@/hooks/association'
import { AssociationMember } from '@/types/association/member'
import { Permission } from '@/types/association/role'
import { toast } from 'sonner'
import {
  X,
  Save,
  Lock,
  Plus,
  Minus,
  CheckCircle,
  Info,
  AlertCircle,
  Crown,
} from 'lucide-react'

// ============================================
// INTERFACES
// ============================================

interface CustomPermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  associationId: number
  member: AssociationMember
  onSuccess: () => void
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const CustomPermissionsModal: React.FC<CustomPermissionsModalProps> = ({
  isOpen,
  onClose,
  associationId,
  member,
  onSuccess,
}) => {
  const t = useTranslations('roles')
  const tCommon = useTranslations('common')
  
  const { availablePermissions, roles } = useRoles(associationId)
  
  const [grantedPermissions, setGrantedPermissions] = useState<string[]>(
    member.customPermissions?.granted || []
  )
  const [revokedPermissions, setRevokedPermissions] = useState<string[]>(
    member.customPermissions?.revoked || []
  )
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setGrantedPermissions(member.customPermissions?.granted || [])
      setRevokedPermissions(member.customPermissions?.revoked || [])
    }
  }, [isOpen, member])

  // ============================================
  // CALCULER PERMISSIONS
  // ============================================

  // Permissions des rôles attribués
  const rolePermissions = () => {
    const permissions = new Set<string>()
    
    member.assignedRoles?.forEach(roleId => {
      const role = roles.find(r => r.id === roleId)
      role?.permissions.forEach(p => permissions.add(p))
    })

    return Array.from(permissions)
  }

  // Permissions effectives finales
  const effectivePermissions = () => {
    if (member.isAdmin) {
      return availablePermissions.map(p => p.id)
    }

    const permissions = new Set(rolePermissions())
    
    grantedPermissions.forEach(p => permissions.add(p))
    revokedPermissions.forEach(p => permissions.delete(p))

    return Array.from(permissions)
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleGrantPermission = (permissionId: string) => {
    setGrantedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    )
    
    // Retirer des revoked si ajouté dans granted
    if (revokedPermissions.includes(permissionId)) {
      setRevokedPermissions(prev => prev.filter(p => p !== permissionId))
    }
  }

  const handleRevokePermission = (permissionId: string) => {
    setRevokedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    )
    
    // Retirer des granted si ajouté dans revoked
    if (grantedPermissions.includes(permissionId)) {
      setGrantedPermissions(prev => prev.filter(p => p !== permissionId))
    }
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    
    try {
      // Envoyer les permissions granted
      if (grantedPermissions.length > 0) {
        for (const permission of grantedPermissions) {
          if (!member.customPermissions?.granted.includes(permission)) {
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members/${member.id}/permissions/grant`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ permission })
              }
            )
          }
        }
      }

      // Envoyer les permissions revoked
      if (revokedPermissions.length > 0) {
        for (const permission of revokedPermissions) {
          if (!member.customPermissions?.revoked.includes(permission)) {
            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members/${member.id}/permissions/revoke`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ permission })
              }
            )
          }
        }
      }

      setShowSuccess(true)

      setTimeout(() => {
        setShowSuccess(false)
        onSuccess()
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Erreur gestion permissions:', error)
      toast.error('Erreur lors de la mise à jour des permissions')
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================
  // GROUPER PAR CATÉGORIE
  // ============================================

  const groupedAvailablePermissions = () => {
    const grouped: Record<string, Permission[]> = {
      finances: [],
      membres: [],
      administration: [],
      documents: [],
      evenements: []
    }

    availablePermissions.forEach(perm => {
      if (perm.category && perm.category in grouped) {
        grouped[perm.category].push(perm)
      }
    })

    return grouped
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
            {t('success.permissions_updated')}
          </h3>
          <div className="text-gray-600">
            <p><strong>{member.user?.firstName} {member.user?.lastName}</strong></p>
            <p className="text-sm">Permissions personnalisées mises à jour</p>
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
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-gray-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Permissions spéciales
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
                      Les administrateurs ont automatiquement toutes les permissions. 
                      Les permissions personnalisées n'auront aucun effet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Explication */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-2">À propos des permissions personnalisées</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li><strong>Ajouter</strong> : Accorde une permission en plus des rôles</li>
                    <li><strong>Retirer</strong> : Révoque une permission accordée par les rôles</li>
                  </ul>
                  <p className="mt-2">
                    Permissions effectives finales : {effectivePermissions().length}/{availablePermissions.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Permissions par catégorie */}
            <div className="space-y-4">
              {Object.entries(groupedAvailablePermissions()).map(([category, permissions]) => {
                if (permissions.length === 0) return null

                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 capitalize mb-3">
                      {t(`categories.${category}`)}
                    </h3>

                    <div className="space-y-2">
                      {permissions.map((permission: Permission) => {
                        const hasFromRole = rolePermissions().includes(permission.id)
                        const isGranted = grantedPermissions.includes(permission.id)
                        const isRevoked = revokedPermissions.includes(permission.id)
                        const isEffective = effectivePermissions().includes(permission.id)

                        return (
                          <div
                            key={permission.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg ${
                              isEffective ? 'border-green-200 bg-green-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {permission.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {permission.description}
                              </p>
                              <div className="flex gap-2 mt-2">
                                {hasFromRole && (
                                  <Badge variant="secondary" className="text-xs">
                                    Via rôle
                                  </Badge>
                                )}
                                {isGranted && (
                                  <Badge className="text-xs bg-green-100 text-green-700">
                                    <Plus className="h-3 w-3 mr-1" />
                                    Ajoutée
                                  </Badge>
                                )}
                                {isRevoked && (
                                  <Badge className="text-xs bg-red-100 text-red-700">
                                    <Minus className="h-3 w-3 mr-1" />
                                    Retirée
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={isGranted ? "default" : "outline"}
                                onClick={() => handleGrantPermission(permission.id)}
                                disabled={isSaving || member.isAdmin || hasFromRole}
                                title="Ajouter cette permission"
                                className={isGranted ? 'bg-green-600' : ''}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant={isRevoked ? "default" : "outline"}
                                onClick={() => handleRevokePermission(permission.id)}
                                disabled={isSaving || member.isAdmin || !hasFromRole}
                                title="Retirer cette permission"
                                className={isRevoked ? 'bg-red-600 text-white' : ''}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Résumé des changements */}
            {(grantedPermissions.length > 0 || revokedPermissions.length > 0) && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-900 mb-3">Résumé des modifications</p>
                
                {grantedPermissions.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 mb-2">
                      <Plus className="h-4 w-4 inline mr-1 text-green-600" />
                      Permissions ajoutées : {grantedPermissions.length}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {grantedPermissions.map(permId => (
                        <Badge key={permId} className="text-xs bg-green-100 text-green-700">
                          {availablePermissions.find(p => p.id === permId)?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {revokedPermissions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      <Minus className="h-4 w-4 inline mr-1 text-red-600" />
                      Permissions retirées : {revokedPermissions.length}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {revokedPermissions.map(permId => (
                        <Badge key={permId} className="text-xs bg-red-100 text-red-700">
                          {availablePermissions.find(p => p.id === permId)?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
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
              disabled={isSaving || member.isAdmin}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {tCommon('save')}
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