// src/components/modules/associations/roles/modals/DeleteRoleModal.tsx
'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useRoles } from '@/hooks/association'
import { RoleWithUsage } from '@/types/association/role'
import { toast } from 'sonner'
import {
  X,
  Trash2,
  AlertTriangle,
  Shield,
  Users,
  CheckCircle,
} from 'lucide-react'

// ============================================
// INTERFACES
// ============================================

interface DeleteRoleModalProps {
  isOpen: boolean
  onClose: () => void
  associationId: number
  role: RoleWithUsage
  onSuccess: () => void
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const DeleteRoleModal: React.FC<DeleteRoleModalProps> = ({
  isOpen,
  onClose,
  associationId,
  role,
  onSuccess,
}) => {
  const t = useTranslations('roles')
  const tCommon = useTranslations('common')
  
  const { deleteRole } = useRoles(associationId)
  
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // ============================================
  // VÉRIFICATIONS
  // ============================================

  const canDelete = !role.isMandatory && role.membersCount === 0

  const getBlockReason = () => {
    if (role.isMandatory) {
      return t('delete_confirmation.cannot_delete_mandatory')
    }
    if (role.membersCount > 0) {
      return t('delete_confirmation.cannot_delete_assigned', { count: role.membersCount })
    }
    return null
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleDelete = async () => {
    if (!canDelete) return

    setIsDeleting(true)
    
    try {
      await deleteRole(role.id)

      setShowSuccess(true)

      setTimeout(() => {
        setShowSuccess(false)
        onSuccess()
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Erreur suppression rôle:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
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
            {t('success.role_deleted')}
          </h3>
          <div className="text-gray-600">
            <p><strong>{role.name}</strong> a été supprimé</p>
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
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('delete_confirmation.title')}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              disabled={isDeleting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Contenu */}
          <div className="p-6 space-y-4">
            
            {/* Info rôle */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: role.color || '#6B7280' }}
              >
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{role.name}</p>
                <p className="text-sm text-gray-600">
                  {role.permissions?.length || 0} permissions
                </p>
              </div>
            </div>

            {/* Vérifications */}
            {!canDelete ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800 mb-1">
                      Impossible de supprimer ce rôle
                    </p>
                    <p className="text-sm text-red-700">
                      {getBlockReason()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600">
                  {t('delete_confirmation.description')}
                </p>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="text-sm text-orange-700">
                      <p className="font-medium mb-1">Attention</p>
                      <p>Cette action est irréversible. Le rôle sera définitivement supprimé.</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Statistiques */}
            {role.membersCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Users className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  <strong>{role.membersCount}</strong> membre(s) ont actuellement ce rôle
                </p>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting || !canDelete}
              className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300"
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {tCommon('delete')}
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