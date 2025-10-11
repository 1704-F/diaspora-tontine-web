// src/app/modules/associations/[id]/finances/validations/page.tsx
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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Building,
  Handshake,
  Star,
  Zap,
  FileText,
  Download,
  Eye,
  MessageSquare,
  Euro,
  Calendar,
  Filter,
  Search
} from "lucide-react";

interface ExpenseRequest {
  id: number;
  title: string;
  description: string;
  expenseType: string;
  expenseSubtype?: string;
  amountRequested: string | number;
  amountApproved?: number;
  currency: string;
  status: string;
  urgencyLevel: string;
  isLoan: boolean;
  createdAt: string;
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
  validationHistory: Array<{
    userId: number;
    role: string;
    decision: string;
    comment?: string;
    timestamp: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
  requiredValidators: string[];
  documents?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  expectedImpact?: string;
}

interface ValidationAction {
  requestId: number;
  decision: 'approved' | 'rejected' | 'info_needed';
  comment: string;
  amountApproved?: number;
  conditions?: string;
}

export default function ValidationsPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const associationId = params.id as string;

  const [association, setAssociation] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<ExpenseRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  
  // Filtres
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [membership, setMembership] = useState<any>(null);

  // Modal validation
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAction, setValidationAction] = useState<ValidationAction>({
    requestId: 0,
    decision: 'approved',
    comment: '',
    amountApproved: undefined,
    conditions: ''
  });

  useEffect(() => {
  if (associationId && token && user) {
    fetchData();
  }
}, [associationId, token, user]);

  const canUserValidate = () => {
  const userRoles = membership?.roles || [];
  
  // Vérifier d'abord les rôles dans l'association
  const hasAssociationRole = userRoles.some((role: string) => 
    ['admin_association', 'president', 'tresorier', 'secretaire'].includes(role)
  );
  
  // Vérifier si super_admin au niveau plateforme (si ce champ existe)
  // ✅ Supprimer cette vérification si user.role n'a pas 'super_admin'
  // const isPlatformAdmin = user?.role === 'super_admin';
  
  return hasAssociationRole;
};

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAssociation(),
        fetchPendingRequests(),
        fetchAvailableBalance()
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
    setMembership(result.data.membership || null);
  }
};

  const fetchPendingRequests = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests-pending`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      const result = await response.json();
      setPendingRequests(result.data?.pendingRequests || []);
    } else {
      setPendingRequests([]);
    }
  } catch (error) {
    console.error("Erreur chargement demandes:", error);
    setPendingRequests([]);
  }
};

  const fetchAvailableBalance = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/finances/balance`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      const result = await response.json();
      setAvailableBalance(result.availableBalance || 0);
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
      case 'low':
        return <Badge variant="outline" className="bg-gray-50">🔽 Faible</Badge>;
      default:
        return null;
    }
  };

  const getValidationProgress = (request: ExpenseRequest) => {
    const completed = request.validationHistory?.filter(v => v.decision === 'approved').length || 0;
    const total = request.requiredValidators?.length || 3;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  const getCurrentUserValidation = (request: ExpenseRequest) => {
    return request.validationHistory?.find(v => v.userId === user?.id);
  };

  const canCurrentUserValidate = (request: ExpenseRequest) => {
    const userValidation = getCurrentUserValidation(request);
    return !userValidation; // Peut valider si pas encore validé
  };

  const hasSufficientFunds = (amount: number | string) => {
  const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return availableBalance >= parsedAmount;
};

 const openValidationModal = (request: ExpenseRequest, decision: 'approved' | 'rejected' | 'info_needed') => {
  const requestedAmount = typeof request.amountRequested === 'string' 
    ? parseFloat(request.amountRequested) 
    : request.amountRequested;
    
  setValidationAction({
    requestId: request.id,
    decision,
    comment: '',
    amountApproved: decision === 'approved' ? requestedAmount : undefined,
    conditions: ''
  });
  setSelectedRequest(request);
  setShowValidationModal(true);
};

  const submitValidation = async () => {
  if (!validationAction.comment.trim()) {
    setError("Un commentaire est requis");
    return;
  }

  setIsSubmitting(true);
  try {
    const endpoint = validationAction.decision === 'approved' ? 'approve' : 
                     validationAction.decision === 'rejected' ? 'reject' : 'request-info';
    
    // ✅ Construire directement le bon objet selon l'action
    const requestBody = validationAction.decision === 'approved' 
      ? {
          comment: validationAction.comment,
          amountApproved: validationAction.amountApproved,
          ...(validationAction.conditions && { conditions: validationAction.conditions })
        }
      : validationAction.decision === 'rejected'
      ? {
          rejectionReason: validationAction.comment
        }
      : {
          requestedInfo: validationAction.comment
        };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests/${validationAction.requestId}/${endpoint}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (response.ok) {
      setShowValidationModal(false);
      setValidationAction({ 
        requestId: 0, 
        decision: 'approved', 
        comment: '', 
        amountApproved: undefined, 
        conditions: '' 
      });
      setSelectedRequest(null);
      await fetchPendingRequests();
      setError("");
    } else {
      const error = await response.json();
      setError(error.error || error.message || "Erreur lors de la validation");
    }
  } catch (error) {
    console.error("Erreur validation:", error);
    setError("Erreur lors de la validation");
  } finally {
    setIsSubmitting(false);
  }
};

  // Filtrer les demandes
  const filteredRequests = pendingRequests.filter(request => {
    if (filterStatus !== 'all' && request.status !== filterStatus) return false;
    if (filterType !== 'all' && request.expenseType !== filterType) return false;
    if (filterUrgency !== 'all' && request.urgencyLevel !== filterUrgency) return false;
    if (searchTerm && !request.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.requester.firstName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.requester.lastName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  if (isLoading) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

 if (error) {
  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
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
              <h1 className="text-2xl font-bold text-gray-900">Validation des Demandes</h1>
              <p className="text-gray-600">{association?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Solde disponible</p>
              <p className="text-lg font-bold text-green-600">{availableBalance.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="under_review">En cours</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="aide_membre">Aide membre</SelectItem>
                  <SelectItem value="depense_operationnelle">Dépense opérationnelle</SelectItem>
                  <SelectItem value="pret_partenariat">Prêt & partenariat</SelectItem>
                  <SelectItem value="projet_special">Projet spécial</SelectItem>
                  <SelectItem value="urgence_communautaire">Urgence</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes urgences</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="high">Urgent</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setFilterStatus('all');
                setFilterType('all');
                setFilterUrgency('all');
                setSearchTerm('');
              }}>
                <Filter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des demandes */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande en attente</h3>
                <p className="text-gray-600">Toutes les demandes ont été traitées ou aucune demande ne correspond aux critères de filtrage.</p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => {
              const Icon = getExpenseTypeIcon(request.expenseType);
              const progress = getValidationProgress(request);
              const userValidation = getCurrentUserValidation(request);
              const canValidate = canCurrentUserValidate(request);
              const sufficientFunds = hasSufficientFunds(request.amountRequested);

              return (
                <Card key={request.id} className={`${!sufficientFunds ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                            <p className="text-sm text-gray-600">{getExpenseTypeLabel(request.expenseType)}</p>
                          </div>
                          {getUrgencyBadge(request.urgencyLevel)}
                          {request.isLoan && (
                            <Badge className="bg-purple-100 text-purple-700">💰 Prêt</Badge>
                          )}
                        </div>

                        <p className="text-gray-700 mb-4 line-clamp-3">{request.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Demandeur</p>
                            <p className="font-medium">{request.requester.firstName} {request.requester.lastName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Date de demande</p>
                            <p className="font-medium">{new Date(request.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                          {request.beneficiary && (
                            <div>
                              <p className="text-gray-500">Bénéficiaire</p>
                              <p className="font-medium">{request.beneficiary.firstName} {request.beneficiary.lastName}</p>
                            </div>
                          )}
                        </div>

                        {request.expectedImpact && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600 font-medium">Impact attendu:</p>
                            <p className="text-sm text-gray-700">{request.expectedImpact}</p>
                          </div>
                        )}

                        {!sufficientFunds && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                              <p className="text-sm text-red-700 font-medium">Fonds insuffisants</p>
                            </div>

                            <p className="text-sm text-red-600 mt-1">
  Solde disponible: {availableBalance.toFixed(2)} € | Demandé: {parseFloat(request.amountRequested.toString()).toFixed(2)} €
</p>

                          </div>
                        )}

                        {/* Documents */}
                        {request.documents && request.documents.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Documents joints:</p>
                            <div className="flex flex-wrap gap-2">
                              {request.documents.map((doc, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(doc.url, '_blank')}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  {doc.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Historique des validations */}
                        {request.validationHistory && request.validationHistory.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Validations:</p>
                            <div className="space-y-2">
                              {request.validationHistory.map((validation, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm">
                                  {validation.decision === 'approved' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <span className="font-medium">{validation.user.firstName} {validation.user.lastName}</span>
                                  <span className="text-gray-500">({validation.role})</span>
                                  <span className={validation.decision === 'approved' ? 'text-green-600' : 'text-red-600'}>
                                    {validation.decision === 'approved' ? 'Approuvé' : 'Refusé'}
                                  </span>
                                  {validation.comment && (
                                    <span className="text-gray-600">-&ldquo;{validation.comment}&rdquo;</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-right ml-6">

                        <p className="text-2xl font-bold text-gray-900 mb-2">
  {parseFloat(request.amountRequested.toString()).toFixed(2)} {request.currency}
</p>

                        {/* Progression validation */}
                        <div className="mb-4">
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <span>Validation: {progress.completed}/{progress.total}</span>
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress.percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Actions */}
                        {userValidation ? (
                          <div className="space-y-2">
                            <div className="flex items-center text-sm">
                              {userValidation.decision === 'approved' ? (
                                <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 mr-1" />
                              )}
                              <span className="font-medium">Votre décision: {userValidation.decision === 'approved' ? 'Approuvé' : 'Refusé'}</span>
                            </div>
                            {userValidation.comment && (
                              <p className="text-xs text-gray-600 italic">&ldquo;{userValidation.comment}&rdquo;</p>
                            )}
                          </div>
                        ) : canValidate ? (
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              onClick={() => openValidationModal(request, 'approved')}
                              disabled={!sufficientFunds}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openValidationModal(request, 'rejected')}
                              className="w-full border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Refuser
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openValidationModal(request, 'info_needed')}
                              className="w-full"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Demander infos
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">En attente d'autres validateurs</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal de validation */}
        {showValidationModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
              <h2 className="text-xl font-bold mb-4">
                {validationAction.decision === 'approved' ? '✅ Approuver la demande' :
                 validationAction.decision === 'rejected' ? '❌ Refuser la demande' :
                 '💬 Demander des informations complémentaires'}
              </h2>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium">{selectedRequest.title}</h3>

               <p className="text-sm text-gray-600">
  {selectedRequest.requester.firstName} {selectedRequest.requester.lastName} - {parseFloat(selectedRequest.amountRequested.toString()).toFixed(2)} €
</p>

              </div>

              {validationAction.decision === 'approved' && (
                <div className="space-y-4 mb-4">
                  <div>
                    <Label htmlFor="amountApproved">Montant approuvé (€)</Label>

                    <input
  id="amountApproved"
  type="number"
  step="0.01"
  min="0"
  max={parseFloat(selectedRequest.amountRequested.toString())}
  value={validationAction.amountApproved || ''}
  onChange={(e) => setValidationAction({
    ...validationAction,
    amountApproved: parseFloat(e.target.value) || undefined
  })}
  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
  placeholder={selectedRequest.amountRequested.toString()}
/>


                  </div>

                  <div>
                    <Label htmlFor="conditions">Conditions particulières (optionnel)</Label>
                    <Textarea
                      id="conditions"
                      value={validationAction.conditions}
                      onChange={(e) => setValidationAction({
                        ...validationAction,
                        conditions: e.target.value
                      })}
                      placeholder="Ex: Remboursement échelonné sur 12 mois..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              <div className="mb-6">
                <Label htmlFor="comment" required>
                  {validationAction.decision === 'approved' ? 'Commentaire de validation' :
                   validationAction.decision === 'rejected' ? 'Motif de refus' :
                   'Informations demandées'} *
                </Label>
                <Textarea
                  id="comment"
                  value={validationAction.comment}
                  onChange={(e) => setValidationAction({
                    ...validationAction,
                    comment: e.target.value
                  })}
                  placeholder={
                    validationAction.decision === 'approved' ? 'Demande justifiée et conforme...' :
                    validationAction.decision === 'rejected' ? 'Motif du refus...' :
                    'Précisez les informations manquantes...'
                  }
                  className="mt-1"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowValidationModal(false);
                    setValidationAction({ requestId: 0, decision: 'approved', comment: '', amountApproved: undefined, conditions: '' });
                    setSelectedRequest(null);
                  }}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={submitValidation}
                  disabled={isSubmitting || !validationAction.comment.trim()}
                  className={
                    validationAction.decision === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                    validationAction.decision === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    validationAction.decision === 'approved' ? <CheckCircle className="h-4 w-4 mr-2" /> :
                    validationAction.decision === 'rejected' ? <XCircle className="h-4 w-4 mr-2" /> :
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  {validationAction.decision === 'approved' ? 'Approuver' :
                   validationAction.decision === 'rejected' ? 'Refuser' :
                   'Demander infos'}
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
                    