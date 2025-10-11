'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'
import { 
  X, 
  Handshake,
  Euro,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react'

interface LoanDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  associationId: string
  loanId: number
}

interface LoanDetails {
  id: number
  title: string
  description: string
  amountRequested: string
  currency: string
  status: string
  isLoan: boolean
  loanTerms: {
    durationMonths: number
    interestRate: number
    monthlyPayment: number
  }
  borrower: {
    name: string
    email?: string
    phone?: string
  }
  requester: {
    firstName: string
    lastName: string
  }
  section?: {
    name: string
  }
  createdAt: string
  repayments: Array<{
    id: number
    amount: number
    principalAmount: number
    interestAmount: number
    penaltyAmount: number
    paymentDate: string
    dueDate: string
    paymentMethod: string
    manualReference: string
    status: string
    daysLate: number
    notes?: string
    validator?: {
      firstName: string
      lastName: string
    }
    createdAt: string
  }>
  summary?: {
    totalRepaid: number
    totalPending: number
    loanAmount: number
    outstanding: number
  }
}

export const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({
  isOpen,
  onClose,
  associationId,
  loanId
}) => {
  const { token } = useAuthStore()
  const [loanDetails, setLoanDetails] = useState<LoanDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen && loanId) {
      fetchLoanDetails()
    }
  }, [isOpen, loanId])

  const fetchLoanDetails = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Récupérer les détails du prêt
      const loanResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests/${loanId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (!loanResponse.ok) {
        throw new Error('Erreur chargement prêt')
      }

      const loanData = await loanResponse.json()

      // Récupérer les remboursements
      const repaymentsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests/${loanId}/repayments`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      let repayments = []
      let summary = null

      if (repaymentsResponse.ok) {
        const repaymentsData = await repaymentsResponse.json()
        repayments = repaymentsData.data?.repayments || []
        summary = repaymentsData.data?.summary || null
      }

      // Transformer les données
      const borrower = loanData.beneficiaryExternal ? {
        name: loanData.beneficiaryExternal.name,
        email: '',
        phone: loanData.beneficiaryExternal.contact || ''
      } : loanData.beneficiary ? {
        name: `${loanData.beneficiary.firstName} ${loanData.beneficiary.lastName}`,
        email: '',
        phone: ''
      } : { name: 'N/A' }

      setLoanDetails({
        ...loanData,
        borrower,
        repayments,
        summary
      })

    } catch (error) {
      console.error('Erreur chargement détails:', error)
      setError('Impossible de charger les détails du prêt')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">En attente</Badge>
      case 'validated':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Validé</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Refusé</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods: {[key: string]: string} = {
      'bank_transfer': 'Virement bancaire',
      'cash': 'Espèces',
      'check': 'Chèque',
      'card_payment': 'Carte bancaire'
    }
    return methods[method] || method
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Handshake className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Détails du Prêt
              </h2>
              <p className="text-sm text-gray-600">
                #{loanId}
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
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={onClose}>Fermer</Button>
            </div>
          ) : loanDetails ? (
            <div className="space-y-6">

              {/* Informations principales */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{loanDetails.title}</h3>
                <p className="text-gray-700 mb-4">{loanDetails.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Montant accordé</p>
                    <p className="text-xl font-bold text-blue-600">
                      {parseFloat(loanDetails.amountRequested).toFixed(2)} {loanDetails.currency}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Durée</p>
                    <p className="text-xl font-bold text-gray-900">
                      {loanDetails.loanTerms?.durationMonths || 0} mois
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Échéance mensuelle</p>
                    <p className="text-xl font-bold text-gray-900">
                      {loanDetails.loanTerms?.monthlyPayment?.toFixed(2) || '0.00'} {loanDetails.currency}
                    </p>
                  </div>
                </div>
              </div>

              {/* Emprunteur */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Emprunteur
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="font-medium text-gray-900">{loanDetails.borrower.name}</p>
                  {loanDetails.borrower.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      <span>{loanDetails.borrower.phone}</span>
                    </div>
                  )}
                  {loanDetails.borrower.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      <span>{loanDetails.borrower.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Résumé remboursements */}
              {loanDetails.summary && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Progression des remboursements
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600">Remboursé</p>
                      <p className="text-xl font-bold text-green-700">
                        {loanDetails.summary.totalRepaid.toFixed(2)} {loanDetails.currency}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-600">Restant dû</p>
                      <p className="text-xl font-bold text-orange-700">
                        {loanDetails.summary.outstanding.toFixed(2)} {loanDetails.currency}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">En attente</p>
                      <p className="text-xl font-bold text-blue-700">
                        {loanDetails.summary.totalPending.toFixed(2)} {loanDetails.currency}
                      </p>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progression</span>
                      <span>
                        {((loanDetails.summary.totalRepaid / loanDetails.summary.loanAmount) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ 
                          width: `${(loanDetails.summary.totalRepaid / loanDetails.summary.loanAmount) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Historique remboursements */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Historique des remboursements ({loanDetails.repayments.length})
                </h4>
                
                {loanDetails.repayments.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun remboursement enregistré</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loanDetails.repayments.map((repayment) => (
                      <div key={repayment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">
                                {repayment.amount.toFixed(2)} {loanDetails.currency}
                              </p>
                              {getStatusBadge(repayment.status)}
                              {repayment.daysLate > 0 && (
                                <Badge variant="outline" className="bg-red-50 text-red-700">
                                  En retard ({repayment.daysLate}j)
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {getPaymentMethodLabel(repayment.paymentMethod)} - {repayment.manualReference}
                            </p>
                            {repayment.notes && (
                              <p className="text-sm text-gray-500 mt-1">{repayment.notes}</p>
                            )}
                            {repayment.validator && (
                              <p className="text-xs text-gray-500 mt-2">
                                Validé par {repayment.validator.firstName} {repayment.validator.lastName}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <p>{new Date(repayment.paymentDate).toLocaleDateString('fr-FR')}</p>
                            <p className="text-xs">Échéance #{repayment.id}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Informations administratives */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Informations</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Enregistré par</p>
                    <p className="font-medium text-gray-900">
                      {loanDetails.requester.firstName} {loanDetails.requester.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Date de création</p>
                    <p className="font-medium text-gray-900">
                      {new Date(loanDetails.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {loanDetails.section && (
                    <div>
                      <p className="text-gray-600">Section</p>
                      <p className="font-medium text-gray-900">{loanDetails.section.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Taux d'intérêt</p>
                    <p className="font-medium text-gray-900">
                      {loanDetails.loanTerms?.interestRate || 0}%
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>

      </div>
    </div>
  )
}