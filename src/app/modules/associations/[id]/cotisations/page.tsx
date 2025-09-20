// src/app/modules/associations/[id]/cotisations/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { AddCotisationModal } from "@/components/modules/associations/AddCotisationModal";
import {
  ArrowLeft,
  Euro,
  Users,
  TrendingUp,
  AlertTriangle,
  Download,
  Send,
  Filter,
  Calendar,
  Building2,
  UserCheck,
  Plus,
} from "lucide-react";

interface CotisationsDashboardData {
  period: {
    month: number;
    year: number;
    monthName: string;
  };
  kpis: {
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
    membersCount: number;
    paid: number;
    pending: number;
    late: number;
    very_late: number;
  };
  members: Array<{
    id: number;
    userId: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email: string;
    };
    memberType: string;
    section: {
      id: number;
      name: string;
      country: string;
      city: string;
    } | null;
    expectedAmount: number;
    paidAmount: number;
    hasPendingValidation: number;
    paymentMethod: string | null;
    cotisationStatus: string;
    paymentDate: string | null;
    daysSinceDeadline: number;
    roles: string[];
  }>;
  statistics: {
    bySections: Array<{
      section: {
        id: number | null;
        name: string;
        country: string | null;
        city: string | null;
      };
      membersCount: number;
      expectedAmount: number;
      collectedAmount: number;
      collectionRate: number;
    }>;
    byMemberTypes: Array<{
      memberType: string;
      membersCount: number;
      expectedAmount: number;
      collectedAmount: number;
      collectionRate: number;
    }>;
  };
  filters: {
    month: number;
    year: number;
    sectionId: number | null;
    memberType: string | null;
    status: string;
  };
}

export default function CotisationsDashboardPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const associationId = params.id as string;

  const [dashboardData, setDashboardData] =
    useState<CotisationsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Filtres
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedMemberType, setSelectedMemberType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const months = [
    { value: 1, label: "Janvier" },
    { value: 2, label: "Février" },
    { value: 3, label: "Mars" },
    { value: 4, label: "Avril" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Juin" },
    { value: 7, label: "Juillet" },
    { value: 8, label: "Août" },
    { value: 9, label: "Septembre" },
    { value: 10, label: "Octobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Décembre" },
  ];

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "paid", label: "Payé" },
    { value: "pending", label: "En attente" },
    { value: "late", label: "En retard" },
    { value: "very_late", label: "Très en retard" },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, [
    associationId,
    token,
    selectedMonth,
    selectedYear,
    selectedSection,
    selectedMemberType,
    selectedStatus,
  ]);

  const fetchDashboardData = async () => {
    if (!associationId || !token) return;

    try {
      setIsLoading(true);
      setError("");

      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
      });

      if (selectedSection !== "all")
        params.append("sectionId", selectedSection);
      if (selectedMemberType !== "all")
        params.append("memberType", selectedMemberType);
      if (selectedStatus !== "all") params.append("status", selectedStatus);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/cotisations-dashboard?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setDashboardData(result.data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erreur de chargement");
      }
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: "Payé", className: "bg-green-100 text-green-800" },
      pending: { label: "En attente", className: "bg-blue-100 text-blue-800" },
      late: { label: "En retard", className: "bg-yellow-100 text-yellow-800" },
      very_late: {
        label: "Très en retard",
        className: "bg-red-100 text-red-800",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
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
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
            <Button onClick={() => router.back()}>Retour</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!dashboardData) return null;

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Cotisations
              </h1>
              <p className="text-gray-600">
                {dashboardData.period.monthName} {dashboardData.period.year}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-4 w-4" />
              Ajouter cotisation
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Rappels SMS
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Mois */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mois
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Année */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Année
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[2024, 2025, 2026].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Toutes les sections</option>
                  {dashboardData.statistics.bySections.map((section) => (
                    <option
                      key={section.section.id || "central"}
                      value={section.section.id || ""}
                    >
                      {section.section.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type membre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type membre
                </label>
                <select
                  value={selectedMemberType}
                  onChange={(e) => setSelectedMemberType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les types</option>
                  {dashboardData.statistics.byMemberTypes.map((type) => (
                    <option key={type.memberType} value={type.memberType}>
                      {type.memberType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Euro className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total attendu</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(dashboardData.kpis.totalExpected)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total collecté</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatAmount(dashboardData.kpis.totalCollected)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">En retard</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatAmount(dashboardData.kpis.totalPending)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Taux collecte</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {dashboardData.kpis.collectionRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des membres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Membres ({dashboardData.members.length})</span>
              <div className="flex gap-2 text-sm">
                <Badge className="bg-green-100 text-green-800">
                  {dashboardData.kpis.paid} payés
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {dashboardData.kpis.late} en retard
                </Badge>
                <Badge className="bg-red-100 text-red-800">
                  {dashboardData.kpis.very_late} très en retard
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Membre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Section
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mode paiement
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date paiement
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.user.phoneNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {member.section ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {member.section.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Centrale
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{member.memberType}</Badge>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {member.cotisationStatus === "paid"
                            ? formatAmount(member.paidAmount)
                            : formatAmount(member.expectedAmount)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {/* Récupérer la méthode de paiement depuis les données */}
                        <Badge variant="outline" className="text-xs">
                          {member.paymentMethod === "cash"
                            ? "Espèces"
                            : member.paymentMethod === "check"
                              ? "Chèque"
                              : member.paymentMethod === "card"
                                ? "Carte"
                                : member.paymentMethod === "transfer"
                                  ? "Virement"
                                  : "Non défini"}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        {member.hasPendingValidation ? (
                          // Transaction en attente de validation trésorier
                          <div className="space-y-1">
                            <Badge className="bg-orange-100 text-orange-800">
                              En validation
                            </Badge>
                            <div className="text-xs text-gray-500">
                              Validation trésorier requise
                            </div>
                          </div>
                        ) : (
                          // Statut normal basé sur cotisationStatus
                          getStatusBadge(member.cotisationStatus)
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {member.paymentDate ? (
                          <span className="text-sm text-gray-900">
                            {new Date(member.paymentDate).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {/*
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          >
                            Relancer
                          </Button>
                          */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                          >
                            Historique
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AddCotisationModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              associationId={associationId}
              onCotisationAdded={() => {
                fetchDashboardData();
                setShowAddModal(false);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
