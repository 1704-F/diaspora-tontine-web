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
  Info,
  CheckCircle
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

interface SuccessData {
  memberName: string
  amount: string
  month: string
  year: number
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

  // États pour le feedback de succès
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

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

      let assocResult = null
      let membersResult = null

      if (associationResponse.ok) {
        assocResult = await associationResponse.json()
        setAssociation(assocResult.data.association)
      }

      if (membersResponse.ok) {
        membersResult = await membersResponse.json()
      }

      // Calculer le montant attendu pour chaque membre (seulement si les deux requêtes ont réussi)
      if (assocResult && membersResult) {
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    setErrors({}) // Clear previous errors
    
    try {
      const selectedMember = members.find(m => m.id.toString() === selectedMemberId)
      
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
        const result = await response.json()
        
        // Afficher message de succès
        const monthName = months.find(m => m.value === month)?.label || month.toString()
        setSuccessData({
          memberName: selectedMember ? `${selectedMember.user.firstName} ${selectedMember.user.lastName}` : 'Membre',
          amount: amount,
          month: monthName,
          year: year
        })
        setShowSuccessMessage(true)

        // Rafraîchir les données parent
        onCotisationAdded()

        // Fermer automatiquement après 3 secondes
        setTimeout(() => {
          setShowSuccessMessage(false)
          onClose()
          // Reset form
          setSelectedMemberId('')
          setAmount('')
          setReason('')
          setPaymentMethod('cash')
          setSuccessData(null)
        }, 3000)

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

  // Composant Message de Succès
  const SuccessMessage = () => {
    if (!showSuccessMessage || !successData) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg shadow-2xl p-8 mx-4 max-w-md w-full text-center">
          
          {/* Icône de succès animée */}
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 animate-bounce" />
          </div>

          {/* Message principal */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Cotisation enregistrée !
          </h3>
          
          {/* Détails */}
          <div className="text-gray-600 mb-4 space-y-1">
            <p><strong>{successData.memberName}</strong></p>
            <p>{successData.amount}€ - {successData.month} {successData.year}</p>
          </div>

          {/* Statut en attente */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-orange-700 text-sm font-medium">
                En attente de validation
              </span>
            </div>
            <p className="text-orange-600 text-xs mt-1">
              Un trésorier doit confirmer la réception du paiement
            </p>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
            <div className="bg-green-600 h-1 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>

          <p className="text-gray-500 text-sm">
            Cette fenêtre se fermera automatiquement...
          </p>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <>
      {/* Modal principale */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          
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
              disabled={isSaving || showSuccessMessage}
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
                    disabled={isSaving || showSuccessMessage}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.member ? 'border-red-300' : 'border-gray-300'
                    } ${(isSaving || showSuccessMessage) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                      disabled={isSaving || showSuccessMessage}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        (isSaving || showSuccessMessage) ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
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
                      disabled={isSaving || showSuccessMessage}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        (isSaving || showSuccessMessage) ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
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
                    disabled={isSaving || showSuccessMessage}
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
                    disabled={isSaving || showSuccessMessage}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      (isSaving || showSuccessMessage) ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
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
                    disabled={isSaving || showSuccessMessage}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      errors.reason ? 'border-red-300' : 'border-gray-300'
                    } ${(isSaving || showSuccessMessage) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                disabled={isSaving || showSuccessMessage}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving || showSuccessMessage}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer cotisation
                  </>
                )}
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Message de succès par-dessus */}
      <SuccessMessage />
    </>
  )
}