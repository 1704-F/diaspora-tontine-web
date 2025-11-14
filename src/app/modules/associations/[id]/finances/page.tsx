// src/app/modules/associations/[id]/finances/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Clock,
  Download,
  Plus,
  Eye,
  Filter,
  X,
  FileText,
  Users,
  Building,
  Handshake,
  Star,
  Zap,
  Calendar,
  Euro,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Imports hooks
import { useAssociation } from "@/hooks/association/useAssociation";
import { useExpenseRequests } from "@/hooks/association/useExpenseRequests";
import { useFinancialSummary } from "@/hooks/association/useFinancialSummary";
import { usePermissions } from "@/hooks/association/usePermissions";
import { CURRENCIES } from "@/lib/constants/countries";

// ✅ Imports types
import type {
  ExpenseRequest,
  ExpenseType,
  ExpenseStatus,
  UrgencyLevel,
  ExpenseFilters,
} from "@/types/association/finances";

// ✅ Imports components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { StatCard } from "@/components/ui/StatCard";

export default function FinancesPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("finances");
  const tCommon = useTranslations("common");
  const associationId = Number(params.id);

  // ============================================
  // HOOKS
  // ============================================
  const { association, loading: associationLoading } = useAssociation(associationId);
  const { expenses, loading, pagination, fetchExpenses, refetch } = useExpenseRequests(associationId);
  const { summary, loading: summaryLoading, fetchSummary } = useFinancialSummary(associationId);
  const {
    canViewFinances,
    canValidateExpenses,
    canExportFinancialData,
  } = usePermissions(associationId);

  // ============================================
  // ÉTATS LOCAUX
  // ============================================
  const [activeTab, setActiveTab] = useState<"dashboard" | "requests" | "pending">("dashboard");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(true);

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
 useEffect(() => {
  // ✅ Ne rien faire tant que l'association n'est pas chargée
  if (!association) return;

  // ✅ Charger le résumé financier
  fetchSummary("all");
}, [association, fetchSummary]);

  useEffect(() => {
  const filters: ExpenseFilters = {
    status: selectedStatus !== "all" ? (selectedStatus as ExpenseStatus) : undefined,
    expenseType: selectedType !== "all" ? (selectedType as ExpenseType) : undefined,
    urgencyLevel: selectedUrgency !== "all" ? (selectedUrgency as UrgencyLevel) : undefined,
    search: searchQuery || undefined,
    page: currentPage,
    limit: itemsPerPage,
    sortBy: "created_at",
    sortOrder: "DESC",
  };

  fetchExpenses(filters);
}, [
  selectedStatus,
  selectedType,
  selectedUrgency,
  searchQuery,
  currentPage,
  itemsPerPage,
  fetchExpenses,
]);

  // ============================================
  // HELPERS
  // ============================================
  const getCurrencySymbol = useCallback((currencyCode: string): string => {
    const currency = CURRENCIES.find((c) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  }, []);

  const formatAmount = useCallback(
  (amount: number | string | undefined | null, currencyCode: string): string => {
    // Convertir en nombre et gérer les cas invalides
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Si le montant est invalide, retourner 0.00
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return `0.00 ${getCurrencySymbol(currencyCode)}`;
    }
    
    return `${numAmount.toFixed(2)} ${getCurrencySymbol(currencyCode)}`;
  },
  [getCurrencySymbol]
);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  // ============================================
// STATUS BADGE
// ============================================
const getStatusBadge = (status: ExpenseStatus) => {
  switch (status) {
    case 'pending':
      return <Badge variant="warning">{t("status.pending")}</Badge>;
    case 'under_review':
      return <Badge variant="secondary">{t("status.under_review")}</Badge>;
    case 'additional_info_needed':
      return <Badge variant="warning">{t("status.additional_info_needed")}</Badge>;
    case 'approved':
      return <Badge variant="success">{t("status.approved")}</Badge>;
    case 'rejected':
      return <Badge variant="danger">{t("status.rejected")}</Badge>;
    case 'paid':
      return <Badge variant="success">{t("status.paid")}</Badge>;
    case 'cancelled':
      return <Badge variant="secondary">{t("status.cancelled")}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};


  // ============================================
  // URGENCY BADGE
  // ============================================
 const getUrgencyBadge = (urgency: UrgencyLevel) => {
  switch (urgency) {
    case 'low':
      return <Badge variant="secondary">{t("urgencyLevels.low")}</Badge>;
    case 'normal':
      return <Badge variant="default">{t("urgencyLevels.normal")}</Badge>;
    case 'high':
      return <Badge variant="warning">{t("urgencyLevels.high")}</Badge>;
    case 'critical':
      return <Badge variant="danger">{t("urgencyLevels.critical")}</Badge>;
    default:
      return <Badge variant="default">{urgency}</Badge>;
  }
};

  // ============================================
  // EXPENSE TYPE HELPERS
  // ============================================
  const getExpenseTypeIcon = (type: ExpenseType) => {
    const icons: Record<ExpenseType, typeof FileText> = {
      aide_membre: Users,
      depense_operationnelle: Building,
      pret_partenariat: Handshake,
      projet_special: Star,
      urgence_communautaire: Zap,
    };
    return icons[type] || FileText;
  };

  const getExpenseTypeLabel = (type: ExpenseType): string => {
    return t(`expenseTypes.${type}`);
  };

  // ============================================
  // HANDLERS FILTRES
  // ============================================
  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedStatus("all");
    setSelectedType("all");
    setSelectedUrgency("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setCurrentPage(1);
  };

  const handleUrgencyChange = (value: string) => {
    setSelectedUrgency(value);
    setCurrentPage(1);
  };

  // ============================================
  // HANDLERS PAGINATION
  // ============================================
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // ============================================
  // HANDLERS ACTIONS
  // ============================================
  const handleViewDetails = (expense: ExpenseRequest) => {
    router.push(`/modules/associations/${associationId}/finances/${expense.id}`);
  };

  const handleExport = async () => {
    if (!canExportFinancialData) {
      toast.error(t("errors.noPermission"));
      return;
    }

    toast.info(tCommon("export.generating"));
    // TODO: Implémenter export
  };

  const handleNewRequest = () => {
    router.push(`/modules/associations/${associationId}/finances/new`);
  };

  // ============================================
  // LOADING STATES
  // ============================================
  if (associationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!association) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">{tCommon("errors.notFound")}</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* ✅ HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/modules/associations/${associationId}/dashboard`)}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
              <p className="text-gray-600 mt-2">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canExportFinancialData && (
              <Button
                onClick={handleExport}
                variant="outline"
                className="flex items-center gap-2 shadow-sm"
              >
                <Download className="h-4 w-4" />
                {t("actions.export")}
              </Button>
            )}
            <Button
              onClick={handleNewRequest}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Plus className="h-4 w-4" />
              {t("actions.newRequest")}
            </Button>
          </div>
        </div>

        {/* ✅ TABS */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "dashboard"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("tabs.dashboard")}
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "requests"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("tabs.requests")}
          </button>
          {canValidateExpenses && (
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "pending"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t("tabs.pending")}
            </button>
          )}
        </div>
      </div>

      {/* ✅ STATISTIQUES */}
      {activeTab === "dashboard" && summary && (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    <StatCard
      title={t("stats.currentBalance")}
      value={formatAmount(
        summary.balance?.current ?? 0, 
        association.primaryCurrency
      )}
      icon={Wallet}
      color="blue"
    />
    <StatCard
      title={t("stats.totalExpenses")}
      value={formatAmount(
        summary.expenses?.total ?? 0, 
        association.primaryCurrency
      )}
      icon={TrendingUp}
      color="purple"
    />
    <StatCard
      title={t("stats.pendingRequests")}
      value={(summary.expenses?.pending ?? 0).toString()}
      icon={Clock}
      color="orange"
    />
    <StatCard
      title={t("stats.approvedAmount")}
      value={formatAmount(
        summary.expenses?.approved ?? 0, 
        association.primaryCurrency
      )}
      icon={AlertTriangle}
      color="green"
    />
  </div>
)}

      {/* ✅ FILTRES */}
      {activeTab !== "dashboard" && (
        <Card className="shadow-sm mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("filters.title")}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Recherche */}
                <div className="md:col-span-2">
                  <Input
                    placeholder={t("filters.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                {/* Statut */}
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("filters.status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("status.all")}</SelectItem>
                    <SelectItem value="pending">{t("status.pending")}</SelectItem>
                    <SelectItem value="under_review">{t("status.under_review")}</SelectItem>
                    <SelectItem value="approved">{t("status.approved")}</SelectItem>
                    <SelectItem value="rejected">{t("status.rejected")}</SelectItem>
                    <SelectItem value="paid">{t("status.paid")}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type */}
                <Select value={selectedType} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("filters.type")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("expenseTypes.all")}</SelectItem>
                    <SelectItem value="aide_membre">{t("expenseTypes.aide_membre")}</SelectItem>
                    <SelectItem value="depense_operationnelle">
                      {t("expenseTypes.depense_operationnelle")}
                    </SelectItem>
                    <SelectItem value="pret_partenariat">
                      {t("expenseTypes.pret_partenariat")}
                    </SelectItem>
                    <SelectItem value="projet_special">
                      {t("expenseTypes.projet_special")}
                    </SelectItem>
                    <SelectItem value="urgence_communautaire">
                      {t("expenseTypes.urgence_communautaire")}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Urgence */}
                <Select value={selectedUrgency} onValueChange={handleUrgencyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("filters.urgency")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("urgencyLevels.all")}</SelectItem>
                    <SelectItem value="low">{t("urgencyLevels.low")}</SelectItem>
                    <SelectItem value="normal">{t("urgencyLevels.normal")}</SelectItem>
                    <SelectItem value="high">{t("urgencyLevels.high")}</SelectItem>
                    <SelectItem value="critical">{t("urgencyLevels.critical")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Boutons actions filtres */}
              <div className="flex items-center gap-3 mt-4">
                <Button onClick={handleSearch} size="sm" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {tCommon("actions.apply")}
                </Button>
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {t("filters.reset")}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* ✅ CONTENU SELON TAB */}
      {activeTab === "dashboard" && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dépenses par type */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("charts.expensesByType")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.expenses.byType.map((item) => {
                  const Icon = getExpenseTypeIcon(item.type);
                  return (
                    <div
                      key={item.type}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {getExpenseTypeLabel(item.type)}
                          </p>
                          <p className="text-sm text-gray-600">{item.count} demande(s)</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatAmount(item.total, association.primaryCurrency)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Alertes */}
          {summary.alerts && summary.alerts.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t("alerts.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === "danger"
                          ? "bg-red-50 border-red-500"
                          : alert.severity === "warning"
                          ? "bg-orange-50 border-orange-500"
                          : "bg-blue-50 border-blue-500"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ✅ LISTE DES DEMANDES */}
      {activeTab !== "dashboard" && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : expenses.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="py-20">
                <div className="text-center">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Euro className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("empty.title")}
                  </h3>
                  <p className="text-gray-600 mb-6">{t("empty.description")}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="shadow-sm mb-6">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t("table.title")}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {pagination.total} {tCommon("results")}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("table.date")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("table.title")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("table.type")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("table.requester")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("table.amount")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("table.urgency")}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("table.status")}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t("table.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {expenses.map((expense) => (
                          <tr
                            key={expense.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            {/* Date */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                {formatDate(expense.createdAt)}
                              </div>
                            </td>

                            {/* Titre */}
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {expense.title}
                              </div>
                            </td>

                            {/* Type */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="secondary">
                                {getExpenseTypeLabel(expense.expenseType)}
                              </Badge>
                            </td>

                            {/* Demandeur */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {expense.requester ? (
                                <div className="text-sm text-gray-900">
                                  {expense.requester.firstName} {expense.requester.lastName}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>

                            {/* Montant */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {formatAmount(expense.amountRequested, expense.currency)}
                              </div>
                            </td>

                            {/* Urgence */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getUrgencyBadge(expense.urgencyLevel)}
                            </td>

                            {/* Statut */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(expense.status)}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(expense)}
                                title={t("actions.viewDetails")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* ✅ PAGINATION */}
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  itemsPerPageOptions={[10, 25, 50, 100]}
                  showItemsPerPage={true}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}