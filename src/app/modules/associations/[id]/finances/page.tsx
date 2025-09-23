// src/app/modules/associations/[id]/finances/page.tsx
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
  Plus,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Euro,
  FileText,
  Users,
  Building,
  Handshake,
  Star,
  Zap
} from "lucide-react";

// Import des types
import type { 
  Association, 
  ExpenseRequest, 
  FinancialSummary, 
  ApiResponse,
  ExpenseRequestsResponse
} from "@/types/modules/association/finances";

export default function FinancesPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const associationId = params.id as string;

  // États avec types stricts
  const [association, setAssociation] = useState<Association | null>(null);
  const [expenseRequests, setExpenseRequests] = useState<ExpenseRequest[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'pending'>('dashboard');

  useEffect(() => {
    if (associationId && token) {
      fetchData();
    }
  }, [associationId, token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAssociation(),
        fetchExpenseRequests(),
        fetchFinancialSummary()
      ]);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      setError("Erreur de chargement des données");
      toast.error("Erreur de chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssociation = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result: ApiResponse<{ association: Association }> = await response.json();
        setAssociation(result.data.association);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur chargement association:", error);
      throw error;
    }
  };

  const fetchExpenseRequests = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests?limit=10&sortBy=createdAt&sortOrder=DESC`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result: ExpenseRequestsResponse = await response.json();
        setExpenseRequests(result.expenseRequests || []);
      } else {
        console.warn("Aucune demande trouvée");
        setExpenseRequests([]);
      }
    } catch (error) {
      console.error("Erreur chargement demandes:", error);
      setExpenseRequests([]);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/financial-summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result: { success: boolean; data: FinancialSummary } = await response.json();
        setFinancialSummary(result.data);
        
        // Afficher les alertes s'il y en a
        if (result.data.alerts && result.data.alerts.length > 0) {
          result.data.alerts.forEach(alert => {
            if (alert.severity === 'warning') {
              toast.warning(alert.message);
            } else if (alert.severity === 'danger') {
              toast.error(alert.message);
            } else {
              toast.info(alert.message);
            }
          });
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur chargement résumé financier:", error);
      toast.error("Impossible de charger le résumé financier");
      // En cas d'erreur API, utiliser des données par défaut
      setFinancialSummary(null);
    }
  };

  // Fonctions utilitaires avec gestion des rôles
  const canCreateExpense = (expenseType: string): boolean => {
    if (!user?.roles) return false;
    
    // Les membres peuvent uniquement créer des aides aux membres
    if (expenseType === 'aide_membre') {
      return true; // Tous les membres peuvent demander une aide
    }
    
    // Les autres types nécessitent des rôles spéciaux
    const bureauRoles = ['president', 'tresorier', 'secretaire'];
    return user.roles.some(role => bureauRoles.includes(role));
  };

  const canValidateExpenses = (): boolean => {
    if (!user?.roles) return false;
    const validatorRoles = ['president', 'tresorier', 'secretaire', 'admin_association'];
    return user.roles.some(role => validatorRoles.includes(role));
  };

  const canProcessPayments = (): boolean => {
    if (!user?.roles) return false;
    return user.roles.includes('tresorier') || user.roles.includes('admin_association');
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
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En attente</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En cours</Badge>;
      case 'additional_info_needed':
        return <Badge variant="warning" className="bg-orange-50 text-orange-700 border-orange-200">Info requise</Badge>;
      case 'approved':
        return <Badge variant="success" className="bg-green-50 text-green-700 border-green-200">Approuvée</Badge>;
      case 'paid':
        return <Badge variant="success" className="bg-green-100 text-green-800 border-green-300">Payée</Badge>;
      case 'rejected':
        return <Badge variant="danger" className="bg-red-50 text-red-700 border-red-200">Refusée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (level: ExpenseRequest['urgencyLevel']) => {
    switch (level) {
      case 'critical':
        return <Badge variant="danger" className="ml-2">Critique</Badge>;
      case 'high':
        return <Badge variant="warning" className="ml-2">Urgent</Badge>;
      case 'normal':
        return null;
      case 'low':
        return <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-600">Faible</Badge>;
      default:
        return null;
    }
  };

  // Filtrer les demandes en attente de validation pour l'utilisateur actuel
  const getPendingValidations = (): ExpenseRequest[] => {
    if (!canValidateExpenses()) return [];
    
    return expenseRequests.filter(request => {
      // Seules les demandes en attente ou en cours de review
      if (!['pending', 'under_review'].includes(request.status)) return false;
      
      // Vérifier si l'utilisateur peut valider ce type de demande
      const workflowRules = association?.workflowRules;
      if (!workflowRules || !workflowRules[request.expenseType]) return true;
      
      const requiredValidators = workflowRules[request.expenseType].validators || [];
      return user?.roles?.some(role => requiredValidators.includes(role));
    });
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

  const pendingValidations = getPendingValidations();

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/modules/associations/${associationId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion Financière</h1>
              <p className="text-gray-600">{financialSummary?.association.name || association?.name}</p>
            </div>
          </div>
          
          {/* Bouton conditionnel selon les droits */}
          {canCreateExpense('aide_membre') && (
            <Button
              onClick={() => router.push(`/modules/associations/${associationId}/finances/create`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande
            </Button>
          )}
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Wallet className="h-4 w-4 inline mr-2" />
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Toutes les demandes
            </button>
            
            {/* Tab validation seulement pour les validateurs */}
            {canValidateExpenses() && (
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                En attente de validation
                {pendingValidations.length > 0 && (
                  <Badge variant="danger" className="ml-2 text-xs">
                    {pendingValidations.length}
                  </Badge>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && financialSummary && (
          <div className="space-y-6">
            {/* Financial overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Solde disponible</p>
                      <p className="text-2xl font-bold text-green-600">
                        {financialSummary.balance.current.availableBalance.toFixed(2)} {financialSummary.association.currency}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Euro className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total revenus</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {financialSummary.balance.current.totalIncome.toFixed(2)} {financialSummary.association.currency}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Dépenses payées</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {financialSummary.balance.current.totalExpenses.toFixed(2)} {financialSummary.association.currency}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Prêts en cours</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {financialSummary.balance.current.outstandingLoans.toFixed(2)} {financialSummary.association.currency}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Handshake className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts - Seulement si disponible dans les données */}
            {financialSummary.alerts && financialSummary.alerts.some(alert => alert.severity === 'warning') && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Alertes financières</p>
                      <div className="text-sm text-yellow-700 mt-1">
                        {financialSummary.alerts
                          .filter(alert => alert.severity === 'warning')
                          .map((alert, index) => (
                            <div key={index}>{alert.message}</div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Membership Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques membres</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total membres actifs</span>
                      <span className="font-semibold">{financialSummary.membership.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Sections</span>
                      <span className="font-semibold">{financialSummary.association.sectionsCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cotisations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Nombre de paiements</span>
                      <span className="font-semibold">{financialSummary.cotisations.count}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total net</span>
                      <span className="font-semibold">{financialSummary.cotisations.totalNet.toFixed(2)} {financialSummary.association.currency}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Commissions</span>
                      <span className="font-semibold">{financialSummary.cotisations.totalCommissions.toFixed(2)} {financialSummary.association.currency}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expenses by type - Seulement s'il y a des données */}
            {financialSummary.expenses.byType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des dépenses par type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialSummary.expenses.byType.map((item) => {
                      const Icon = getExpenseTypeIcon(item.type);
                      return (
                        <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Icon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{getExpenseTypeLabel(item.type)}</p>
                              <p className="text-sm text-gray-600">{item.count} demande(s)</p>
                            </div>
                          </div>
                          <p className="font-semibold text-gray-900">{item.total.toFixed(2)} {financialSummary.association.currency}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
        )}
          </div>
        )}

        {/* Recent requests tab */}
        {activeTab === 'requests' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Demandes récentes</CardTitle>
              <Button
                variant="outline"
                onClick={() => router.push(`/modules/associations/${associationId}/finances/history`)}
              >
                Voir tout l'historique
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune demande financière pour le moment</p>
                    {canCreateExpense('aide_membre') && (
                      <Button
                        className="mt-4"
                        onClick={() => router.push(`/modules/associations/${associationId}/finances/create`)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer la première demande
                      </Button>
                    )}
                  </div>
                ) : (
                  expenseRequests.map((request) => {
                    const Icon = getExpenseTypeIcon(request.expenseType);
                    return (
                      <div
                        key={request.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/modules/associations/${associationId}/finances/${request.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Icon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{request.title}</h3>
                                <p className="text-sm text-gray-600">{getExpenseTypeLabel(request.expenseType)}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{request.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Par {request.requester.firstName} {request.requester.lastName}</span>
                              <span>•</span>
                              <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                              {request.isLoan && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700">Prêt</Badge>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-lg text-gray-900">
                              {request.amountRequested.toFixed(2)} {request.currency}
                            </p>
                            <div className="flex items-center mt-1">
                              {getStatusBadge(request.status)}
                              {getUrgencyBadge(request.urgencyLevel)}
                            </div>
                            {request.validationProgress && request.validationProgress.total > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center text-xs text-gray-500">
                                  <span>Validation: {request.validationProgress.completed}/{request.validationProgress.total}</span>
                                </div>
                                <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                                    style={{ width: `${request.validationProgress.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending validations tab */}
        {activeTab === 'pending' && canValidateExpenses() && (
          <Card>
            <CardHeader>
              <CardTitle>
                Demandes en attente de validation
                {pendingValidations.length > 0 && (
                  <Badge variant="danger" className="ml-2">
                    {pendingValidations.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingValidations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune demande en attente de validation</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Toutes les demandes ont été traitées
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingValidations.map((request) => {
                    const Icon = getExpenseTypeIcon(request.expenseType);
                    return (
                      <div
                        key={request.id}
                        className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/modules/associations/${associationId}/finances/${request.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Icon className="h-4 w-4 text-yellow-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{request.title}</h3>
                                <p className="text-sm text-gray-600">{getExpenseTypeLabel(request.expenseType)}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Par {request.requester.firstName} {request.requester.lastName}</span>
                              <span>•</span>
                              <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                              {request.urgencyLevel === 'critical' && (
                                <>
                                  <span>•</span>
                                  <Badge variant="danger" className="text-xs">URGENT</Badge>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold text-lg text-gray-900">
                              {request.amountRequested.toFixed(2)} {request.currency}
                            </p>
                            <div className="flex items-center mt-1">
                              {getStatusBadge(request.status)}
                              {getUrgencyBadge(request.urgencyLevel)}
                            </div>
                            <Button
                              size="sm"
                              className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/modules/associations/${associationId}/finances/${request.id}/validate`);
                              }}
                            >
                              Valider
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}