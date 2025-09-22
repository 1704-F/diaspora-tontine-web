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

interface ExpenseRequest {
  id: number;
  title: string;
  description: string;
  expenseType: string;
  expenseSubtype?: string;
  amountRequested: number;
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
  validationProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  outstandingLoans: number;
  availableBalance: number;
  pendingExpenses: number;
  upcomingRepayments: number;
  expensesByType: Array<{
    type: string;
    count: number;
    total: number;
  }>;
}

export default function FinancesPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const associationId = params.id as string;

  const [association, setAssociation] = useState<any>(null);
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

  const fetchExpenseRequests = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests?limit=10&sortBy=createdAt&sortOrder=DESC`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      const result = await response.json();
      setExpenseRequests(result.expenseRequests || []);
    }
  };

  const fetchFinancialSummary = async () => {
    // TODO: Implémenter l'endpoint financial-summary quand disponible
    // Pour l'instant, données mockées
    setFinancialSummary({
      totalIncome: 15420.50,
      totalExpenses: 8650.25,
      outstandingLoans: 2500.00,
      availableBalance: 4270.25,
      pendingExpenses: 1200.00,
      upcomingRepayments: 500.00,
      expensesByType: [
        { type: 'aide_membre', count: 15, total: 3200.00 },
        { type: 'depense_operationnelle', count: 8, total: 2100.50 },
        { type: 'projet_special', count: 3, total: 2800.00 },
        { type: 'pret_partenariat', count: 2, total: 2500.00 }
      ]
    });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">En attente</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">En cours</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approuvée</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Payée</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Refusée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive" className="ml-2">Critique</Badge>;
      case 'high':
        return <Badge variant="outline" className="ml-2 bg-orange-50 text-orange-700 border-orange-200">Urgent</Badge>;
      case 'normal':
        return null;
      case 'low':
        return <Badge variant="outline" className="ml-2 bg-gray-50 text-gray-600">Faible</Badge>;
      default:
        return null;
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
              onClick={() => router.push(`/modules/associations/${associationId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion Financière</h1>
              <p className="text-gray-600">{association?.name}</p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/modules/associations/${associationId}/finances/create`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande
          </Button>
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
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              En attente de validation
            </button>
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
                        {financialSummary.availableBalance.toFixed(2)} €
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
                        {financialSummary.totalIncome.toFixed(2)} €
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
                        {financialSummary.totalExpenses.toFixed(2)} €
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
                        {financialSummary.outstandingLoans.toFixed(2)} €
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Handshake className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {financialSummary.availableBalance < 1000 && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Solde faible</p>
                      <p className="text-sm text-yellow-700">
                        Le solde de l'association est en dessous de 1000€. Considérez l'organisation de collectes de cotisations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expenses by type */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des dépenses par type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialSummary.expensesByType.map((item) => {
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
                        <p className="font-semibold text-gray-900">{item.total.toFixed(2)} €</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
                    <Button
                      className="mt-4"
                      onClick={() => router.push(`/modules/associations/${associationId}/finances/create`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer la première demande
                    </Button>
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
                            {request.validationProgress.total > 0 && (
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
        {activeTab === 'pending' && (
          <Card>
            <CardHeader>
              <CardTitle>Demandes en attente de validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Fonctionnalité en cours de développement</p>
                <p className="text-sm text-gray-400 mt-2">
                  Les demandes nécessitant votre validation apparaîtront ici
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}