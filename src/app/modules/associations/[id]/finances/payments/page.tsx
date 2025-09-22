// src/app/modules/associations/[id]/finances/payments/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  FileCheck,
  Calendar,
  Upload,
  CheckCircle,
  AlertTriangle,
  Users,
  Building,
  Handshake,
  Star,
  Zap,
  FileText,
  Euro,
  Clock,
  Download
} from "lucide-react";

interface ApprovedExpense {
  id: number;
  title: string;
  description: string;
  expenseType: string;
  amountApproved: number;
  currency: string;
  urgencyLevel: string;
  isLoan: boolean;
  approvedAt: string;
  requester: {
    firstName: string;
    lastName: string;
  };
  beneficiary?: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
  };
  beneficiaryExternal?: {
    name: string;
    contact?: string;
    iban?: string;
  };
}

interface PaymentConfirmation {
  expenseId: number;
  paymentMethod: string;
  executionDate: string;
  paymentReference: string;
  details: string;
  justificatifFile?: File;
}

export default function PaymentsPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const associationId = params.id as string;

  const [association, setAssociation] = useState<any>(null);
  const [approvedExpenses, setApprovedExpenses] = useState<ApprovedExpense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<ApprovedExpense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  
  // Modal paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentConfirmation>({
    expenseId: 0,
    paymentMethod: 'bank_transfer',
    executionDate: new Date().toISOString().split('T')[0],
    paymentReference: '',
    details: '',
    justificatifFile: undefined
  });

  useEffect(() => {
    if (associationId && token && user) {
      // Vérifier que l'utilisateur est trésorier
      if (!canUserMakePayments()) {
        setError("Seul le trésorier peut effectuer les paiements");
        return;
      }
      fetchData();
    }
  }, [associationId, token, user]);

  const canUserMakePayments = () => {
    return user?.roles?.includes('tresorier');
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAssociation(),
        fetchApprovedExpenses()
      ]);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      setError("Erreur de chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssociation = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      const result = await response.json();
      setAssociation(result.data.association);
    }
  };

  const fetchApprovedExpenses = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests?status=approved&sortBy=urgencyLevel,approvedAt&sortOrder=DESC`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      const result = await response.json();
      setApprovedExpenses(result.expenseRequests || []);
    }
  };

  const getExpenseTypeIcon = (type: string) => {
    switch (type) {
      case 'aide_membre': return Users;
      case 'depense_operationnelle': return Building;
      case 'pret_partenariat': return Handshake;
      case 'projet_special': return Star;
      case 'urgence_communautaire': return Zap;
      default: return FileText;
    }
  };

  const getExpenseTypeLabel = (type: string) => {
    switch (type) {
      case 'aide_membre': return 'Aide aux membres';
      case 'depense_operationnelle': return 'Dépense opérationnelle';
      case 'pret_partenariat': return 'Prêt & partenariat';
      case 'projet_special': return 'Projet spécial';
      case 'urgence_communautaire': return 'Urgence communautaire';
      default: return type;
    }
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">🚨 Critique</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">⚡ Urgent</Badge>;
      case 'normal':
        return <Badge variant="outline">📊 Normal</Badge>;
      default:
        return null;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return Banknote;
      case 'cash': return Euro;
      case 'check': return FileCheck;
      default: return CreditCard;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Virement bancaire';
      case 'cash': return 'Espèces';
      case 'check': return 'Chèque';
      case 'mobile_money': return 'Mobile Money';
      default: return method;
    }
  };

  const openPaymentModal = (expense: ApprovedExpense) => {
    setSelectedExpense(expense);
    setPaymentData({
      expenseId: expense.id,
      paymentMethod: 'bank_transfer',
      executionDate: new Date().toISOString().split('T')[0],
      paymentReference: `PAY-${expense.id}-${new Date().getFullYear()}`,
      details: '',
      justificatifFile: undefined
    });
    setShowPaymentModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPaymentData({
        ...paymentData,
        justificatifFile: file
      });
    }
  };

  const confirmPayment = async () => {
    if (!paymentData.paymentReference.trim() || !paymentData.details.trim()) {
      setError("Référence et détails du paiement sont requis");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('paymentMethod', paymentData.paymentMethod);
      formData.append('executionDate', paymentData.executionDate);
      formData.append('paymentReference', paymentData.paymentReference);
      formData.append('details', paymentData.details);
      
      if (paymentData.justificatifFile) {
        formData.append('justificatif', paymentData.justificatifFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests/${paymentData.expenseId}/pay`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        setShowPaymentModal(false);
        setSelectedExpense(null);
        setPaymentData({
          expenseId: 0,
          paymentMethod: 'bank_transfer',
          executionDate: new Date().toISOString().split('T')[0],
          paymentReference: '',
          details: '',
          justificatifFile: undefined
        });
        await fetchApprovedExpenses(); // Recharger la liste
      } else {
        const error = await response.json();
        setError(error.message || "Erreur lors de la confirmation du paiement");
      }
    } catch (error) {
      console.error("Erreur paiement:", error);
      setError("Erreur lors de la confirmation du paiement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !canUserMakePayments()) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/modules/associations/${associationId}/finances`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux finances
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Paiements à Effectuer</h1>
              <p className="text-gray-600">{association?.name}</p>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paiements en attente</p>
                  <p className="text-2xl font-bold text-orange-600">{approvedExpenses.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Montant total</p>
                  <p className="text-2xl font-bold text-red-600">
                    {approvedExpenses.reduce((sum, exp) => sum + exp.amountApproved, 0).toFixed(2)} €
                  </p>
                </div>
                <Euro className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paiements urgents</p>
                  <p className="text-2xl font-bold text-red-600">
                    {approvedExpenses.filter(exp => ['critical', 'high'].includes(exp.urgencyLevel)).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des paiements */}
        <div className="space-y-4">
          {approvedExpenses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun paiement en attente</h3>
                <p className="text-gray-600">Toutes les dépenses approuvées ont été payées.</p>
              </CardContent>
            </Card>
          ) : (
            approvedExpenses.map((expense) => {
              const Icon = getExpenseTypeIcon(expense.expenseType);
              const beneficiary = expense.beneficiary ? 
                `${expense.beneficiary.firstName} ${expense.beneficiary.lastName}` :
                expense.beneficiaryExternal?.name || 'Bénéficiaire externe';

              return (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{expense.title}</h3>
                            <p className="text-sm text-gray-600">{getExpenseTypeLabel(expense.expenseType)}</p>
                          </div>
                          {getUrgencyBadge(expense.urgencyLevel)}
                          {expense.isLoan && (
                            <Badge className="bg-purple-100 text-purple-700">💰 Prêt</Badge>
                          )}
                        </div>

                        <p className="text-gray-700 mb-4 line-clamp-2">{expense.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Demandeur</p>
                            <p className="font-medium">{expense.requester.firstName} {expense.requester.lastName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Bénéficiaire</p>
                            <p className="font-medium">{beneficiary}</p>
                            {expense.beneficiary?.phoneNumber && (
                              <p className="text-xs text-gray-500">{expense.beneficiary.phoneNumber}</p>
                            )}
                            {expense.beneficiary?.email && (
                              <p className="text-xs text-gray-500">{expense.beneficiary.email}</p>
                            )}
                            {expense.beneficiaryExternal?.iban && (
                              <p className="text-xs text-gray-500">IBAN: {expense.beneficiaryExternal.iban}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-500">Approuvé le</p>
                            <p className="font-medium">{new Date(expense.approvedAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-6">
                        <p className="text-2xl font-bold text-gray-900 mb-4">
                          {expense.amountApproved.toFixed(2)} {expense.currency}
                        </p>

                        <Button
                          onClick={() => openPaymentModal(expense)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Confirmer paiement
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal confirmation paiement */}
        {showPaymentModal && selectedExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">💳 Confirmer le Paiement</h2>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900">{selectedExpense.title}</h3>
                <p className="text-blue-700">
                  Montant: {selectedExpense.amountApproved.toFixed(2)} € | 
                  Bénéficiaire: {selectedExpense.beneficiary ? 
                    `${selectedExpense.beneficiary.firstName} ${selectedExpense.beneficiary.lastName}` :
                    selectedExpense.beneficiaryExternal?.name || 'Externe'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="paymentMethod" required>Mode de paiement</Label>
                  <Select value={paymentData.paymentMethod} onValueChange={(value) => 
                    setPaymentData({ ...paymentData, paymentMethod: value })
                  }>
                    <SelectTrigger id="paymentMethod" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">🏦 Virement bancaire</SelectItem>
                      <SelectItem value="cash">💵 Espèces</SelectItem>
                      <SelectItem value="check">📝 Chèque</SelectItem>
                      <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="executionDate" required>Date d'exécution</Label>
                  <input
                    id="executionDate"
                    type="date"
                    value={paymentData.executionDate}
                    onChange={(e) => setPaymentData({ ...paymentData, executionDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="paymentReference" required>Référence du paiement</Label>
                  <input
                    id="paymentReference"
                    type="text"
                    value={paymentData.paymentReference}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Ex: VIR-20241201-MARIE-001"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="details" required>Détails du paiement</Label>
                  <Textarea
                    id="details"
                    value={paymentData.details}
                    onChange={(e) => setPaymentData({ ...paymentData, details: e.target.value })}
                    placeholder="Ex: Virement effectué via Crédit Agricole vers compte personnel Marie Diallo. Référence interne VIR-001234."
                    className="mt-1"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="justificatif">Justificatif (optionnel)</Label>
                  <div className="mt-1 flex items-center space-x-3">
                    <input
                      id="justificatif"
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {paymentData.justificatifFile && (
                      <span className="text-sm text-green-600">✓ {paymentData.justificatifFile.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, JPG, PNG - Max 5MB (reçu, capture d'écran virement, etc.)
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedExpense(null);
                    setPaymentData({
                      expenseId: 0,
                      paymentMethod: 'bank_transfer',
                      executionDate: new Date().toISOString().split('T')[0],
                      paymentReference: '',
                      details: '',
                      justificatifFile: undefined
                    });
                  }}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmPayment}
                  disabled={isSubmitting || !paymentData.paymentReference.trim() || !paymentData.details.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirmer paiement
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-4 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}