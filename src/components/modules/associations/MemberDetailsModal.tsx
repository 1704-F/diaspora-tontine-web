// src/components/modules/associations/MemberDetailsModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  X,
  User,
  MapPin,
  Shield,
  Calendar,
  Phone,
  Mail,
  Crown,
  UserCheck,
  DollarSign,
  Clock,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Briefcase,
} from "lucide-react";

// ✅ IMPORTS TYPES
import type { AssociationMember } from "@/types/association/member";

// ✅ IMPORTS HOOKS
import { useAssociationMembers } from "@/hooks/association/useAssociationMembers";
import { useRoles } from "@/hooks/association/useRoles";

// ✅ IMPORT CURRENCIES
import { CURRENCIES } from "@/lib/constants/countries";

// ============================================
// INTERFACES
// ============================================

interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  associationId: number;
  primaryCurrency: string; // ✅ AJOUT
}

// ✅ Helper pour obtenir le symbole de la devise
const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  isOpen,
  onClose,
  memberId,
  associationId,
  primaryCurrency, // ✅ AJOUT
}) => {
  const t = useTranslations("memberDetails");
  const tCommon = useTranslations("common");

  // ✅ HOOKS
  const { getMemberById } = useAssociationMembers(associationId);
  const { roles } = useRoles(associationId);

  // ✅ ÉTATS
  const [member, setMember] = useState<AssociationMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // ============================================
  // CHARGEMENT DONNÉES
  // ============================================

  useEffect(() => {
    if (isOpen && memberId) {
      fetchMemberData();
    }
  }, [isOpen, memberId]);

  const fetchMemberData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const memberData = await getMemberById(memberId);

      if (memberData) {
        setMember(memberData);
      } else {
        setError(t("errors.notFound"));
      }
    } catch (err) {
      console.error("Erreur chargement membre:", err);
      setError(t("errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

 const getStatusBadge = (status: AssociationMember["status"]) => {
  const config = {
    active: { variant: "success" as const, icon: CheckCircle, label: t("status.active") },
    pending: { variant: "warning" as const, icon: Clock, label: t("status.pending") },
    inactive: { variant: "secondary" as const, icon: AlertCircle, label: t("status.inactive") },
    suspended: { variant: "danger" as const, icon: AlertCircle, label: t("status.suspended") }, // ✅
  };

    const statusConfig = config[status] || config.inactive;
    const Icon = statusConfig.icon;

    return (
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getRoleDetails = () => {
  if (!member?.assignedRoles || !roles) return [];
  return member.assignedRoles
    .map((roleId) => roles.find((r) => r.id === roleId))
    .filter((role): role is NonNullable<typeof role> => role !== undefined); // ✅ Type guard explicite
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // ============================================
  // RENDU LOADING
  // ============================================

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // ============================================
  // RENDU ERROR
  // ============================================

  if (error || !member) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-red-600">{t("errors.title")}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-gray-700">{error || t("errors.notFound")}</p>
          <Button onClick={onClose} className="mt-4 w-full">
            {tCommon("close")}
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDU PRINCIPAL
  // ============================================

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {member.user?.firstName} {member.user?.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(member.status)}
                {member.isAdmin && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    {t("admin")}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Informations personnelles */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("personalInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {member.user?.phoneNumber && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">{t("phone")}</p>
                    <p className="font-medium">{member.user.phoneNumber}</p>
                  </div>
                </div>
              )}

              {member.user?.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">{t("email")}</p>
                    <p className="font-medium">{member.user.email}</p>
                  </div>
                </div>
              )}

              {member.user?.dateOfBirth && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">{t("dateOfBirth")}</p>
                    <p className="font-medium">{formatDate(member.user.dateOfBirth)}</p>
                  </div>
                </div>
              )}

              {member.profession && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Briefcase className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">{t("profession")}</p>
                    <p className="font-medium">{member.profession}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Adresse */}
          {(member.user?.address || member.user?.city || member.user?.country) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("address")}
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  {member.user.address && <span>{member.user.address}<br /></span>}
                  {member.user.city && <span>{member.user.city}, </span>}
                  {member.user.country}
                </p>
              </div>
            </div>
          )}

          {/* Adhésion */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              {t("membershipInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {member.memberType && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t("memberType")}</p>
                  <p className="font-semibold text-gray-900">{member.memberType}</p>
                </div>
              )}

              {member.section && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t("section")}</p>
                  <p className="font-semibold text-gray-900">
                    {member.section.name} ({member.section.city})
                  </p>
                </div>
              )}

              {member.joinDate && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t("joinDate")}</p>
                  <p className="font-semibold text-gray-900">{formatDate(member.joinDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rôles */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("roles")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {getRoleDetails().length > 0 ? (
                getRoleDetails().map((role) => (
                  <Badge
                    key={role.id}
                    style={{
                      backgroundColor: role.color + "20",
                      color: role.color,
                      borderColor: role.color,
                    }}
                    className="border text-sm font-medium px-3 py-1"
                  >
                    {role.name}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500 text-sm">{t("noRoles")}</p>
              )}
            </div>
          </div>

          {/* Informations financières - ✅ CORRIGÉ */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("financialInfo")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-600 mb-1">{t("monthlyContribution")}</p>
                <p className="text-2xl font-bold text-green-700">
                  {member.cotisationAmount || 0} {getCurrencySymbol(primaryCurrency)}
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 mb-1">{t("totalContributed")}</p>
                <p className="text-2xl font-bold text-blue-700">
                  {member.totalContributed || 0} {getCurrencySymbol(primaryCurrency)}
                </p>
              </div>

              {member.lastContributionDate && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-600 mb-1">{t("lastPayment")}</p>
                  <p className="text-sm font-medium text-purple-700">
                    {formatDate(member.lastContributionDate)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Permissions custom (si présentes) */}
          {(member.customPermissions?.granted?.length || 0) > 0 ||
          (member.customPermissions?.revoked?.length || 0) > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("customPermissions")}
              </h3>
              <div className="space-y-3">
                {(member.customPermissions?.granted?.length || 0) > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-2">
                      {t("grantedPermissions")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.customPermissions.granted.map((perm) => (
                        <Badge key={perm} variant="success">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(member.customPermissions?.revoked?.length || 0) > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-2">
                      {t("revokedPermissions")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.customPermissions.revoked.map((perm) => (
                        <Badge key={perm} variant="danger">
  {perm}
</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Notes */}
          {member.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("notes")}
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{member.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
          <Button onClick={onClose}>{tCommon("close")}</Button>
        </div>
      </div>
    </div>
  );
};