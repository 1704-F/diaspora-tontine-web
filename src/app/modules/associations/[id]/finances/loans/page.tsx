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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { AddRepaymentModal } from "@/components/modules/associations/AddRepaymentModal";
import { LoanDetailsModal } from "@/components/modules/associations/LoanDetailsModal";
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
  Mail,
} from "lucide-react";

interface Loan {
  id: number;
  title: string;
  description: string;
  expenseType: string;
  expenseSubtype: string;

  // Bénéficiaire
  borrowerType: "internal" | "external";
  borrower: {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
  };
  beneficiaryExternal?: {
    name: string;
    type: string;
    contact?: string;
    iban?: string;
  };
  beneficiary?: {
    id: number;
    firstName: string;
    lastName: string;
  };

  // Montants
  amountRequested: string;
  amountGranted: number;
  amountRepaid: number;
  amountOutstanding: number;
  currency: string;

  // Conditions prêt
  loanTerms: {
    durationMonths: number;
    interestRate: number;
    monthlyPayment: number;
  };

  // Dates
  startDate: string;
  endDate: string;
  nextDueDate: string;
  created_at: string;

  // Statuts
  status: string;
  isLoan: boolean;
  repaymentStatus: string | null;
  daysLate: number;

  // Remboursements
  repayments: LoanRepayment[];

