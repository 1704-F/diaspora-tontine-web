// src/app/modules/associations/[id]/finances/validations/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Eye,
  Filter,
  X,
  Calendar,
  User,
  DollarSign,
  FileText,
  Building,
  Users,
  Handshake,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Imports hooks
import { useAssociation } from "@/hooks/association/useAssociation";
import { useExpenseRequests } from "@/hooks/association/useExpenseRequests";
import { usePermissions } from "@/hooks/association/usePermissions";
import { financesApi } from "@/lib/api/association/finances";
import { CURRENCIES } from "@/lib/constants/countries";

// ✅ Imports types
import type {
  ExpenseRequest,
  ExpenseType,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/Textarea";

export default function FinancesValidationsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("finances");
  const tCommon = useTranslations("common");
  const associationId = Number(params.id);

  // ============================================
  // HOOKS
  // ============================================
  const { association, loading: associationLoading } = useAssociation(associationId);
  const { expenses, loading, pagination, fetchExpenses, refetch } =
    useExpenseRequests(associationId);
  const { canValidateExpenses } = usePermissions(associationId);

  // ============================================
  // ÉTATS LOCAUX
  // ============================================
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showFilters, setShowFilters] = useState(true);

  // États modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRequest | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [approvedAmount, setApprovedAmount] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);



  useEffect(() => {
    const filters: ExpenseFilters = {
      status: "pending", // ✅ Seulement les demandes en attente
      expenseType: selectedType !== "all" ? (selectedType as ExpenseType) : undefined,
      urgencyLevel: selectedUrgency !== "all" ? (selectedUrgency as UrgencyLevel) : undefined,
      search: searchQuery || undefined,
      page: currentPage,
      limit: itemsPerPage,
      sortBy: "created_at",
      sortOrder: "DESC",
    };

    fetchExpenses(filters);
  }, [selectedType, selectedUrgency, searchQuery, currentPage, itemsPerPage, fetchExpenses]);

  // ============================================
  // HELPERS
  // ============================================
  const getCurrencySymbol = useCallback((currencyCode: string): string => {
    const currency = CURRENCIES.find((c) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  }, []);

  const formatAmount = useCallback(
    (amount: number, currencyCode: string): string => {
      return `${amount.toFixed(2)} ${getCurrencySymbol(currencyCode)}`;
    },
    [getCurrencySymbol]
  );

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // ============================================
  // URGENCY BADGE
  // ============================================
  const getUrgencyBadge = (urgency: UrgencyLevel) => {
  const configs: Record<UrgencyLevel, { variant: "default" | "secondary" | "warning" | "danger"; label: string }> = {
    low: { variant: "secondary", label: t("urgencyLevels.low") },
    normal: { variant: "default", label: t("urgencyLevels.normal") },
    high: { variant: "warning", label: t("urgencyLevels.high") },
    critical: { variant: "danger", label: t("urgencyLevels.critical") },
  };

  return <Badge variant={configs[urgency].variant}>{configs[urgency].label}</Badge>;
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
    setSelectedType("all");
    setSelectedUrgency("all");
    setSearchQuery("");
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

  const handleOpenApprove = (expense: ExpenseRequest) => {
    setSelectedExpense(expense);
    setApprovedAmount(expense.amountRequested.toString());
    setApprovalComment("");
    setShowApproveModal(true);
  };

  const handleOpenReject = (expense: ExpenseRequest) => {
    setSelectedExpense(expense);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedExpense) return;

    if (!approvedAmount || parseFloat(approvedAmount) <= 0) {
      toast.error("Montant approuvé invalide");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await financesApi.approveExpense(associationId, selectedExpense.id, {
        comment: approvalComment || undefined,
        amountApproved: parseFloat(approvedAmount),
      });

      if (response.success) {
        toast.success(t("success.approved"));
        setShowApproveModal(false);
        setSelectedExpense(null);
        refetch({ status: "pending" });
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || t("errors.approveFailed"));
      console.error("Erreur approbation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedExpense) return;

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      toast.error("Motif de refus requis (minimum 10 caractères)");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await financesApi.rejectExpense(associationId, selectedExpense.id, {
        rejectionReason: rejectionReason.trim(),
      });

      if (response.success) {
        toast.success(t("success.rejected"));
        setShowRejectModal(false);
        setSelectedExpense(null);
        refetch({ status: "pending" });
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || t("errors.rejectFailed"));
      console.error("Erreur rejet:", error);
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/modules/associations/${associationId}/finances`)}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("validations.title")}
            </h1>
            <p className="text-gray-600 mt-2">
              {t("validations.subtitle")}
            </p>
          </div>
        </div>

        {/* ✅ ALERTE INFO */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {t("validations.info")}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {pagination.total}{" "}
                {t("validations.pendingCount")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ FILTRES */}
      <Card className="shadow-sm mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t("filters.title")}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Recherche */}
              <div className="md:col-span-2">
                <Input
                  placeholder={t("filters.search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

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
                  <SelectItem value="projet_special">{t("expenseTypes.projet_special")}</SelectItem>
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

      {/* ✅ LISTE DES DEMANDES */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : expenses.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-20">
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("validations.empty.title")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t(
                  "validations.empty.description"
                  
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-sm mb-6">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {t("validations.list.title")}
                  </CardTitle>
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {expenses.map((expense) => {
                      const Icon = getExpenseTypeIcon(expense.expenseType);
                      return (
                        <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                          {/* Date */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {formatDate(expense.createdAt)}
                            </div>
                          </td>

                          {/* Titre */}
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {expense.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {expense.description}
                              </p>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Icon className="h-4 w-4 text-blue-600" />
                              </div>
                              <Badge variant="secondary">
                                {getExpenseTypeLabel(expense.expenseType)}
                              </Badge>
                            </div>
                          </td>

                          {/* Demandeur */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {expense.requester ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {expense.requester.firstName} {expense.requester.lastName}
                                  </p>
                                  {expense.requester.phone && (
                                    <p className="text-xs text-gray-500">
                                      {expense.requester.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>

                          {/* Montant */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="font-semibold text-gray-900">
                                {formatAmount(expense.amountRequested, expense.currency)}
                              </span>
                            </div>
                          </td>

                          {/* Urgence */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getUrgencyBadge(expense.urgencyLevel)}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(expense)}
                                title={t("actions.viewDetails")}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenApprove(expense)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title={t("actions.approve")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenReject(expense)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title={t("actions.reject")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

      {/* ✅ MODAL APPROBATION */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t("validations.approve.title")}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense && (
                <>
                  <span className="font-medium">{selectedExpense.title}</span>
                  <br />
                  Montant demandé:{" "}
                  {formatAmount(selectedExpense.amountRequested, selectedExpense.currency)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Montant approuvé */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("validations.approve.amountLabel")}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("validations.approve.commentLabel")}
              </label>
              <Textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder={t(
                  "validations.approve.commentPlaceholder"
                )}
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
              disabled={isSubmitting}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting || !approvedAmount}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {tCommon("actions.processing")}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t("actions.approve")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ MODAL REJET */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              {t("validations.reject.title")}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense && (
                <>
                  <span className="font-medium">{selectedExpense.title}</span>
                  <br />
                  Montant demandé:{" "}
                  {formatAmount(selectedExpense.amountRequested, selectedExpense.currency)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Motif de rejet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("validations.reject.reasonLabel")}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t(
                  "validations.reject.reasonPlaceholder"
                )}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectionReason.length}/1000 caractères
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
              disabled={isSubmitting}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              onClick={handleReject}
              disabled={isSubmitting || rejectionReason.length < 10}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {tCommon("actions.processing")}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  {t("actions.reject")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}