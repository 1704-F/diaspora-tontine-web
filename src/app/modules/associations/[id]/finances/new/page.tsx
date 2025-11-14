// src/app/modules/associations/[id]/finances/new/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Users,
  Building,
  Handshake,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Imports hooks
import { useAssociation } from "@/hooks/association/useAssociation";
import { useAssociationMembers } from "@/hooks/association/useAssociationMembers";
import { usePermissions } from "@/hooks/association/usePermissions";
import { financesApi } from "@/lib/api/association/finances";

// ✅ Imports types
import type { ExpenseType, UrgencyLevel, CreateExpensePayload } from "@/types/association/finances";

// ✅ Imports components
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

interface CreateExpenseForm {
  expenseType: ExpenseType | "";
  expenseSubtype: string;
  title: string;
  description: string;
  amountRequested: string;
  urgencyLevel: UrgencyLevel;
  beneficiaryId: string;
  beneficiaryExternal: {
    name: string;
    contact: string;
    organization: string;
  } | null;
  expectedImpact: string;
  isLoan: boolean;
  loanTerms: {
    durationMonths: string;
    interestRate: string;
    repaymentSchedule: string;
  } | null;
}

const initialForm: CreateExpenseForm = {
  expenseType: "",
  expenseSubtype: "",
  title: "",
  description: "",
  amountRequested: "",
  urgencyLevel: "normal",
  beneficiaryId: "",
  beneficiaryExternal: null,
  expectedImpact: "",
  isLoan: false,
  loanTerms: null,
};

