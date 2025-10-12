// src/components/modules/associations/roles/modals/TransferAdminModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import {
  X,
  Crown,
  AlertTriangle,
  CheckCircle,
  User,
  Lock,
  ArrowRight,
} from 'lucide-react'

// ============================================
// INTERFACES
// ============================================

interface TransferAdminModalProps {
  isOpen: boolean
  onClose: () => void
  associationId: number
  onSuccess: () => void
}

interface Member {
  id: number
  userId: number
  user: {
    firstName: string
    lastName: string
    phoneNumber: string
    email: string
  }
  memberType: string
  status: string
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const TransferAdminModal: React.FC<TransferAdminModalProps> = ({
  isOpen,
  onClose,
  associationId,
  onSuccess,
}) => {
  const t = useTranslations('roles')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { token, user } = useAuthStore()
  
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [confirmationPassword, setConfirmationPassword] = useState('')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isTransferring, setIsTransferring] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // ============================================
  // CHARGER LES MEMBRES
  // ============================================

  useEffect(() => {
    if (isOpen) {
      fetchMembers()
    }
  }, [isOpen])

  const fetchMembers = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const result = await response.json()
        // Filtrer : seulement les membres actifs, sauf l'admin actuel
        const activeMembers = result.data.members.filter(
          (m: Member) => m.status === 'active' && m.userId !== user?.id
        )
        setMembers(activeMembers)
      }
    } catch (error) {
      console.error('Erreur chargement membres:', error)
      toast.error('Erreur lors du chargement des membres')
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================
  // VALIDATION
  // ============================================

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!selectedMemberId) {
      newErrors.member = 'Veuillez sélectionner un membre'
    }

    if (!confirmationPassword.trim()) {
      newErrors.password = 'Veuillez saisir votre mot de passe'
    }

    if (!reason.trim()) {
      newErrors.reason = 'Veuillez préciser la raison du transfert'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleTransfer = async () => {
    if (!validateForm()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setIsTransferring(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/transfer-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            newAdminMemberId: parseInt(selectedMemberId),
            password: confirmationPassword,
            reason: reason.trim()
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du transfert')
      }

      setShowSuccess(true)

      // Rediriger après 3 secondes
      setTimeout(() => {
        setShowSuccess(false)
        onSuccess()
        onClose()
        // Rediriger vers la page de l'association (plus admin)
        router.push(`/modules/associations/${associationId}`)
      }, 3000)

    } catch (error) {
      console.error('Erreur transfert admin:', error)
      toast.error(error instanceof Error ? error.message : 'Erreur lors du transfert')
    } finally {
      setIsTransferring(false)
    }
  }

  // ============================================
  // SUCCESS MESSAGE
  // ============================================

  const SuccessMessage = () => {
    if (!showSuccess) return null

    const selectedMember = members.find(m => m.id.toString() === selectedMemberId)

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg shadow-2xl p-8 mx-4 max-w-md w-full text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 animate-bounce" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Transfert effectué !
          </h3>
          <div className="text-gray-600 mb-4">
            <p><strong>{selectedMember?.user.firstName} {selectedMember?.user.lastName}</strong></p>
            <p className="text-sm">est maintenant administrateur de l'association</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            Vous allez être redirigé...
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
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Transférer la propriété
                </h2>
                <p className="text-sm text-gray-600">
                  Transférer les droits d'administrateur
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              disabled={isTransferring}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Contenu */}
          <div className="p-6 space-y-6">

            {/* Warning */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-2">Action irréversible</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Vous perdrez tous vos droits d'administrateur</li>
                    <li>Le nouveau propriétaire aura le contrôle total de l'association</li>
                    <li>Seul le nouveau propriétaire pourra transférer à nouveau</li>
                  </ul>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <>
                {/* Sélection du membre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Nouveau propriétaire *
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => {
                      setSelectedMemberId(e.target.value)
                      if (errors.member) setErrors(prev => ({ ...prev, member: '' }))
                    }}
                    disabled={isTransferring}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.member ? 'border-red-300' : 'border-gray-300'
                    } ${isTransferring ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Sélectionner un membre...</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.user.firstName} {member.user.lastName} - {member.user.phoneNumber} ({member.memberType})
                      </option>
                    ))}
                  </select>
                  {errors.member && (
                    <p className="text-red-500 text-sm mt-1">{errors.member}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {members.length} membre(s) éligible(s)
                  </p>
                </div>

                {/* Aperçu du transfert */}
                {selectedMemberId && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Vous</p>
                        <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-amber-600 mt-1">Administrateur</p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-blue-600" />
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Nouveau propriétaire</p>
                        <p className="font-medium text-gray-900">
                          {members.find(m => m.id.toString() === selectedMemberId)?.user.firstName}{' '}
                          {members.find(m => m.id.toString() === selectedMemberId)?.user.lastName}
                        </p>
                        <p className="text-xs text-green-600 mt-1">Deviendra admin</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mot de passe de confirmation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="h-4 w-4 inline mr-1" />
                    Confirmez votre mot de passe *
                  </label>
                  <Input
                    type="password"
                    value={confirmationPassword}
                    onChange={(e) => {
                      setConfirmationPassword(e.target.value)
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                    }}
                    placeholder="Saisissez votre mot de passe"
                    error={errors.password}
                    disabled={isTransferring}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pour des raisons de sécurité, veuillez confirmer votre identité
                  </p>
                </div>

                {/* Raison du transfert */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du transfert *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value)
                      if (errors.reason) setErrors(prev => ({ ...prev, reason: '' }))
                    }}
                    placeholder="Ex: Départ, passation de pouvoir, nouvelle direction..."
                    rows={3}
                    disabled={isTransferring}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.reason ? 'border-red-300' : 'border-gray-300'
                    } ${isTransferring ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  {errors.reason && (
                    <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Cette information sera enregistrée dans l'historique
                  </p>
                </div>

              </>
            )}

          </div>

          {/* Footer */}
          {!isLoading && (
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isTransferring}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={isTransferring || members.length === 0}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isTransferring ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Transfert en cours...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Transférer la propriété
                  </>
                )}
              </Button>
            </div>
          )}

        </div>
      </div>

      <SuccessMessage />
    </>
  )
}