// src/app/modules/associations/[id]/finances/[requestId]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Check,
  X,
  Clock,
  Euro,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  Info,
  Building,
  Users,
  Handshake,
  Star,
  Zap,
  ExternalLink,
  Download,
  MessageCircle,
  CreditCard,
  Banknote
} from "lucide-react";

interface ExpenseRequest {
  id: number;
  associationId: number;
  title: string;
  description: string;
  expenseType: string;
  expenseSubtype?: string;
  amountRequested: string;
  amountApproved?: string;
  currency: string;
  status: 'pending' | 'under_review' | 'additional_info_needed' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  urgencyLevel: 'low' | 'normal' | 'high' | 'critical';
  isLoan: boolean;
  loanTerms?: any;
  expectedImpact?: string;
  actualImpact?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  requester: {
    id: number;
    firstName: string;
    lastName: string;
  };
  beneficiary?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  beneficiaryExternal?: {
    name: string;
    type: string;
    contact: string;
    iban?: string;
  };
  association: {
    id: number;
    name: string;
  };
  section?: {
    id: number;
    name: string;
  };
  transaction?: {
    id: number;
    amount: string;
    status: string;
    createdAt: string;
  };
  validationProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  requiredValidators: string[];
  validationHistory?: any[];
  paymentValidator?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  repayments?: any[];
  relatedDocuments?: any[];
  canModify: boolean;
}

export default function ExpenseRequestDetailsPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const associationId = params.id as string;
  const requestId = params.requestId as string;

  const [expenseRequest, setExpenseRequest] = useState<ExpenseRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour les actions
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [validationAction, setValidationAction] = useState<'approve' | 'reject' | 'request_info'>('approve');
  const [validationComment, setValidationComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (associationId && requestId && token) {
      fetchExpenseRequest();
    }
  }, [associationId, requestId, token]);

  const fetchExpenseRequest = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests/${requestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExpenseRequest(data);
      } else if (response.status === 404) {
        setError("Demande non trouvée");
      } else if (response.status === 403) {
        setError("Vous n'avez pas l'autorisation de voir cette demande");
      } else {
        setError("Erreur lors du chargement de la demande");
      }
    } catch (error) {
      console.error("Erreur chargement demande:", error);
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
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

  const getExpenseTypeLabel = (type: string): string => {
    switch (type) {
      case 'aide_membre': return 'Aide aux membres';
      case 'depense_operationnelle': return 'Dépense opérationnelle';
      case 'pret_partenariat': return 'Prêt & partenariat';
      case 'projet_special': return 'Projet spécial';
      case 'urgence_communautaire': return 'Urgence communautaire';
      default: return type;
    }
  };

  const getStatusBadge = (status: ExpenseRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">En attente</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">En cours d'examen</Badge>;
      case 'additional_info_needed':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Infos requises</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approuvée</Badge>;
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Payée</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Refusée</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Annulée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (level: ExpenseRequest['urgencyLevel']) => {
    switch (level) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-300">🚨 Critique</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">⚡ Urgent</Badge>;
      case 'normal':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">📊 Normal</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">🔽 Faible</Badge>;
      default:
        return null;
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests/${requestId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: "Supprimée par l'utilisateur"
          })
        }
      );

      if (response.ok) {
        toast.success("Demande supprimée avec succès");
        router.push(`/modules/associations/${associationId}/finances`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Erreur de connexion");
    } finally {
      setIsDeleting(false);
    }
  };

  const submitValidation = async () => {
    if (!validationComment.trim()) {
      toast.error("Un commentaire est requis");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests/${requestId}/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: validationAction,
            comment: validationComment
          }),
        }
      );

      if (response.ok) {
        toast.success(`Demande ${validationAction === 'approve' ? 'approuvée' : 'traitée'} avec succès`);
        setShowValidationModal(false);
        setValidationComment('');
        fetchExpenseRequest(); // Recharger les données
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la validation");
      }
    } catch (error) {
      console.error("Erreur validation:", error);
      toast.error("Erreur de connexion");
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

  if (error || !expenseRequest) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push(`/modules/associations/${associationId}/finances`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux finances
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const Icon = getExpenseTypeIcon(expenseRequest.expenseType);

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
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
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{expenseRequest.title}</h1>
                <p className="text-gray-600">{getExpenseTypeLabel(expenseRequest.expenseType)}</p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-3">
            {expenseRequest.canModify && (
              <Button
                variant="outline"
                onClick={() => router.push(`/modules/associations/${associationId}/finances/${requestId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
            
            {expenseRequest.status === 'pending' && (
              <Button
                onClick={() => setShowValidationModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Valider
              </Button>
            )}
            
            {expenseRequest.canModify && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Supprimer
              </Button>
            )}
          </div>
        </div>

        {/* Status et montant */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            {getStatusBadge(expenseRequest.status)}
            {getUrgencyBadge(expenseRequest.urgencyLevel)}
            {expenseRequest.isLoan && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                Prêt remboursable
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {parseFloat(expenseRequest.amountRequested).toFixed(2)} {expenseRequest.currency}
            </p>
            {expenseRequest.amountApproved && (
              <p className="text-sm text-green-600">
                Approuvé: {parseFloat(expenseRequest.amountApproved).toFixed(2)} {expenseRequest.currency}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Détails de la demande */}
            <Card>
              <CardHeader>
                <CardTitle>Détails de la demande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{expenseRequest.description}</p>
                </div>

                {expenseRequest.expenseSubtype && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Sous-catégorie</h3>
                    <p className="text-gray-700">{expenseRequest.expenseSubtype}</p>
                  </div>
                )}

                {expenseRequest.expectedImpact && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Impact attendu</h3>
                    <p className="text-gray-700">{expenseRequest.expectedImpact}</p>
                  </div>
                )}

                {expenseRequest.actualImpact && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Impact réalisé</h3>
                    <p className="text-gray-700">{expenseRequest.actualImpact}</p>
                  </div>
                )}

                {/* Bénéficiaire externe */}
                {expenseRequest.beneficiaryExternal && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Bénéficiaire externe</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">{expenseRequest.beneficiaryExternal.name}</p>
                      <p className="text-sm text-gray-600">Type: {expenseRequest.beneficiaryExternal.type}</p>
                      <p className="text-sm text-gray-600">Contact: {expenseRequest.beneficiaryExternal.contact}</p>
                      {expenseRequest.beneficiaryExternal.iban && (
                        <p className="text-sm text-gray-600">IBAN: {expenseRequest.beneficiaryExternal.iban}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Conditions de prêt */}
                {expenseRequest.isLoan && expenseRequest.loanTerms && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Conditions du prêt</h3>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-purple-800">Durée</p>
                          <p className="text-purple-700">{expenseRequest.loanTerms.durationMonths} mois</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-800">Taux d'intérêt</p>
                          <p className="text-purple-700">{expenseRequest.loanTerms.interestRate}%</p>
                        </div>
                        {expenseRequest.loanTerms.monthlyPayment && (
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-purple-800">Remboursement mensuel</p>
                            <p className="text-purple-700">{expenseRequest.loanTerms.monthlyPayment} {expenseRequest.currency}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Motif de rejet */}
                {expenseRequest.rejectionReason && (
                  <div>
                    <h3 className="font-medium text-red-900 mb-2">Motif de rejet</h3>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <p className="text-red-800">{expenseRequest.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progression de validation */}
            {expenseRequest.validationProgress.total > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Progression de validation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {expenseRequest.validationProgress.completed} / {expenseRequest.validationProgress.total} validations
                      </span>
                      <span className="text-sm text-gray-500">
                        {expenseRequest.validationProgress.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${expenseRequest.validationProgress.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {expenseRequest.requiredValidators.map((validator, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="capitalize"
                        >
                          {validator.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historique des remboursements (si prêt) */}
            {expenseRequest.isLoan && expenseRequest.repayments && expenseRequest.repayments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Historique des remboursements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expenseRequest.repayments.map((repayment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Remboursement #{repayment.installmentNumber}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(repayment.paymentDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{repayment.amount} {expenseRequest.currency}</p>
                          <Badge className={repayment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {repayment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-600">Demandeur:</span>
                  <span className="ml-2 font-medium">
                    {expenseRequest.requester.firstName} {expenseRequest.requester.lastName}
                  </span>
                </div>

                {expenseRequest.beneficiary && (
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">Bénéficiaire:</span>
                    <span className="ml-2 font-medium">
                      {expenseRequest.beneficiary.firstName} {expenseRequest.beneficiary.lastName}
                    </span>
                  </div>
                )}

                {expenseRequest.section && (
                  <div className="flex items-center text-sm">
                    <Building className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">Section:</span>
                    <span className="ml-2 font-medium">{expenseRequest.section.name}</span>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-600">Créée le:</span>
                  <span className="ml-2 font-medium">
                    {new Date(expenseRequest.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {expenseRequest.paidAt && (
                  <div className="flex items-center text-sm">
                    <CreditCard className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">Payée le:</span>
                    <span className="ml-2 font-medium">
                      {new Date(expenseRequest.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {expenseRequest.paymentValidator && (
                  <div className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">Validé par:</span>
                    <span className="ml-2 font-medium">
                      {expenseRequest.paymentValidator.firstName} {expenseRequest.paymentValidator.lastName}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction liée */}
            {expenseRequest.transaction && (
              <Card>
                <CardHeader>
                  <CardTitle>Transaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">ID Transaction:</span>
                      <span className="font-mono">{expenseRequest.transaction.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Montant:</span>
                      <span className="font-semibold">{expenseRequest.transaction.amount} {expenseRequest.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Statut:</span>
                      <Badge className={expenseRequest.transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {expenseRequest.transaction.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions rapides */}
            {(expenseRequest.status === 'approved' || expenseRequest.status === 'paid') && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger reçu
                  </Button>
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Générer attestation
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modal de validation */}
        {showValidationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Valider la demande</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    value={validationAction}
                    onChange={(e) => setValidationAction(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="approve">Approuver</option>
                    <option value="reject">Rejeter</option>
                    <option value="request_info">Demander des informations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire
                  </label>
                  <textarea
                    value={validationComment}
                    onChange={(e) => setValidationComment(e.target.value)}
                    placeholder="Ajoutez un commentaire..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowValidationModal(false);
                    setValidationComment('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={submitValidation}
                  disabled={isSubmitting || !validationComment.trim()}
                  className={validationAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : validationAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                    {isSubmitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    validationAction === 'approve' ? 'Approuver' :
                    validationAction === 'reject' ? 'Rejeter' : 'Demander infos'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
                 