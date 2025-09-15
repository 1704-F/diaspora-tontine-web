// src/components/modules/associations/AddCotisationModal.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'
import { 
  X, 
  Save, 
  User, 
  Euro,
  Calendar,
  FileText,
  AlertCircle,
  Info
} from 'lucide-react'

interface AddCotisationModalProps {
  isOpen: boolean
  onClose: () => void
  associationId: string
  onCotisationAdded: () => void
}

interface Member {
  id: number
  userId: number
  user: {
    id: number
    firstName: string
    lastName: string
    phoneNumber: string
  }
  memberType: string
  section: {
    id: number
    name: string
  } | null
  expectedAmount: number
}

interface Association {
  id: number
  name: string
  isMultiSection: boolean
  memberTypes: Array<{
    name: string
    cotisationAmount: number
  }>
}

export const AddCotisationModal: React.FC<AddCotisationModalProps> = ({
  isOpen,
  onClose,
  associationId,
  onCotisationAdded
}) => {
  const { token } = useAuthStore()
  const [members, setMembers] = useState<Member[]>([])
  const [association, setAssociation] = useState<Association | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // États du formulaire
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [reason, setReason] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')

  const months = [
    { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' }, { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' }, { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' }
  ]

  const paymentMethods = [
    { value: 'cash', label: 'Espèces' },
    { value: 'check', label: 'Chèque' },
    { value: 'transfer', label: 'Virement' },
    { value: 'card', label: 'Carte bancaire' }
  ]

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, associationId])

  useEffect(() => {
    // Auto-remplir le montant quand un membre est sélectionné
    if (selectedMemberId) {
      const selectedMember = members.find(m => m.id.toString() === selectedMemberId)
      if (selectedMember) {
        setAmount(selectedMember.expectedAmount.toString())
      }
    }
  }, [selectedMemberId, members])

  const fetchData = async () => {
    if (!token) return

    try {
      setIsLoading(true)

      // Récupérer association et membres en parallèle
      const [associationResponse, membersResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (associationResponse.ok) {
        const assocResult = await associationResponse.json()
        setAssociation(assocResult.data.association)
      }

      if (membersResponse.ok) {
        const membersResult = await membersResponse.json()
        // Calculer le montant attendu pour chaque membre
        const membersWithAmount = membersResult.data.members.map((member: any) => {
          const memberTypeConfig = assocResult.data.association.memberTypes?.find(
            (type: any) => type.name === member.memberType
          )
          return {
            ...member,
            expectedAmount: memberTypeConfig?.cotisationAmount || 0
          }
        })
        setMembers(membersWithAmount)
      }

    } catch (error) {
      console.error('Erreur chargement données:', error)
      setErrors({ fetch: 'Erreur de chargement des données' })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!selectedMemberId) {
      newErrors.member = 'Veuillez sélectionner un membre'
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0'
    }

    if (!reason.trim()) {
      newErrors.reason = 'Veuillez préciser le motif'
    }

    // Vérifier que la cotisation n'existe pas déjà pour ce mois
    // (cette validation pourrait être faite côté serveur aussi)

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      const cotisationData = {
        memberId: parseInt(selectedMemberId),
        amount: parseFloat(amount),
        month,
        year,
        reason: reason.trim(),
        paymentMethod,
        type: 'manual_entry'
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/cotisations-manual`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(cotisationData)
        }
      )

      if (response.ok) {
        onCotisationAdded()
        onClose()
        // Reset form
        setSelectedMemberId('')
        setAmount('')
        setReason('')
        setPaymentMethod('cash')
      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || 'Erreur lors de l\'ajout' })
      }

    } catch (error) {
      console.error('Erreur ajout cotisation:', error)
      setErrors({ submit: 'Erreur de connexion' })
    } finally {
      setIsSaving(false)
    }
  }

  const getValidationInfo = () => {
    if (!association) return null

    if (association.isMultiSection) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <h4 className="font-medium mb-1">Validation requise</h4>
              <p>Cette cotisation devra être validée par :</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Le trésorier de la section concernée, OU</li>
                <li>Un membre du bureau central (trésorier, président)</li>
              </ul>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <h4 className="font-medium mb-1">Validation requise</h4>
              <p>Cette cotisation devra être validée par le trésorier de l'association.</p>
            </div>
          </div>
        </div>
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Euro className="h-5 w-5 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Ajouter une cotisation
              </h2>
              <p className="text-sm text-gray-600">
                Enregistrer un paiement reçu en espèces/chèque
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-6">

              {/* Sélection du membre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membre *
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.member ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un membre...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.user.firstName} {member.user.lastName} - 
                      {member.memberType} ({member.expectedAmount}€/mois)
                      {member.section && ` - ${member.section.name}`}
                    </option>
                  ))}
                </select>
                {errors.member && (
                  <p className="text-red-500 text-sm mt-1">{errors.member}</p>
                )}
              </div>

              {/* Période */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mois *
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Année *
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (€) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  error={errors.amount}
                />
                {selectedMemberId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Montant habituel pour ce type de membre
                  </p>
                )}
              </div>

              {/* Mode de paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {paymentMethods.map(method => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif / Commentaire *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Paiement reçu en espèces lors de la réunion du 15/11"
                  rows={3}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.reason ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                )}
              </div>

              {/* Info validation */}
              {getValidationInfo()}

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-red-700 text-sm">{errors.submit}</p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving && <LoadingSpinner size="sm" />}
              <Save className="h-4 w-4" />
              Enregistrer cotisation
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}