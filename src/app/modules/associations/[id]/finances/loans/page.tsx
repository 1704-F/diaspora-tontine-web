// src/app/modules/associations/[id]/finances/loans/page.tsx
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
  Clock,
  CheckCircle,
  AlertTriangle,
  Euro,
  Calendar,
  Plus,
  Handshake,
  TrendingDown,
  TrendingUp,
  FileText,
  Calculator,
  Send,
  History,
  Filter,
  Search,
  Eye,
  Download,
  Phone,
  Mail
} from "lucide-react";

interface Loan {
  id: number;
  title: string;
  description: string;
  borrowerType: 'internal' | 'external';
  borrower: {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
  };
  amountGranted: number;
  amountRepaid: number;
  amountOutstanding: number;
  currency: string;
  interestRate: number;
  durationMonths: number;
  monthlyPayment: number;
  startDate: string;
  endDate: string;
  nextDueDate: string;
  status: 'active' | 'completed' | 'defaulted' | 'suspended';
  repaymentStatus: 'not_started' | 'in_progress' | 'completed' | 'defaulted';
  daysLate: number;
  repayments: LoanRepayment[];
  createdAt: string;
  loanTerms: {
    gracePeriodDays: number;
    penaltyRate: number;
    allowEarlyRepayment: boolean;
  };
}

interface LoanRepayment {
  id: number;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  paymentDate: string;
  dueDate: string;
  paymentMethod: string;
  reference?: string;
  status: 'pending' | 'validated' | 'rejected';
  daysLate: number;
  notes?: string;
  validatedBy?: {
    firstName: string;
    lastName: string;
  };
}

interface NewRepaymentData {
  loanId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  notes: string;
}