export default function CreateExpenseRequestPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("finances");
  const tCommon = useTranslations("common");
  const associationId = Number(params.id);

  // ============================================
  // HOOKS
  // ============================================
  const { association, loading: associationLoading } = useAssociation(associationId);
  const { members, fetchMembers } = useAssociationMembers(associationId);
  const { canViewFinances } = usePermissions(associationId);

  // ============================================
  // ÉTATS LOCAUX
  // ============================================
  const [form, setForm] = useState<CreateExpenseForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // ============================================
  // DONNÉES STATIQUES
  // ============================================
  const expenseTypes: Array<{
    value: ExpenseType;
    icon: typeof Users;
  }> = [
    { value: "aide_membre", icon: Users },
    { value: "depense_operationnelle", icon: Building },
    { value: "pret_partenariat", icon: Handshake },
    { value: "projet_special", icon: Star },
    { value: "urgence_communautaire", icon: Zap },
  ];

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  useEffect(() => {
    if (!association) return;
    fetchMembers({ limit: 100 });
  }, [association, fetchMembers]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleInputChange = <K extends keyof CreateExpenseForm>(
    field: K,
    value: CreateExpenseForm[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  const handleLoanTermsChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      loanTerms: {
        ...prev.loanTerms!,
        [field]: value,
      },
    }));
  };

  const handleBeneficiaryExternalChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      beneficiaryExternal: {
        ...prev.beneficiaryExternal!,
        [field]: value,
      },
    }));
  };

  const validateForm = (): boolean => {
    // Type de dépense
    if (!form.expenseType) {
      setError(t("create.errors.expenseTypeRequired"));
      toast.error(t("create.errors.expenseTypeRequired"));
      return false;
    }

    // Titre
    if (!form.title || form.title.length < 5 || form.title.length > 255) {
      setError(t("create.errors.titleLength"));
      toast.error(t("create.errors.titleLength"));
      return false;
    }

    // Description
    if (!form.description || form.description.length < 20 || form.description.length > 2000) {
      setError(t("create.errors.descriptionLength"));
      toast.error(t("create.errors.descriptionLength"));
      return false;
    }

    // Montant
    const amount = parseFloat(form.amountRequested);
    if (isNaN(amount) || amount < 0.01 || amount > 1000000) {
      setError(t("create.errors.amountInvalid"));
      toast.error(t("create.errors.amountInvalid"));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const payload: CreateExpensePayload = {
        expenseType: form.expenseType as ExpenseType,
        title: form.title.trim(),
        description: form.description.trim(),
        amountRequested: parseFloat(form.amountRequested),
        currency: association?.primaryCurrency || "XOF",
        urgencyLevel: form.urgencyLevel,
        isLoan: form.isLoan,
      };

      // Champs optionnels
      if (form.expenseSubtype) {
        payload.expenseSubtype = form.expenseSubtype.trim();
      }

      if (form.beneficiaryId) {
        payload.beneficiaryId = Number(form.beneficiaryId);
      }

      if (form.expectedImpact) {
        payload.expectedImpact = form.expectedImpact.trim();
      }

      if (form.beneficiaryExternal?.name) {
        payload.beneficiaryExternal = form.beneficiaryExternal;
      }

      if (form.isLoan && form.loanTerms) {
        payload.loanTerms = {
          durationMonths: Number(form.loanTerms.durationMonths) || 0,
          interestRate: Number(form.loanTerms.interestRate) || 0,
          repaymentSchedule: form.loanTerms.repaymentSchedule || "monthly",
        };
      }

      const response = await financesApi.createExpense(associationId, payload);

      if (response.success && response.data) {
        toast.success(t("success.created"));
        router.push(`/modules/associations/${associationId}/finances/${response.data.expense.id}`);
      }
    } catch (error: unknown) {
      console.error("Erreur création:", error);
      const apiError = error as { response?: { data?: { error?: string } } };
      const errorMessage = apiError.response?.data?.error || t("errors.loadFailed");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
              <p className="text-gray-600 mb-6">{t("errors.noPermission")}</p>
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
  // LOADING STATE
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-sm">
          <CardContent className="py-20">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tCommon("errors.notFound")}
              </h3>
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

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* ✅ HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/modules/associations/${associationId}/finances`)}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("create.title")}</h1>
            <p className="text-gray-600 mt-1">{association.name}</p>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ✅ FORMULAIRE */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type de dépense */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t("create.sections.expenseType")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expenseTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = form.expenseType === type.value;
                return (
                  <div
                    key={type.value}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleInputChange("expenseType", type.value)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-blue-100" : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isSelected ? "text-blue-600" : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {t(`expenseTypes.${type.value}`)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {t(`create.expenseTypeDescriptions.${type.value}`)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {form.expenseType && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("create.fields.subcategory")}
                </label>
                <Input
                  placeholder={t("create.placeholders.subcategory")}
                  value={form.expenseSubtype}
                  onChange={(e) => handleInputChange("expenseSubtype", e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations générales */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t("create.sections.generalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("create.fields.title")} <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder={t("create.placeholders.title")}
                value={form.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                minLength={5}
                maxLength={255}
              />
              <p className="text-xs text-gray-500 mt-1">
                {form.title.length}/255 {t("create.hints.minChars", { min: 5 })}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("create.fields.description")} <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder={t("create.placeholders.description")}
                value={form.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                required
                minLength={20}
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {form.description.length}/2000 {t("create.hints.minChars", { min: 20 })}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("create.fields.amount")} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1000000"
                  placeholder="0.00"
                  value={form.amountRequested}
                  onChange={(e) => handleInputChange("amountRequested", e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("create.hints.amountRange")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("create.fields.urgency")}
                </label>
                <Select value={form.urgencyLevel} onValueChange={(value) => handleInputChange("urgencyLevel", value as UrgencyLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("urgencyLevels.low")}</SelectItem>
                    <SelectItem value="normal">{t("urgencyLevels.normal")}</SelectItem>
                    <SelectItem value="high">{t("urgencyLevels.high")}</SelectItem>
                    <SelectItem value="critical">{t("urgencyLevels.critical")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bénéficiaire (si aide membre) */}
        {form.expenseType === "aide_membre" && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("create.sections.beneficiary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("create.fields.member")}
              </label>
              <Select value={form.beneficiaryId} onValueChange={(value) => handleInputChange("beneficiaryId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("create.placeholders.selectMember")} />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.userId?.toString() || ""}>
                      {member.user?.firstName} {member.user?.lastName} - {member.memberType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Bénéficiaire externe */}
        {(form.expenseType === "pret_partenariat" || form.expenseType === "projet_special") && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t("create.sections.externalBeneficiary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (form.beneficiaryExternal) {
                    handleInputChange("beneficiaryExternal", null);
                  } else {
                    handleInputChange("beneficiaryExternal", {
                      name: "",
                      contact: "",
                      organization: "",
                    });
                  }
                }}
              >
                {form.beneficiaryExternal
                  ? t("create.actions.removeExternal")
                  : t("create.actions.addExternal")}
              </Button>

              {form.beneficiaryExternal && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("create.fields.externalName")}
                    </label>
                    <Input
                      placeholder={t("create.placeholders.externalName")}
                      value={form.beneficiaryExternal.name}
                      onChange={(e) => handleBeneficiaryExternalChange("name", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("create.fields.externalContact")}
                    </label>
                    <Input
                      placeholder={t("create.placeholders.externalContact")}
                      value={form.beneficiaryExternal.contact}
                      onChange={(e) => handleBeneficiaryExternalChange("contact", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Conditions de prêt */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{t("create.sections.loanTerms")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLoan"
                checked={form.isLoan}
                onChange={(e) => {
                  const isLoan = e.target.checked;
                  handleInputChange("isLoan", isLoan);
                  if (isLoan && !form.loanTerms) {
                    handleInputChange("loanTerms", {
                      durationMonths: "",
                      interestRate: "0",
                      repaymentSchedule: "monthly",
                    });
                  } else if (!isLoan) {
                    handleInputChange("loanTerms", null);
                  }
                }}
                className="rounded border-gray-300"
              />
              <label htmlFor="isLoan" className="text-sm font-medium text-gray-700">
                {t("create.fields.isLoan")}
              </label>
            </div>

            {form.isLoan && form.loanTerms && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    {t("details.duration")}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="12"
                    value={form.loanTerms.durationMonths}
                    onChange={(e) => handleLoanTermsChange("durationMonths", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    {t("details.interestRate")}
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={form.loanTerms.interestRate}
                    onChange={(e) => handleLoanTermsChange("interestRate", e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("details.expectedImpact")}
              </label>
              <Textarea
                placeholder={t("create.placeholders.expectedImpact")}
                value={form.expectedImpact}
                onChange={(e) => handleInputChange("expectedImpact", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/modules/associations/${associationId}/finances`)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !form.expenseType ||
              !form.title ||
              !form.description ||
              !form.amountRequested
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {tCommon("saving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("create.actions.submit")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}