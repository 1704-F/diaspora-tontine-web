'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'
import { 
  X, 
  Save, 
  Euro,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle
} from 'lucide-react'

interface AddRepaymentModalProps {
  isOpen: boolean
  onClose: () => void
  associationId: string
  loanId: number
  loanDetails: {
    title: string
    borrowerName: string
    amountOutstanding: number
    monthlyPayment: number
  }
  onRepaymentAdded: () => void
}

interface SuccessData {
  borrowerName: string
  amount: string
  paymentDate: string
}

export const AddRepaymentModal: React.FC<AddRepaymentModalProps> = ({
  isOpen,
  onClose,
  associationId,
  loanId,
  loanDetails,
  onRepaymentAdded
}) => {
  const { token } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // États du formulaire
  const [amount, setAmount] = useState<string>(loanDetails.monthlyPayment.toString())
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer')
  const [reference, setReference] = useState<string>(
    `REMB-${loanId}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`
  )
  const [notes, setNotes] = useState<string>('')

  // États pour le feedback de succès
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  const paymentMethods = [
    { value: 'bank_transfer', label: '🏦 Virement bancaire' },
    { value: 'cash', label: '💵 Espèces' },
    { value: 'check', label: '📝 Chèque' },
    { value: 'card_payment', label: '💳 Carte bancaire' }
  ]

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0'
    }

    if (parseFloat(amount) > loanDetails.amountOutstanding) {
      newErrors.amount = `Le montant ne peut pas dépasser le restant dû (${loanDetails.amountOutstanding.toFixed(2)}€)`
    }

    if (!reference.trim()) {
      newErrors.reference = 'La référence est obligatoire'
    }

    if (!paymentDate) {
      newErrors.paymentDate = 'La date est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    setErrors({})
    
    try {
      const repaymentData = {
        amount: parseFloat(amount),
        paymentDate,
        paymentMethod,
        manualReference: reference.trim(),
        notes: notes.trim()
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests/${loanId}/repayments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(repaymentData)
        }
      )

      if (response.ok) {
        // Afficher message de succès
        setSuccessData({
          borrowerName: loanDetails.borrowerName,
          amount: amount,
          paymentDate: new Date(paymentDate).toLocaleDateString('fr-FR')
        })
        setShowSuccessMessage(true)

        // Rafraîchir les données parent
        onRepaymentAdded()

        // Fermer automatiquement après 3 secondes
        setTimeout(() => {
          setShowSuccessMessage(false)
          onClose()
          // Reset form
          setAmount(loanDetails.monthlyPayment.toString())
          setPaymentDate(new Date().toISOString().split('T')[0])
          setPaymentMethod('bank_transfer')
          setReference(`REMB-${loanId}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`)
          setNotes('')
          setSuccessData(null)
        }, 3000)

      } else {
        const errorData = await response.json()
        setErrors({ submit: errorData.error || 'Erreur lors de l\'enregistrement' })
      }

    } catch (error) {
      console.error('Erreur enregistrement remboursement:', error)
      setErrors({ submit: 'Erreur de connexion' })
    } finally {
      setIsSaving(false)
    }
  }

  // Composant Message de Succès
  const SuccessMessage = () => {
    if (!showSuccessMessage || !successData) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg shadow-2xl p-8 mx-4 max-w-md w-full text-center">
          
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600 animate-bounce" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Remboursement enregistré !
          </h3>
          
          <div className="text-gray-600 mb-4 space-y-1">
            <p><strong>{successData.borrowerName}</strong></p>
            <p>{successData.amount}€ - {successData.paymentDate}</p>
          </div>

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <Euro className="h-5 w-5 text-gray-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Enregistrer un Remboursement
                </h2>
                <p className="text-sm text-gray-600">
                  {loanDetails.title}
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
            <div className="space-y-6">

              {/* Info prêt */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Emprunteur</p>
                    <p className="font-medium text-gray-900">{loanDetails.borrowerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Restant dû</p>
                    <p className="font-medium text-orange-600">{loanDetails.amountOutstanding.toFixed(2)} €</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Échéance</p>
                    <p className="font-medium text-blue-600">{loanDetails.monthlyPayment.toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant reçu (€) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max={loanDetails.amountOutstanding}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={loanDetails.monthlyPayment.toString()}
                  error={errors.amount}
                  disabled={isSaving || showSuccessMessage}
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de réception *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={isSaving || showSuccessMessage}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.paymentDate ? 'border-red-300' : 'border-gray-300'
                  } ${(isSaving || showSuccessMessage) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                {errors.paymentDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentDate}</p>
                )}
              </div>

              {/* Mode de paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de paiement *
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

              {/* Référence */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence *
                </label>
                <Input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: VIR-ITALIE-NOV-2024"
                  error={errors.reference}
                  disabled={isSaving || showSuccessMessage}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes/Commentaires
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires sur le remboursement..."
                  rows={3}
                  disabled={isSaving || showSuccessMessage}
                  className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    (isSaving || showSuccessMessage) ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-red-700 text-sm">{errors.submit}</p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Footer */}
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
                isSaving ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
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
                  Enregistrer
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