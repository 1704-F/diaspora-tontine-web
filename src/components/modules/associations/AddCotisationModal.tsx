// src/components/modules/associations/AddCotisationModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Save, Euro, CreditCard, Banknote, Wallet, Search } from "lucide-react";

// ✅ Imports types
import type { PaymentMethod } from "@/types/association/cotisation";
import type { AssociationMember } from "@/types/association/member";
import type { Association } from "@/types/association/association";

// ✅ Imports API
import { cotisationsApi } from "@/lib/api/association/cotisations";
import { CURRENCIES } from "@/lib/constants/countries";

// ✅ Imports hooks
import { useAssociationMembers } from "@/hooks/association/useAssociationMembers";

// ✅ Imports components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Avatar } from "@/components/ui/Avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface AddCotisationModalProps {
  open: boolean;
  onClose: () => void;
  associationId: number;
  onSuccess: () => void;
  primaryCurrency: string;
  association: Association;
}

export function AddCotisationModal({
  open,
  onClose,
  associationId,
  onSuccess,
  primaryCurrency,
  association,
}: AddCotisationModalProps) {
  const t = useTranslations("cotisations.addManual");
  const tCommon = useTranslations("common");
  const tMonths = useTranslations("cotisations.months");

  // ✅ Hook membres
  const {
    members: allMembers,
    loading: membersLoading,
    fetchMembers,
  } = useAssociationMembers(associationId);

  // ============================================
  // ÉTATS LOCAUX
  // ============================================
  const [filteredMembers, setFilteredMembers] = useState<AssociationMember[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Formulaire
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [reason, setReason] = useState<string>("");

  // Erreurs
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ============================================
  // CHARGEMENT MEMBRES
  // ============================================
  useEffect(() => {
    if (open) {
      fetchMembers({
        status: "active",
        limit: 1000,
      });
    } else {
      resetForm();
    }
  }, [open, fetchMembers]);

  // Filtrage membres
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMembers(allMembers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allMembers.filter((m) => {
      // ✅ Vérifier que user existe
      if (!m.user) return false;

      return (
        m.user.firstName.toLowerCase().includes(query) ||
        m.user.lastName.toLowerCase().includes(query) ||
        m.user.phoneNumber.includes(query)
      );
    });
    setFilteredMembers(filtered);
  }, [searchQuery, allMembers]);
  // ============================================
  // VALIDATION
  // ============================================
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedMemberId) {
      newErrors.member = t("errors.memberRequired");
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = t("errors.amountInvalid");
    }

    if (!month || month < 1 || month > 12) {
      newErrors.month = t("errors.monthInvalid");
    }

    const currentYear = new Date().getFullYear();
    if (!year || year < 2020 || year > currentYear + 1) {
      newErrors.year = t("errors.yearInvalid");
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = t("errors.paymentMethodRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setErrors({});

      const selectedMember = allMembers.find(
        (m) => m.id.toString() === selectedMemberId
      );

      await cotisationsApi.addManualCotisation(associationId, {
        memberId: parseInt(selectedMemberId),
        amount: parseFloat(amount),
        month,
        year,
        reason: reason.trim() || undefined,
        paymentMethod,
      });

      const monthName = getMonthName(month);

      // ✅ Vérifier que selectedMember et user existent
      const memberName = selectedMember?.user
        ? `${selectedMember.user.firstName} ${selectedMember.user.lastName}`
        : "Membre";

      toast.success(t("success"), {
        description: `${memberName} - ${amount} ${getCurrencySymbol(primaryCurrency)} (${monthName} ${year})`,
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("❌ Erreur ajout cotisation:", error);

      const apiError = error as {
        response?: { data?: { code?: string; message?: string } };
      };

      if (apiError.response?.data?.code === "COTISATION_ALREADY_EXISTS") {
        toast.error(t("errors.alreadyExists"));
      } else {
        toast.error(t("errors.submitFailed"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedMemberId("");
    setAmount("");
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setPaymentMethod("cash");
    setReason("");
    setSearchQuery("");
    setErrors({});
  };

  const handleMemberChange = (memberId: string) => {
    setSelectedMemberId(memberId);

    // ✅ Récupérer le membre sélectionné
    const selectedMember = allMembers.find((m) => m.id.toString() === memberId);

    if (selectedMember && selectedMember.memberType) {
      // ✅ Trouver le montant de cotisation pour ce type de membre
      const memberTypeConfig = association?.memberTypes?.find(
        (mt) => mt.name === selectedMember.memberType
      );

      // ✅ Remplir automatiquement le montant
      if (memberTypeConfig && memberTypeConfig.cotisationAmount) {
        setAmount(memberTypeConfig.cotisationAmount.toString());
      }
    }

    // Clear error
    if (errors.member) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.member;
        return newErrors;
      });
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = CURRENCIES.find((c) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const getMonthName = (monthNum: number): string => {
    const monthKeys = [
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
    ];
    return tMonths(monthKeys[monthNum - 1]);
  };

  const getPaymentMethodIcon = (method: string) => {
    if (!method) return null;

    const icons: Record<string, React.ReactNode> = {
      card: <CreditCard className="h-4 w-4" />,
      bank_transfer: <Banknote className="h-4 w-4" />,
      cash: <Euro className="h-4 w-4" />,
      mobile_money: <Wallet className="h-4 w-4" />,
    };

    return icons[method] || null;
  };

  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      card: "Carte bancaire",
      bank_transfer: "Virement",
      cash: "Espèces",
      mobile_money: "Mobile Money",
    };
    return labels[method] || method;
  };

  // Générer années (année actuelle ± 1 an)
  const years = Array.from(
    { length: 3 },
    (_, i) => new Date().getFullYear() - 1 + i
  );

  const selectedMember = allMembers.find(
    (m) => m.id.toString() === selectedMemberId
  );

  // ============================================
  // RENDU
  // ============================================
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        style={{
          left: "calc(40% + 1rem)",
          top: "52%",
          transform: "translate(-50%, -50%)", // ✅ Force le transform complet
        }}
      >
        <DialogHeader className="px-6 pt-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        {membersLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6 px-6 pb-2">
            {/* ✅ SÉLECTION MEMBRE */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                {t("selectMember")} <span className="text-red-500">*</span>
              </label>

              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Liste membres */}
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto p-2 bg-gray-50">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? "Aucun membre trouvé" : "Aucun membre actif"}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredMembers.map((member) => {
                      if (!member.user) return null;

                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() =>
                            handleMemberChange(member.id.toString())
                          }
                          className={`w-full p-4 flex items-center gap-3 transition-all text-left border-2 rounded-lg mb-2 ${
                            selectedMemberId === member.id.toString()
                              ? "bg-primary/10 border-primary shadow-md ring-2 ring-primary/20"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <Avatar
                            firstName={member.user.firstName}
                            lastName={member.user.lastName}
                            imageUrl={member.user.profilePicture || undefined}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate text-base">
                              {member.user.firstName} {member.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                              <span>{member.user.phoneNumber}</span>
                              {member.section && (
                                <>
                                  <span>•</span>
                                  <span>{member.section.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-600 mb-1">
                              {member.memberType}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {errors.member && (
                <p className="text-sm text-red-600">{errors.member}</p>
              )}
            </div>

            {/* ✅ MONTANT AUTO-REMPLI */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                {t("amount")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  readOnly // ✅ BLOQUÉ - ne peut pas être modifié
                  className={`pr-20 text-base bg-gray-50 cursor-not-allowed ${errors.amount ? "border-red-500" : ""}`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">
                  {getCurrencySymbol(primaryCurrency)}
                </div>
              </div>
              {selectedMemberId && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  💡 {t("amountAutoFilled")}
                </p>
              )}
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* ✅ PÉRIODE */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  {t("month")} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={month.toString()}
                  onValueChange={(value) => setMonth(parseInt(value))}
                >
                  <SelectTrigger className="text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {getMonthName(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.month && (
                  <p className="text-sm text-red-600">{errors.month}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  {t("year")} <span className="text-red-500">*</span>
                </label>
                <Select
                  value={year.toString()}
                  onValueChange={(value) => setYear(parseInt(value))}
                >
                  <SelectTrigger className="text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.year && (
                  <p className="text-sm text-red-600">{errors.year}</p>
                )}
              </div>
            </div>

            {/* ✅ MODE PAIEMENT */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                {t("paymentMethod")} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-3">
                {["card", "bank_transfer", "cash", "mobile_money"].map(
                  (method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method as PaymentMethod)}
                      className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                        paymentMethod === method
                          ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30 scale-105"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                      }`}
                    >
                      <div
                        className={`${paymentMethod === method ? "text-primary" : "text-gray-700"}`}
                      >
                        {getPaymentMethodIcon(method)}
                      </div>
                      <span
                        className={`text-sm font-medium text-center ${
                          paymentMethod === method
                            ? "text-primary font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {getPaymentMethodLabel(method)}
                      </span>
                    </button>
                  )
                )}
              </div>
              {errors.paymentMethod && (
                <p className="text-sm text-red-600">{errors.paymentMethod}</p>
              )}
            </div>

            {/* ✅ RAISON (OPTIONNEL) */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                {t("reason")}
              </label>
              <textarea
                placeholder="Ex: Cotisation manuelle suite à paiement en espèces..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-base"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-3 pt-4 px-6 pb-6 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={membersLoading || submitting}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {tCommon("saving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t("submit")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
