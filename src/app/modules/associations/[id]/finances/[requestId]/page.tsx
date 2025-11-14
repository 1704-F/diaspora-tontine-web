// src/app/modules/associations/[id]/finances/[requestId]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Check,
  Clock,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  Building,
  Users,
  Handshake,
  Star,
  Zap,
  Download,
  CreditCard,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Imports hooks
import { useAssociation } from "@/hooks/association/useAssociation";
import { usePermissions } from "@/hooks/association/usePermissions";
import { financesApi } from "@/lib/api/association/finances";
import { CURRENCIES } from "@/lib/constants/countries";

// ✅ Imports types
import type { ExpenseRequest, ExpenseType } from "@/types/association/finances";

// ✅ Imports components
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function ExpenseRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("finances");
  const tCommon = useTranslations("common");
  const associationId = Number(params.id);
  const expenseId = Number(params.requestId);

  // ============================================
  // HOOKS
  // ============================================
  const { association, loading: associationLoading } = useAssociation(associationId);
  const { canViewFinances, canValidateExpenses } = usePermissions(associationId);

  // ============================================
  // ÉTATS LOCAUX
  // ============================================
  const [expense, setExpense] = useState<ExpenseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comment, setComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  useEffect(() => {
    if (!association) return;

    fetchExpenseDetails();
  }, [association, expenseId]);

  const fetchExpenseDetails = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await financesApi.getExpenseById(associationId, expenseId);

      if (response.success && response.data) {
        setExpense(response.data.expense);
      }
    } catch (err: unknown) {
      const apiError = err as { response?: { status?: number } };
      
      if (apiError.response?.status === 404) {
        setError(t("errors.notFound"));
      } else if (apiError.response?.status === 403) {
        setError(t("errors.unauthorized"));
      } else {
        setError(t("errors.loadFailed"));
      }
      
      console.error("Erreur chargement dépense:", err);
    } finally {
      setLoading(false);
    }
  }, [associationId, expenseId, t]);

  // ============================================
  // HELPERS
  // ============================================
  const getCurrencySymbol = useCallback((currencyCode: string): string => {
    const currency = CURRENCIES.find((c) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  }, []);

  const formatAmount = useCallback(
  (amount: number | string, currencyCode: string): string => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      return `0.00 ${getCurrencySymbol(currencyCode)}`;
    }
    
    return `${numAmount.toFixed(2)} ${getCurrencySymbol(currencyCode)}`;
  },
  [getCurrencySymbol]
);

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

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
  // STATUS & URGENCY BADGES
  // ============================================
  const getStatusBadge = (status: ExpenseRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">{t("status.pending")}</Badge>;
      case "under_review":
        return <Badge variant="secondary">{t("status.under_review")}</Badge>;
      case "additional_info_needed":
        return <Badge variant="warning">{t("status.additional_info_needed")}</Badge>;
      case "approved":
        return <Badge variant="success">{t("status.approved")}</Badge>;
      case "rejected":
        return <Badge variant="danger">{t("status.rejected")}</Badge>;
      case "paid":
        return <Badge variant="success">{t("status.paid")}</Badge>;
      case "cancelled":
        return <Badge variant="secondary">{t("status.cancelled")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: ExpenseRequest["urgencyLevel"]) => {
    switch (urgency) {
      case "low":
        return <Badge variant="secondary">{t("urgencyLevels.low")}</Badge>;
      case "normal":
        return <Badge variant="default">{t("urgencyLevels.normal")}</Badge>;
      case "high":
        return <Badge variant="warning">{t("urgencyLevels.high")}</Badge>;
      case "critical":
        return <Badge variant="danger">{t("urgencyLevels.critical")}</Badge>;
      default:
        return null;
    }
  };

  // ============================================
  // HANDLERS ACTIONS
  // ============================================
  const handleApprove = async () => {
    if (!comment.trim()) {
      toast.error(t("modals.commentRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await financesApi.approveExpense(associationId, expenseId, {
        comment: comment.trim(),
      });

      if (response.success) {
        toast.success(t("success.approved"));
        setShowApproveModal(false);
        setComment("");
        fetchExpenseDetails();
      }
    } catch (error: unknown) {
      console.error("Erreur approbation:", error);
      toast.error(t("errors.loadFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.length < 10) {
      toast.error(t("modals.rejectionReasonRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await financesApi.rejectExpense(associationId, expenseId, {
        rejectionReason: rejectionReason.trim(),
      });

      if (response.success) {
        toast.success(t("success.rejected"));
        setShowRejectModal(false);
        setRejectionReason("");
        fetchExpenseDetails();
      }
    } catch (error: unknown) {
      console.error("Erreur rejet:", error);
      toast.error(t("errors.loadFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("errors.deleteConfirm"))) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await financesApi.deleteExpense(associationId, expenseId);

      if (response.success) {
        toast.success(t("success.deleted"));
        router.push(`/modules/associations/${associationId}/finances`);
      }
    } catch (error: unknown) {
      console.error("Erreur suppression:", error);
      toast.error(t("errors.loadFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================
  // VÉRIFICATION PERMISSIONS
  // ============================================
  if (!associationLoading && !canViewFinances) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="shadow-sm">
          <CardContent className="py-20">
            <div className="text-center">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("errors.noPermission")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("errors.noPermission")}
              </p>
              <Button
                onClick={() => router.push(`/modules/associations/${associationId}/dashboard`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {tCommon("back")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // LOADING STATES
  // ============================================
  if (associationLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !expense || !association) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-sm">
          <CardContent className="py-20">
            <div className="text-center">
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tCommon("error")}
              </h3>
              <p className="text-gray-600 mb-6">
                {error || tCommon("errors.notFound")}
              </p>
              <Button onClick={() => router.push(`/modules/associations/${associationId}/finances`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("actions.backToFinances")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = getExpenseTypeIcon(expense.expenseType);

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
              onClick={() => router.push(`/modules/associations/${associationId}/finances`)}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{expense.title}</h1>
                <p className="text-gray-600 mt-1">{getExpenseTypeLabel(expense.expenseType)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {canValidateExpenses && expense.status === "pending" && (
              <>
                <Button
                  onClick={() => setShowApproveModal(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  {t("actions.approve")}
                </Button>
                <Button
                  onClick={() => setShowRejectModal(true)}
                  variant="outline"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                  {t("actions.reject")}
                </Button>
              </>
            )}
            
            {canValidateExpenses && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {t("actions.delete")}
              </Button>
            )}
          </div>
        </div>

        {/* Status et montant */}
        <Card className="shadow-sm bg-gray-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusBadge(expense.status)}
                {getUrgencyBadge(expense.urgencyLevel)}
                {expense.isLoan && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {t("details.loanTerms")}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {formatAmount(expense.amountRequested, expense.currency)}
                </p>
                {expense.amountApproved && (
                  <p className="text-sm text-green-600 mt-1">
                    {t("status.approved")}: {formatAmount(expense.amountApproved, expense.currency)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ CONTENU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails de la demande */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("details.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{t("details.description")}</h3>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {expense.description}
                </p>
              </div>

              {expense.expenseSubtype && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{t("details.subcategory")}</h3>
                  <p className="text-gray-700">{expense.expenseSubtype}</p>
                </div>
              )}

              {expense.expectedImpact && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{t("details.expectedImpact")}</h3>
                  <p className="text-gray-700">{expense.expectedImpact}</p>
                </div>
              )}

              {expense.beneficiaryExternal && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{t("details.externalBeneficiary")}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="font-medium text-gray-900">{expense.beneficiaryExternal.name}</p>
                    {expense.beneficiaryExternal.contact && (
                      <p className="text-sm text-gray-600">
                        {t("details.contact")}: {expense.beneficiaryExternal.contact}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {expense.isLoan && expense.loanTerms && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{t("details.loanTerms")}</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-purple-800">{t("details.duration")}</p>
                        <p className="text-purple-700 font-semibold">
                          {expense.loanTerms.durationMonths} mois
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-800">{t("details.interestRate")}</p>
                        <p className="text-purple-700 font-semibold">
                          {expense.loanTerms.interestRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {expense.rejectionReason && (
                <div>
                  <h3 className="font-medium text-red-900 mb-2">{t("details.rejectionReason")}</h3>
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-800">{expense.rejectionReason}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historique de validation */}
          {expense.validationHistory && expense.validationHistory.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t("details.validationHistory")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expense.validationHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          entry.decision === "approved"
                            ? "bg-green-100"
                            : entry.decision === "rejected"
                            ? "bg-red-100"
                            : "bg-orange-100"
                        }`}
                      >
                        {entry.decision === "approved" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : entry.decision === "rejected" ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Info className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 capitalize">
                          {entry.role?.replace("_", " ")}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{entry.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(entry.timestamp)}
                        </p>
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
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("details.information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-gray-600 block">{t("details.requester")}</span>
                  <span className="font-medium text-gray-900">
                    {expense.requester?.firstName} {expense.requester?.lastName}
                  </span>
                </div>
              </div>

              {expense.beneficiary && (
                <div className="flex items-start gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-gray-600 block">{t("details.beneficiary")}</span>
                    <span className="font-medium text-gray-900">
                      {expense.beneficiary.firstName} {expense.beneficiary.lastName}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-gray-600 block">{t("details.createdOn")}</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(expense.createdAt)}
                  </span>
                </div>
              </div>

              {expense.paidAt && (
                <div className="flex items-start gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-gray-600 block">{t("details.paidOn")}</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(expense.paidAt)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          {(expense.status === "approved" || expense.status === "paid") && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>{t("table.actions")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t("actions.downloadReceipt")}
                </Button>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t("actions.generateCertificate")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ✅ MODAL APPROBATION */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("modals.approveTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("modals.commentLabel")}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("modals.commentPlaceholder")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApproveModal(false);
                    setComment("");
                  }}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isSubmitting || !comment.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {t("actions.approve")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ✅ MODAL REJET */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("modals.rejectTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("modals.rejectionReasonLabel")}
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t("modals.rejectionReasonPlaceholder")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isSubmitting || rejectionReason.length < 10}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {t("actions.reject")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}