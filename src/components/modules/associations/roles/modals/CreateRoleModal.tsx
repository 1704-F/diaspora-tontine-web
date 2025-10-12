// src/components/modules/associations/roles/modals/CreateRoleModal.tsx
'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useRoles } from '@/hooks/association'
import { CreateRolePayload, Permission  } from '@/types/association/role'
import { toast } from 'sonner'
import {
  X,
  Save,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
  Palette,
  Crown,
  Lock,
} from 'lucide-react'

// ============================================
// INTERFACES
// ============================================

interface CreateRoleModalProps {
  isOpen: boolean
  onClose: () => void
  associationId: number
  onSuccess: () => void
}

interface FormData {
  name: string
  description: string
  permissions: string[]
  color: string
  iconName?: string
  isUnique: boolean
  isMandatory: boolean
}

interface FormErrors {
  [key: string]: string
}

// ============================================
// COULEURS PRÉDÉFINIES
// ============================================

const PRESET_COLORS = [
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EC4899', label: 'Rose' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#10B981', label: 'Vert' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#6366F1', label: 'Indigo' },
]

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  associationId,
  onSuccess,
}) => {
  const t = useTranslations('roles')
  const tCommon = useTranslations('common')
  
  const { groupedPermissions, createRole } = useRoles(associationId)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    permissions: [],
    color: PRESET_COLORS[0].value,
    iconName: undefined,
    isUnique: false,
    isMandatory: false,
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // ============================================
  // VALIDATION
  // ============================================

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = t('errors.name_required')
    }

    if (!formData.description.trim()) {
      newErrors.description = t('errors.description_required')
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = t('errors.min_permissions')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
    // Clear error si on ajoute une permission
    if (errors.permissions) {
      setErrors(prev => ({ ...prev, permissions: '' }))
    }
  }

  const handleSelectAll = () => {
    if (!groupedPermissions) return
    
    const allPermissions = Object.values(groupedPermissions)
      .flat()
      .map(p => p.id)
    
    setFormData(prev => ({ ...prev, permissions: allPermissions }))
  }

  const handleDeselectAll = () => {
    setFormData(prev => ({ ...prev, permissions: [] }))
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error(t('errors.name_required'))
      return
    }

    setIsSaving(true)
    
    try {
      const payload: CreateRolePayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions,
        color: formData.color,
        iconName: formData.iconName,
        isUnique: formData.isUnique,
        isMandatory: formData.isMandatory,
      }

      await createRole(payload)

      // Afficher succès
      setShowSuccess(true)

      // Fermer après 2 secondes
      setTimeout(() => {
        setShowSuccess(false)
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          name: '',
          description: '',
          permissions: [],
          color: PRESET_COLORS[0].value,
          iconName: undefined,
          isUnique: false,
          isMandatory: false,
        })
      }, 2000)

    } catch (error) {
      console.error('Erreur création rôle:', error)
      toast.error(t('errors.load_failed'))
    } finally {
      setIsSaving(false)
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
            {t('success.role_created')}
          </h3>
          <div className="text-gray-600 mb-4">
            <p><strong>{formData.name}</strong></p>
            <p className="text-sm">{formData.permissions.length} permissions</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-green-600 h-1 rounded-full animate-pulse" style={{width: '100%'}}></div>
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
              <Shield className="h-5 w-5 text-gray-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('actions.create_role')}
                </h2>
                <p className="text-sm text-gray-600">
                  {t('subtitle')}
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
            
            {/* Nom du rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.name')} *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
                }}
                placeholder={t('form.name_placeholder')}
                error={errors.name}
                disabled={isSaving}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('form.description')} *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                  if (errors.description) setErrors(prev => ({ ...prev, description: '' }))
                }}
                placeholder={t('form.description_placeholder')}
                rows={3}
                disabled={isSaving}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                } ${isSaving ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette className="h-4 w-4 inline mr-1" />
                {t('form.color')}
              </label>
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    disabled={isSaving}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      formData.color === color.value 
                        ? 'border-gray-900 scale-110' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Sélectionnez une couleur pour identifier visuellement ce rôle
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isUnique}
                  onChange={(e) => setFormData(prev => ({ ...prev, isUnique: e.target.checked }))}
                  disabled={isSaving}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {t('form.is_unique')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {t('form.is_unique_help')}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isMandatory}
                  onChange={(e) => setFormData(prev => ({ ...prev, isMandatory: e.target.checked }))}
                  disabled={isSaving}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {t('form.is_mandatory')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {t('form.is_mandatory_help')}
                  </p>
                </div>
              </label>
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  <Lock className="h-4 w-4 inline mr-1" />
                  {t('form.permissions_title')} *
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={isSaving}
                  >
                    {t('form.select_all')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={isSaving}
                  >
                    {t('form.deselect_all')}
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {t('form.permissions_description')}
              </p>

              {errors.permissions && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.permissions}
                  </p>
                </div>
              )}

              {/* Permissions groupées par catégorie */}
              <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {groupedPermissions && Object.entries(groupedPermissions).map(([category, permissions]) => {
                  if (permissions.length === 0) return null
                  
                  return (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {t(`categories.${category}`)}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.map((permission: Permission) => (
                          <label
                            key={permission.id}
                            className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.permissions.includes(permission.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => handlePermissionToggle(permission.id)}
                              disabled={isSaving}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {permission.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {permission.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {formData.permissions.length} permission(s) sélectionnée(s)
              </p>
            </div>

            {/* Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">À propos des rôles</p>
                  <p>
                    Les rôles permettent de regrouper des permissions et de les attribuer facilement aux membres. 
                    Vous pourrez toujours modifier ce rôle plus tard.
                  </p>
                </div>
              </div>
            </div>

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
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Création...
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

      {/* Success message */}
      <SuccessMessage />
    </>
  )
}