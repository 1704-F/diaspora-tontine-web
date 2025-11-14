// src/app/modules/associations/[id]/cotisations/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  Eye,
  Mail,
  Phone,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  Wallet,
  X,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Imports hooks
import { useAssociation } from "@/hooks/association/useAssociation";
import { useCotisations } from "@/hooks/association/useCotisations";
import { useSections } from "@/hooks/association/useSections";
import { usePermissions } from "@/hooks/association/usePermissions";
import { useRoles } from "@/hooks/association/useRoles";
import { cotisationsApi } from "@/lib/api/association/cotisations";
import { CURRENCIES } from "@/lib/constants/countries";

// ✅ Imports types
import type {
  CotisationsFilters,
  CotisationMember,
  CotisationStatus,
  PaymentMethod,
} from "@/types/association/cotisation";

// ✅ Imports components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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
import { Avatar } from "@/components/ui/Avatar";
import { StatCard } from "@/components/ui/StatCard";

import { AddCotisationModal } from "@/components/modules/associations/AddCotisationModal"

export default function CotisationsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("cotisations");
  const associationId = Number(params.id);

  // ============================================
  // HOOKS
  // ============================================
  const { association, loading: associationLoading } =
    useAssociation(associationId);
  const { sections, fetchSections } = useSections();
  const {
    canViewFinances,
    canManageBudgets,
    canExportFinancialData,
  } = usePermissions(associationId);
  const { roles } = useRoles(associationId);

  // ============================================
  // ÉTATS LOCAUX
  // ============================================
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedSection, setSelectedSection] = useState<number | undefined>(
    undefined
  );
  const [selectedMemberType, setSelectedMemberType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(true);
  const [showStatusColumn, setShowStatusColumn] = useState(true);
  const [showPaymentDateColumn, setShowPaymentDateColumn] = useState(true);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  // État modal
  const [showAddModal, setShowAddModal] = useState(false);

  // ============================================
  // HOOK COTISATIONS
  // ============================================
  const initialFilters: CotisationsFilters = {
    month: selectedMonth,
    year: selectedYear,
    page: currentPage,
    limit: itemsPerPage,
  };

  const { dashboardData, members, loading, error, fetchDashboard, refetch } =
    useCotisations(associationId, initialFilters);

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
 useEffect(() => {
  const filters: CotisationsFilters = {
    month: selectedMonth,
    year: selectedYear,
    sectionId: selectedSection,
    memberType: selectedMemberType !== "all" ? selectedMemberType : undefined,
    status:
      selectedStatus !== "all"
        ? (selectedStatus as CotisationStatus)
        : undefined,
    search: searchQuery || undefined,
    page: currentPage,
    limit: itemsPerPage,
  };

  fetchDashboard(filters);
}, [
  selectedMonth,
  selectedYear,
  selectedSection,
  selectedMemberType,
  selectedStatus,
  searchQuery,
  currentPage,
  itemsPerPage,
  fetchDashboard,
]);

useEffect(() => {
  if (association?.isMultiSection) {
    fetchSections(associationId);
  }
}, [association, associationId, fetchSections]);

  // ============================================
  // HANDLERS FILTRES
  // ============================================
  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
    setSelectedSection(undefined);
    setSelectedMemberType("all");
    setSelectedStatus("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleMonthChange = (value: string) => {
    setSelectedMonth(Number(value));
    setCurrentPage(1);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(Number(value));
    setCurrentPage(1);
  };

  const handleSectionChange = (value: string) => {
    setSelectedSection(value === "all" ? undefined : Number(value));
    setCurrentPage(1);
  };

  const handleMemberTypeChange = (value: string) => {
    setSelectedMemberType(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
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
  const handleExportPDF = async () => {
    if (!canExportFinancialData) {
      toast.error(t("errors.noPermission"));
      return;
    }

    try {
      toast.info(t("export.generating"));

      const blob = await cotisationsApi.exportCotisationsPDF(associationId, {
        month: selectedMonth,
        year: selectedYear,
        sectionId: selectedSection,
        memberType: selectedMemberType !== "all" ? selectedMemberType : undefined,
        status:
          selectedStatus !== "all"
            ? (selectedStatus as CotisationStatus)
            : undefined,
      });

      const fileName = `Cotisations_${association?.name}_${selectedMonth}-${selectedYear}.pdf`;
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(t("export.success"));
    } catch (error: unknown) {
      console.error("❌ Erreur export PDF:", error);
      toast.error(t("export.error"));
    }
  };

  const handleSendReminder = async (member: CotisationMember) => {
    try {
      toast.info(t("reminder.sending"));

      await cotisationsApi.sendPaymentReminder(
        associationId,
        member.id,
        selectedMonth,
        selectedYear
      );

      toast.success(t("reminder.success"));
    } catch (error: unknown) {
      console.error("❌ Erreur envoi rappel:", error);
      toast.error(t("reminder.error"));
    }
  };

  const handleViewHistory = (member: CotisationMember) => {
    // TODO: Ouvrir modal historique
    toast.info(`Historique de ${member.user.firstName} ${member.user.lastName}`);
  };

  // ============================================
  // HELPERS
  // ============================================
  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = CURRENCIES.find((c) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const formatAmount = (amount: number, currencyCode: string): string => {
    return `${amount.toLocaleString("fr-FR")} ${getCurrencySymbol(currencyCode)}`;
  };

  const getStatusBadge = (status: CotisationStatus) => {
    const config = {
      paid: { variant: "success" as const, label: t("status.paid") },
      pending: { variant: "warning" as const, label: t("status.pending") },
      late: { variant: "warning" as const, label: t("status.late") },
      very_late: { variant: "danger" as const, label: t("status.very_late") },
    };
    const statusConfig = config[status] || config.pending;
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    const icons = {
      card: <CreditCard className="h-4 w-4" />,
      bank_transfer: <Banknote className="h-4 w-4" />,
      cash: <Euro className="h-4 w-4" />,
      mobile_money: <Wallet className="h-4 w-4" />,
    };
    return method ? icons[method] : null;
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    if (!method) return t("paymentMethods.unknown");
    return t(`paymentMethods.${method}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Générer liste des années (année actuelle ± 2 ans)
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  // Générer liste des mois
  const monthsList = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: t(`months.${[
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ][i]}`),
  }));

  // ============================================
  // RENDU LOADING
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
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p>{t("errors.associationNotFound")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canViewFinances) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p>{t("errors.noPermission")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDU PRINCIPAL
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ✅ HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push(`/modules/associations/${associationId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToAssociation")}
            </Button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Euro className="h-8 w-8 text-primary" />
                </div>
                {t("title")}
              </h1>
              <p className="text-gray-600 mt-2">{t("subtitle")}</p>
            </div>
            <div className="flex items-center gap-3">
              {canExportFinancialData && (
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  className="flex items-center gap-2 shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  {t("actions.export")}
                </Button>
              )}
              {canManageBudgets && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
                >
                  <Plus className="h-4 w-4" />
                  {t("actions.addManual")}
                </Button>
              )}
            </div>
          </div>

          {/* ✅ STATISTIQUES */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title={t("stats.totalExpected")}
                value={formatAmount(
                  dashboardData.kpis.totalExpected,
                  association.primaryCurrency
                )}
                icon={Euro}
                color="blue"
              />
              <StatCard
                title={t("stats.totalCollected")}
                value={formatAmount(
                  dashboardData.kpis.totalCollected,
                  association.primaryCurrency
                )}
                icon={TrendingUp}
                color="green"
                trend={{
                  value: `${dashboardData.kpis.collectionRate}%`,
                  isPositive: dashboardData.kpis.collectionRate >= 80,
                }}
              />
              <StatCard
                title={t("stats.totalPending")}
                value={formatAmount(
                  dashboardData.kpis.totalPending,
                  association.primaryCurrency
                )}
                icon={AlertTriangle}
                color="orange"
              />
              <StatCard
                title={t("stats.collectionRate")}
                value={`${dashboardData.kpis.collectionRate}%`}
                icon={Users}
                color="purple"
                subtitle={`${dashboardData.kpis.paid}/${dashboardData.kpis.membersCount} ${t("stats.paidCount")}`}
              />
            </div>
          )}
        </div>

        {/* ✅ FILTRES */}
        <Card className="mb-6 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-primary" />
                {t("filters.title")}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? t("filters.hide") : t("filters.show")}
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Filtres principaux */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {/* Mois */}
                  <Select value={selectedMonth.toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("filters.month")} />
                    </SelectTrigger>
                    <SelectContent>
                      {monthsList.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Année */}
                  <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("filters.year")} />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Section */}
                  {association.isMultiSection && (
                    <Select
                      value={selectedSection?.toString() || "all"}
                      onValueChange={handleSectionChange}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={t("filters.section")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("filters.allSections")}</SelectItem>
                        {sections.map((section) => (
                          <SelectItem key={section.id} value={section.id.toString()}>
                            {section.name} ({section.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Type membre */}
                  <Select
                    value={selectedMemberType}
                    onValueChange={handleMemberTypeChange}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("filters.memberType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                      {association.memberTypes?.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Statut */}
                  <Select value={selectedStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("filters.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                      <SelectItem value="paid">{t("status.paid")}</SelectItem>
                      <SelectItem value="pending">{t("status.pending")}</SelectItem>
                      <SelectItem value="late">{t("status.late")}</SelectItem>
                      <SelectItem value="very_late">{t("status.very_late")}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Reset */}
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="flex items-center gap-2 h-11"
                  >
                    <X className="h-4 w-4" />
                    {t("filters.reset")}
                  </Button>
                </div>

                {/* Recherche */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      placeholder={t("filters.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10 h-11"
                    />
                    <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  <Button onClick={handleSearch} className="h-11 px-6">
                    {t("filters.search")}
                  </Button>
                </div>

                {/* Pills filtres actifs */}
                <div className="flex flex-wrap gap-2">
                  {selectedMonth !== currentDate.getMonth() + 1 && (
                    <Badge variant="secondary" className="pl-3 pr-2 py-1">
                      {t("filters.filterMonth")}: {monthsList[selectedMonth - 1].label}
                      <button
                        onClick={() => setSelectedMonth(currentDate.getMonth() + 1)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedYear !== currentDate.getFullYear() && (
                    <Badge variant="secondary" className="pl-3 pr-2 py-1">
                      {t("filters.filterYear")}: {selectedYear}
                      <button
                        onClick={() => setSelectedYear(currentDate.getFullYear())}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedSection && (
                    <Badge variant="secondary" className="pl-3 pr-2 py-1">
                      {t("filters.filterSection")}:{" "}
                      {sections.find((s) => s.id === selectedSection)?.name}
                      <button
                        onClick={() => setSelectedSection(undefined)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedMemberType !== "all" && (
                    <Badge variant="secondary" className="pl-3 pr-2 py-1">
                      {t("filters.filterType")}: {selectedMemberType}
                      <button
                        onClick={() => setSelectedMemberType("all")}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedStatus !== "all" && (
                    <Badge variant="secondary" className="pl-3 pr-2 py-1">
                      {t("filters.filterStatus")}: {t(`status.${selectedStatus}`)}
                      <button
                        onClick={() => setSelectedStatus("all")}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
        {/* ✅ CONTENU PRINCIPAL */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card className="shadow-sm">
            <CardContent className="py-20">
              <div className="text-center">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("errors.loadFailed")}
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={() => refetch()}>
                  {t("actions.refresh")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : members.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-20">
              <div className="text-center">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Euro className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("list.noMembers")}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t("list.noMembersDescription")}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ✅ TABLEAU DES COTISATIONS */}
            <Card className="shadow-sm mb-6">
              {/* Header avec personnalisation colonnes */}
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("list.title")}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {members.length} {t("list.membersFound")}
                    </p>
                  </div>
                  {/* ✅ DROPDOWN COLONNES */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                      className="flex items-center gap-2"
                    >
                      <Settings2 className="h-4 w-4" />
                      Colonnes
                    </Button>
                    {showColumnsMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                        <h4 className="font-semibold text-sm text-gray-900 mb-3">
                          Colonnes affichées
                        </h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showStatusColumn}
                              onChange={(e) =>
                                setShowStatusColumn(e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{t("table.status")}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showPaymentDateColumn}
                              onChange={(e) =>
                                setShowPaymentDateColumn(e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">
                              {t("table.paymentDate")}
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader> 

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {/* Colonnes par défaut */}
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {t("table.member")}
                        </th>
                        {association.isMultiSection && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t("table.section")}
                          </th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {t("table.type")}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {t("table.expectedAmount")}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {t("table.paidAmount")}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {t("table.paymentMethod")}
                        </th>

                        {/* Colonnes optionnelles */}
                        {showStatusColumn && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t("table.status")}
                          </th>
                        )}
                        {showPaymentDateColumn && (
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t("table.paymentDate")}
                          </th>
                        )}

                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {t("table.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {members.map((member) => (
                        <tr
                          key={member.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Membre avec Avatar */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar
                                firstName={member.user?.firstName}
                                lastName={member.user?.lastName}
                                imageUrl={member.user?.profilePicture}
                                size="md"
                              />
                              <div>
                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                  {member.user?.firstName}{" "}
                                  {member.user?.lastName}
                                  {member.isAdmin && (
                                    <Badge variant="secondary" className="text-xs">
                                      Admin
                                    </Badge>
                                  )}
                                </div>
                                {member.user?.phoneNumber && (
                                  <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {member.user.phoneNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Section */}
                          {association.isMultiSection && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              {member.section ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span>{member.section.name}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          )}

                          {/* Type */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="secondary">
                              {member.memberType || "-"}
                            </Badge>
                          </td>

                          {/* Montant attendu */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {formatAmount(
                                member.expectedAmount,
                                association.primaryCurrency
                              )}
                            </div>
                          </td>

                          {/* Montant payé */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`font-medium ${
                                member.paidAmount >= member.expectedAmount
                                  ? "text-green-600"
                                  : member.paidAmount > 0
                                  ? "text-orange-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {formatAmount(
                                member.paidAmount,
                                association.primaryCurrency
                              )}
                            </div>
                          </td>

                          {/* Mode paiement */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {member.paymentMethod ? (
                              <div className="flex items-center gap-2 text-sm">
                                {getPaymentMethodIcon(member.paymentMethod)}
                                <span>
                                  {getPaymentMethodLabel(member.paymentMethod)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>

                          {/* Statut (optionnel) */}
                          {showStatusColumn && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(member.cotisationStatus)}
                            </td>
                          )}

                          {/* Date paiement (optionnel) */}
                          {showPaymentDateColumn && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                {formatDate(member.paymentDate)}
                              </div>
                            </td>
                          )}

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewHistory(member)}
                                title={t("actions.viewHistory")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {member.cotisationStatus !== "paid" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendReminder(member)}
                                  title={t("actions.sendReminder")}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ✅ PAGINATION */}
            {dashboardData && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(members.length / itemsPerPage)}
                  totalItems={members.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  itemsPerPageOptions={[10, 25, 50, 100]}
                  showItemsPerPage={true}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ✅ MODAL AJOUT COTISATION MANUELLE */}
      {showAddModal && (
  <AddCotisationModal
    open={showAddModal}
    onClose={() => setShowAddModal(false)}
    associationId={associationId}
    onSuccess={() => refetch()}
    primaryCurrency={association.primaryCurrency}
    association={association}
  />
)}

    </div>
  );
}

        