export default function LoansPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const associationId = params.id as string;

  const [association, setAssociation] = useState<any>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'completed'>('overview');

  // Filtres
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal nouveau remboursement
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [newRepaymentData, setNewRepaymentData] = useState<NewRepaymentData>({
    loanId: 0,
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    if (associationId && token && user) {
      if (!canUserManageLoans()) {
        setError("Vous n'avez pas les droits pour gérer les prêts");
        return;
      }
      fetchData();
    }
  }, [associationId, token, user]);

  const canUserManageLoans = () => {
    return user?.roles?.some((role: string) => 
      ['president', 'tresorier', 'secretaire'].includes(role)
    );
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAssociation(),
        fetchLoans()
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

  const fetchLoans = async () => {
    // TODO: Remplacer par le vrai endpoint
    // const response = await fetch(
    //   `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests?isLoan=true`,
    //   {
    //     headers: { Authorization: `Bearer ${token}` },
    //   }
    // );

    // Pour l'instant, données mockées
    setLoans([
      {
        id: 1,
        title: "Prêt Association Sœur Italie",
        description: "Prêt pour financer leur projet de construction d'une école au Sénégal",
        borrowerType: 'external',
        borrower: {
          name: "Association Sénégalaise Italie",
          contact: "Marco Rossi",
          email: "marco@assoc-senegal-italie.org",
          phone: "+39 06 1234 5678"
        },
        amountGranted: 5000,
        amountRepaid: 2000,
        amountOutstanding: 3000,
        currency: 'EUR',
        interestRate: 0,
        durationMonths: 12,
        monthlyPayment: 416.67,
        startDate: '2024-01-15',
        endDate: '2025-01-15',
        nextDueDate: '2024-11-15',
        status: 'active',
        repaymentStatus: 'in_progress',
        daysLate: 0,
        repayments: [
          {
            id: 1,
            amount: 416.67,
            principalAmount: 416.67,
            interestAmount: 0,
            penaltyAmount: 0,
            paymentDate: '2024-02-15',
            dueDate: '2024-02-15',
            paymentMethod: 'bank_transfer',
            reference: 'VIR-ITALIE-FEB-2024',
            status: 'validated',
            daysLate: 0,
            validatedBy: { firstName: 'Amadou', lastName: 'Diop' }
          },
          {
            id: 2,
            amount: 416.67,
            principalAmount: 416.67,
            interestAmount: 0,
            penaltyAmount: 0,
            paymentDate: '2024-03-15',
            dueDate: '2024-03-15',
            paymentMethod: 'bank_transfer',
            reference: 'VIR-ITALIE-MAR-2024',
            status: 'validated',
            daysLate: 0,
            validatedBy: { firstName: 'Fatou', lastName: 'Sall' }
          }
        ],
        createdAt: '2024-01-10',
        loanTerms: {
          gracePeriodDays: 7,
          penaltyRate: 0.05,
          allowEarlyRepayment: true
        }
      },
      {
        id: 2,
        title: "Avance Ahmed Projet Commerce",
        description: "Avance remboursable pour lancement boutique produits diaspora",
        borrowerType: 'internal',
        borrower: {
          name: "Ahmed Ba",
          email: "ahmed.ba@email.com",
          phone: "+33 6 12 34 56 78"
        },
        amountGranted: 2000,
        amountRepaid: 500,
        amountOutstanding: 1500,
        currency: 'EUR',
        interestRate: 2,
        durationMonths: 10,
        monthlyPayment: 220,
        startDate: '2024-05-01',
        endDate: '2025-03-01',
        nextDueDate: '2024-11-01',
        status: 'active',
        repaymentStatus: 'in_progress',
        daysLate: 15,
        repayments: [
          {
            id: 3,
            amount: 220,
            principalAmount: 200,
            interestAmount: 20,
            penaltyAmount: 0,
            paymentDate: '2024-06-01',
            dueDate: '2024-06-01',
            paymentMethod: 'cash',
            status: 'validated',
            daysLate: 0,
            validatedBy: { firstName: 'Ibrahim', lastName: 'Kane' }
          }
        ],
        createdAt: '2024-04-25',
        loanTerms: {
          gracePeriodDays: 5,
          penaltyRate: 0.1,
          allowEarlyRepayment: true
        }
      },
      {
        id: 3,
        title: "Prêt Formation Professionnelle",
        description: "Prêt remboursé pour formation certifiante Moussa",
        borrowerType: 'internal',
        borrower: {
          name: "Moussa Traoré",
          email: "moussa@email.com"
        },
        amountGranted: 1200,
        amountRepaid: 1200,
        amountOutstanding: 0,
        currency: 'EUR',
        interestRate: 0,
        durationMonths: 8,
        monthlyPayment: 150,
        startDate: '2023-10-01',
        endDate: '2024-06-01',
        nextDueDate: '',
        status: 'completed',
        repaymentStatus: 'completed',
        daysLate: 0,
        repayments: [],
        createdAt: '2023-09-25',
        loanTerms: {
          gracePeriodDays: 7,
          penaltyRate: 0,
          allowEarlyRepayment: true
        }
      }
    ]);
  };

  const getStatusBadge = (status: string, daysLate: number = 0) => {
    if (daysLate > 0) {
      return <Badge variant="destructive">En retard ({daysLate}j)</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Actif</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Soldé</Badge>;
      case 'defaulted':
        return <Badge variant="destructive">Défaillant</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Suspendu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRepaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Virement bancaire';
      case 'cash': return 'Espèces';
      case 'check': return 'Chèque';
      case 'card_payment': return 'Carte bancaire';
      default: return method;
    }
  };

  const calculateNextPayment = (loan: Loan) => {
    if (loan.status === 'completed') return null;
    
    const nextDue = new Date(loan.nextDueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      amount: loan.monthlyPayment,
      dueDate: loan.nextDueDate,
      daysUntilDue,
      isOverdue: daysUntilDue < 0
    };
  };

  const openRepaymentModal = (loan: Loan) => {
    const nextPayment = calculateNextPayment(loan);
    setSelectedLoan(loan);
    setNewRepaymentData({
      loanId: loan.id,
      amount: nextPayment?.amount || loan.monthlyPayment,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      reference: `REMB-${loan.id}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`,
      notes: ''
    });
    setShowRepaymentModal(true);
  };

  const recordRepayment = async () => {
    if (!newRepaymentData.amount || !newRepaymentData.reference.trim()) {
      setError("Montant et référence sont requis");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests/${newRepaymentData.loanId}/repayment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: newRepaymentData.amount,
            paymentDate: newRepaymentData.paymentDate,
            paymentMethod: newRepaymentData.paymentMethod,
            reference: newRepaymentData.reference,
            notes: newRepaymentData.notes
          }),
        }
      );

      if (response.ok) {
        setShowRepaymentModal(false);
        setSelectedLoan(null);
        setNewRepaymentData({
          loanId: 0,
          amount: 0,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'bank_transfer',
          reference: '',
          notes: ''
        });
        await fetchLoans();
      } else {
        const error = await response.json();
        setError(error.message || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur remboursement:", error);
      setError("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculs statistiques
  const calculateStats = () => {
    const activeLoans = loans.filter(loan => loan.status === 'active');
    const completedLoans = loans.filter(loan => loan.status === 'completed');
    const overdueLoans = loans.filter(loan => loan.daysLate > 0);
    
    const totalGranted = loans.reduce((sum, loan) => sum + loan.amountGranted, 0);
    const totalOutstanding = activeLoans.reduce((sum, loan) => sum + loan.amountOutstanding, 0);
    const totalRepaid = loans.reduce((sum, loan) => sum + loan.amountRepaid, 0);
    
    return {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      completedLoans: completedLoans.length,
      overdueLoans: overdueLoans.length,
      totalGranted,
      totalOutstanding,
      totalRepaid,
      repaymentRate: totalGranted > 0 ? (totalRepaid / totalGranted) * 100 : 0
    };
  };

  // Filtrer les prêts
  const filteredLoans = loans.filter(loan => {
    if (filterStatus !== 'all' && loan.status !== filterStatus) return false;
    if (filterType !== 'all' && loan.borrowerType !== filterType) return false;
    if (searchTerm && !loan.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !loan.borrower.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  const stats = calculateStats();

  if (isLoading) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error && !canUserManageLoans()) {
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
              <h1 className="text-2xl font-bold text-gray-900">Suivi des Prêts</h1>
              <p className="text-gray-600">{association?.name}</p>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total prêtés</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalGranted.toFixed(2)} €
                  </p>
                </div>
                <Handshake className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En cours</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.totalOutstanding.toFixed(2)} €
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remboursés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalRepaid.toFixed(2)} €
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En retard</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdueLoans}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Calculator className="h-4 w-4 inline mr-2" />
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Prêts actifs ({stats.activeLoans})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Soldés ({stats.completedLoans})
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="completed">Soldés</SelectItem>
                      <SelectItem value="defaulted">Défaillants</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="internal">Membres</SelectItem>
                      <SelectItem value="external">Externes</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={() => {
                    setFilterStatus('all');
                    setFilterType('all');
                    setSearchTerm('');
                  }}>
                    <Filter className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liste des prêts */}
            <div className="space-y-4">
              {filteredLoans.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Handshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun prêt trouvé</h3>
                    <p className="text-gray-600">
                      {loans.length === 0 
                        ? "Aucun prêt n'a encore été accordé"
                        : "Aucun prêt ne correspond aux critères de filtrage"
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredLoans.map((loan) => {
                  const nextPayment = calculateNextPayment(loan);
                  const progressPercentage = loan.amountGranted > 0 
                    ? ((loan.amountGranted - loan.amountOutstanding) / loan.amountGranted) * 100 
                    : 0;

                  return (
                    <Card key={loan.id} className={`${loan.daysLate > 0 ? 'border-red-200 bg-red-50' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Handshake className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{loan.title}</h3>
                                <p className="text-sm text-gray-600">{loan.borrower.name}</p>
                              </div>
                              {getStatusBadge(loan.status, loan.daysLate)}
                              {loan.borrowerType === 'external' && (
                                <Badge variant="outline" className="bg-gray-50">Externe</Badge>
                              )}
                            </div>

                            <p className="text-gray-700 mb-4">{loan.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-gray-500">Montant accordé</p>
                                <p className="font-medium">{loan.amountGranted.toFixed(2)} €</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Remboursé</p>
                                <p className="font-medium text-green-600">{loan.amountRepaid.toFixed(2)} €</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Restant dû</p>
                                <p className="font-medium text-orange-600">{loan.amountOutstanding.toFixed(2)} €</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Échéance mensuelle</p>
                                <p className="font-medium">{loan.monthlyPayment.toFixed(2)} €</p>
                              </div>
                            </div>

                            {/* Barre de progression */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progression remboursement</span>
                                <span>{progressPercentage.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full transition-all"
                                  style={{ width: `${progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Contact info */}
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {loan.borrower.email && (
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  <span>{loan.borrower.email}</span>
                                </div>
                              )}
                              {loan.borrower.phone && (
                                <div className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  <span>{loan.borrower.phone}</span>
                                </div>
                              )}
                            </div>

                            {/* Prochaine échéance */}
                            {nextPayment && loan.status === 'active' && (
                              <div className="mt-4 p-3 rounded-lg bg-blue-50">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">Prochaine échéance</p>
                                    <p className="text-sm text-blue-700">
                                      {nextPayment.amount.toFixed(2)} € - {new Date(nextPayment.dueDate).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    {nextPayment.isOverdue ? (
                                      <Badge variant="destructive">
                                        En retard ({Math.abs(nextPayment.daysUntilDue)}j)
                                      </Badge>
                                    ) : nextPayment.daysUntilDue <= 7 ? (
                                      <Badge className="bg-orange-100 text-orange-700">
                                        Dans {nextPayment.daysUntilDue}j
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">
                                        Dans {nextPayment.daysUntilDue}j
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-right ml-6">
                            <div className="mb-4">
                              <p className="text-sm text-gray-500">Taux de remboursement</p>
                              <p className="text-lg font-bold text-gray-900">
                                {progressPercentage.toFixed(1)}%
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Button
                                size="sm"
                                onClick={() => openRepaymentModal(loan)}
                                disabled={loan.status !== 'active'}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Enregistrer remboursement
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/modules/associations/${associationId}/finances/loans/${loan.id}`)}
                                className="w-full"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir détails
                              </Button>

                              {loan.borrower.phone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`tel:${loan.borrower.phone}`)}
                                  className="w-full"
                                >
                                  <Phone className="h-4 w-4 mr-1" />
                                  Appeler
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Active loans tab */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            {loans.filter(loan => loan.status === 'active').map((loan) => {
              const nextPayment = calculateNextPayment(loan);
              
              return (
                <Card key={loan.id} className={`${loan.daysLate > 0 ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{loan.title}</h3>
                        <p className="text-gray-600">{loan.borrower.name}</p>
                      </div>
                      {getStatusBadge(loan.status, loan.daysLate)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Restant dû</p>
                        <p className="text-xl font-bold text-orange-600">{loan.amountOutstanding.toFixed(2)} €</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Échéance mensuelle</p>
                        <p className="text-xl font-bold text-blue-600">{loan.monthlyPayment.toFixed(2)} €</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Prochaine échéance</p>
                        <p className="text-sm font-medium">
                          {nextPayment ? new Date(nextPayment.dueDate).toLocaleDateString('fr-FR') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        size="sm"
                        onClick={() => openRepaymentModal(loan)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Nouveau remboursement
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/modules/associations/${associationId}/finances/loans/${loan.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Completed loans tab */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            {loans.filter(loan => loan.status === 'completed').map((loan) => (
              <Card key={loan.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{loan.title}</h3>
                          <p className="text-sm text-gray-600">{loan.borrower.name}</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Soldé</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Montant accordé</p>
                          <p className="font-medium">{loan.amountGranted.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Durée</p>
                          <p className="font-medium">{loan.durationMonths} mois</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date fin</p>
                          <p className="font-medium">{new Date(loan.endDate).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/modules/associations/${associationId}/finances/loans/${loan.id}`)}
                    >
                      <History className="h-4 w-4 mr-1" />
                      Voir historique
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal nouveau remboursement */}
        {showRepaymentModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
              <h2 className="text-xl font-bold mb-4">💰 Enregistrer un Remboursement</h2>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900">{selectedLoan.title}</h3>
                <p className="text-blue-700">
                  Emprunteur: {selectedLoan.borrower.name} | 
                  Restant dû: {selectedLoan.amountOutstanding.toFixed(2)} € |
                  Échéance: {selectedLoan.monthlyPayment.toFixed(2)} €
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" required>Montant reçu (€)</Label>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max={selectedLoan.amountOutstanding}
                      value={newRepaymentData.amount || ''}
                      onChange={(e) => setNewRepaymentData({
                        ...newRepaymentData,
                        amount: parseFloat(e.target.value) || 0
                      })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder={selectedLoan.monthlyPayment.toString()}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentDate" required>Date de réception</Label>
                    <input
                      id="paymentDate"
                      type="date"
                      value={newRepaymentData.paymentDate}
                      onChange={(e) => setNewRepaymentData({ ...newRepaymentData, paymentDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentMethod" required>Méthode de paiement</Label>
                    <Select value={newRepaymentData.paymentMethod} onValueChange={(value) => 
                      setNewRepaymentData({ ...newRepaymentData, paymentMethod: value })
                    }>
                      <SelectTrigger id="paymentMethod" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">🏦 Virement bancaire</SelectItem>
                        <SelectItem value="cash">💵 Espèces</SelectItem>
                        <SelectItem value="check">📝 Chèque</SelectItem>
                        <SelectItem value="card_payment">💳 Carte bancaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reference" required>Référence</Label>
                    <input
                      id="reference"
                      type="text"
                      value={newRepaymentData.reference}
                      onChange={(e) => setNewRepaymentData({ ...newRepaymentData, reference: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Ex: VIR-ITALIE-NOV-2024"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes/Commentaires</Label>
                  <Textarea
                    id="notes"
                    value={newRepaymentData.notes}
                    onChange={(e) => setNewRepaymentData({ ...newRepaymentData, notes: e.target.value })}
                    placeholder="Informations complémentaires sur le remboursement..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRepaymentModal(false);
                    setSelectedLoan(null);
                    setNewRepaymentData({
                      loanId: 0,
                      amount: 0,
                      paymentDate: new Date().toISOString().split('T')[0],
                      paymentMethod: 'bank_transfer',
                      reference: '',
                      notes: ''
                    });
                  }}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={recordRepayment}
                  disabled={isSubmitting || !newRepaymentData.amount || !newRepaymentData.reference.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
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