  // Relations
  requester: {
    firstName: string;
    lastName: string;
  };
  section?: {
    name: string;
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
  status: "pending" | "validated" | "rejected";
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
  const [activeTab, setActiveTab] = useState<
    "overview" | "active" | "completed"
  >("overview");

  // Filtres
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal nouveau remboursement
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [newRepaymentData, setNewRepaymentData] = useState<NewRepaymentData>({
    loanId: 0,
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "bank_transfer",
    reference: "",
    notes: "",
  });

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLoanIdForDetails, setSelectedLoanIdForDetails] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (associationId && token && user) {
      fetchData();
    }
  }, [associationId, token, user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await fetchAssociation();
      await fetchLoans();
    } catch (error) {
      console.error("Erreur chargement données:", error);
      setError("Erreur de chargement des données");
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
        const result = await response.json();
        setAssociation(result.data.association);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur chargement association:", error);
      throw error;
    }
  };

  const fetchLoans = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests?isLoan=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();

        // Transformer les données pour correspondre à l'UI
        const transformedLoans = result.expenseRequests.map((loan: any) => ({
          ...loan,
          // Calculer montants (temporaire jusqu'à implémentation backend)
          amountGranted: parseFloat(loan.amountRequested),
          amountRepaid: 0, // TODO: calculer depuis remboursements
          amountOutstanding: parseFloat(loan.amountRequested),

          // Dates calculées (temporaire)
          startDate: loan.created_at,
          endDate: calculateEndDate(
            loan.created_at,
            loan.loanTerms?.durationMonths || 12
          ),
          nextDueDate: calculateNextDueDate(loan.created_at),

          // Mapping bénéficiaire
          borrowerType: loan.beneficiaryExternal ? "external" : "internal",
          borrower: loan.beneficiaryExternal
            ? {
                name: loan.beneficiaryExternal.name,
                contact: loan.beneficiaryExternal.contact,
                email: "",
                phone: loan.beneficiaryExternal.contact || "",
              }
            : loan.beneficiary
              ? {
                  name: `${loan.beneficiary.firstName} ${loan.beneficiary.lastName}`,
                  email: "",
                  phone: "",
                }
              : { name: "N/A" },

          // Statut
          daysLate: 0, // TODO: calculer
          repayments: [], // Vide car NOT_IMPLEMENTED
        }));

        setLoans(transformedLoans);
      } else {
        setLoans([]);
      }
    } catch (error) {
      console.error("Erreur chargement prêts:", error);
      setLoans([]);
    }
  };

  // Fonctions utilitaires
  const calculateEndDate = (startDate: string, months: number) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + months);
    return date.toISOString();
  };

  const calculateNextDueDate = (startDate: string) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString();
  };

  const getStatusBadge = (status: string, daysLate: number = 0) => {
    if (daysLate > 0) {
      return <Badge variant="destructive">En retard ({daysLate}j)</Badge>;
    }

    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Actif
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Soldé
          </Badge>
        );
      case "defaulted":
        return <Badge variant="destructive">Défaillant</Badge>;
      case "suspended":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Suspendu
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRepaymentMethodLabel = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Virement bancaire";
      case "cash":
        return "Espèces";
      case "check":
        return "Chèque";
      case "card_payment":
        return "Carte bancaire";
      default:
        return method;
    }
  };

  const calculateNextPayment = (loan: Loan) => {
    if (loan.status === "completed") return null;

    const nextDue = new Date(loan.nextDueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil(
      (nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      amount: loan.loanTerms?.monthlyPayment || 0,
      dueDate: loan.nextDueDate,
      daysUntilDue,
      isOverdue: daysUntilDue < 0,
    };
  };

  const openRepaymentModal = (loan: Loan) => {
    const nextPayment = calculateNextPayment(loan);
    setSelectedLoan(loan);
    setNewRepaymentData({
      loanId: loan.id,
      amount: nextPayment?.amount || loan.loanTerms?.monthlyPayment || 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "bank_transfer",
      reference: `REMB-${loan.id}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`,
      notes: "",
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
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests/${newRepaymentData.loanId}/repayments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: newRepaymentData.amount,
            paymentDate: newRepaymentData.paymentDate,
            paymentMethod: newRepaymentData.paymentMethod,
            manualReference: newRepaymentData.reference,
            notes: newRepaymentData.notes,
          }),
        }
      );

      if (response.ok) {
        setShowRepaymentModal(false);
        setSelectedLoan(null);
        setNewRepaymentData({
          loanId: 0,
          amount: 0,
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethod: "bank_transfer",
          reference: "",
          notes: "",
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
    const activeLoans = loans.filter(
      (loan) => loan.status === "approved" || loan.status === "paid"
    );
    const completedLoans = loans.filter(
      (loan) => loan.repaymentStatus === "completed"
    );
    const overdueLoans = loans.filter((loan) => loan.daysLate > 0);

    const totalGranted = activeLoans.reduce(
      (sum, loan) => sum + parseFloat(loan.amountRequested),
      0
    );
    const totalOutstanding = activeLoans.reduce(
      (sum, loan) =>
        sum + (parseFloat(loan.amountRequested) - loan.amountRepaid),
      0
    );
    const totalRepaid = loans.reduce((sum, loan) => sum + loan.amountRepaid, 0);

    return {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      completedLoans: completedLoans.length,
      overdueLoans: overdueLoans.length,
      totalGranted,
      totalOutstanding,
      totalRepaid,
      repaymentRate: totalGranted > 0 ? (totalRepaid / totalGranted) * 100 : 0,
    };
  };

  // Filtrer les prêts
  const filteredLoans = loans.filter((loan) => {
    if (filterStatus !== "all" && loan.status !== filterStatus) return false;
    if (filterType !== "all" && loan.borrowerType !== filterType) return false;
    if (
      searchTerm &&
      !loan.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !loan.borrower.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;

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

  if (error) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Accès refusé
            </h1>
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
              onClick={() =>
                router.push(`/modules/associations/${associationId}/finances`)
              }
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux finances
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Suivi des Prêts
              </h1>
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
                  <p className="text-sm font-medium text-gray-600">
                    Total prêtés
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">
                    Remboursés
                  </p>
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
                  <p className="text-2xl font-bold text-red-600">
                    {stats.overdueLoans}
                  </p>
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
              onClick={() => setActiveTab("overview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Calculator className="h-4 w-4 inline mr-2" />
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "active"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Prêts actifs ({stats.activeLoans})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "completed"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <CheckCircle className="h-4 w-4 inline mr-2" />
              Soldés ({stats.completedLoans})
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
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

                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterStatus("all");
                      setFilterType("all");
                      setSearchTerm("");
                    }}
                  >
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun prêt trouvé
                    </h3>
                    <p className="text-gray-600">
                      {loans.length === 0
                        ? "Aucun prêt n'a encore été accordé"
                        : "Aucun prêt ne correspond aux critères de filtrage"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredLoans.map((loan) => {
                  const nextPayment = calculateNextPayment(loan);
                  const progressPercentage =
                    loan.amountGranted > 0
                      ? ((loan.amountGranted - loan.amountOutstanding) /
                          loan.amountGranted) *
                        100
                      : 0;

                  return (
                    <Card
                      key={loan.id}
                      className={`${loan.daysLate > 0 ? "border-red-200 bg-red-50" : ""}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Handshake className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {loan.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {loan.borrower.name}
                                </p>
                              </div>
                              {getStatusBadge(loan.status, loan.daysLate)}
                              {loan.borrowerType === "external" && (
                                <Badge variant="outline" className="bg-gray-50">
                                  Externe
                                </Badge>
                              )}
                            </div>

                            <p className="text-gray-700 mb-4">
                              {loan.description}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-gray-500">Montant accordé</p>
                                <p className="font-medium">
                                  {loan.amountGranted.toFixed(2)} €
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Remboursé</p>
                                <p className="font-medium text-green-600">
                                  {loan.amountRepaid.toFixed(2)} €
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Restant dû</p>
                                <p className="font-medium text-orange-600">
                                  {loan.amountOutstanding.toFixed(2)} €
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">
                                  Échéance mensuelle
                                </p>
                                <p className="font-medium">
                                  {loan.loanTerms?.monthlyPayment.toFixed(2)} €
                                </p>
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
                            {nextPayment && loan.status === "active" && (
                              <div className="mt-4 p-3 rounded-lg bg-blue-50">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-blue-900">
                                      Prochaine échéance
                                    </p>
                                    <p className="text-sm text-blue-700">
                                      {nextPayment.amount.toFixed(2)} € -{" "}
                                      {new Date(
                                        nextPayment.dueDate
                                      ).toLocaleDateString("fr-FR")}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    {nextPayment.isOverdue ? (
                                      <Badge variant="destructive">
                                        En retard (
                                        {Math.abs(nextPayment.daysUntilDue)}j)
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
                              <p className="text-sm text-gray-500">
                                Taux de remboursement
                              </p>
                              <p className="text-lg font-bold text-gray-900">
                                {progressPercentage.toFixed(1)}%
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Button
                                size="sm"
                                onClick={() => openRepaymentModal(loan)}
                                disabled={loan.status !== "active"}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Enregistrer remboursement
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLoanIdForDetails(loan.id);
                                  setShowDetailsModal(true);
                                }}
                                className="w-full"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir détails
                              </Button>

                              {loan.borrower.phone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    window.open(`tel:${loan.borrower.phone}`)
                                  }
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
        {activeTab === "active" && (
          <div className="space-y-4">
            {loans
              .filter((loan) => loan.status === "active")
              .map((loan) => {
                const nextPayment = calculateNextPayment(loan);

                return (
                  <Card
                    key={loan.id}
                    className={`${loan.daysLate > 0 ? "border-red-200 bg-red-50" : ""}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {loan.title}
                          </h3>
                          <p className="text-gray-600">{loan.borrower.name}</p>
                        </div>
                        {getStatusBadge(loan.status, loan.daysLate)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500">Restant dû</p>
                          <p className="text-xl font-bold text-orange-600">
                            {loan.amountOutstanding.toFixed(2)} €
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500">
                            Échéance mensuelle
                          </p>
                          <p className="text-xl font-bold text-blue-600">
                            {loan.loanTerms?.monthlyPayment.toFixed(2)} €
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500">
                            Prochaine échéance
                          </p>
                          <p className="text-sm font-medium">
                            {nextPayment
                              ? new Date(
                                  nextPayment.dueDate
                                ).toLocaleDateString("fr-FR")
                              : "N/A"}
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
                          onClick={() =>
                            router.push(
                              `/modules/associations/${associationId}/finances/loans/${loan.id}`
                            )
                          }
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
        {activeTab === "completed" && (
          <div className="space-y-4">
            {loans
              .filter((loan) => loan.status === "completed")
              .map((loan) => (
                <Card key={loan.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {loan.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {loan.borrower.name}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            Soldé
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Montant accordé</p>
                            <p className="font-medium">
                              {loan.amountGranted.toFixed(2)} €
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Durée</p>
                            <p className="font-medium">
                              {loan.loanTerms?.durationMonths || 0} mois
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Date fin</p>
                            <p className="font-medium">
                              {new Date(loan.endDate).toLocaleDateString(
                                "fr-FR"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/modules/associations/${associationId}/finances/loans/${loan.id}`
                          )
                        }
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
          <AddRepaymentModal
            isOpen={showRepaymentModal}
            onClose={() => {
              setShowRepaymentModal(false);
              setSelectedLoan(null);
            }}
            associationId={associationId}
            loanId={selectedLoan.id}
            loanDetails={{
              title: selectedLoan.title,
              borrowerName: selectedLoan.borrower.name,
              amountOutstanding: selectedLoan.amountOutstanding,
              monthlyPayment: selectedLoan.loanTerms?.monthlyPayment || 0,
            }}
            onRepaymentAdded={() => fetchLoans()}
          />
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

        {showDetailsModal && selectedLoanIdForDetails && (
          <LoanDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedLoanIdForDetails(null);
            }}
            associationId={associationId}
            loanId={selectedLoanIdForDetails}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
