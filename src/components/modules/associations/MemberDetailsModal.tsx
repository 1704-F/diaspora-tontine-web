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
} from "lucide-react";

// ✅ IMPORTS TYPES
import type { AssociationMember } from "@/types/association/member";

// ✅ IMPORTS HOOKS
import { useAssociationMembers } from "@/hooks/association/useAssociationMembers";
import { useRoles } from "@/hooks/association/useRoles";

// ============================================
// INTERFACES
// ============================================

interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  associationId: number;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  isOpen,
  onClose,
  memberId,
  associationId,
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
      suspended: { variant: "danger" as const, icon: AlertCircle, label: t("status.suspended") },
      inactive: { variant: "secondary" as const, icon: AlertCircle, label: t("status.inactive") },
    };

    const { variant, icon: Icon, label } = config[status] || config.inactive;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getRoleDetails = () => {
    if (!member?.assignedRoles || member.assignedRoles.length === 0) {
      return [];
    }

    return member.assignedRoles
      .map((roleId) => roles.find((r) => r.id === roleId))
      .filter((r): r is NonNullable<typeof r> => r !== undefined);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateMembershipDuration = (joinDate: string) => {
    const start = new Date(joinDate);
    const now = new Date();
    const months = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0) {
      return `${years} an${years > 1 ? "s" : ""} ${remainingMonths > 0 ? `et ${remainingMonths} mois` : ""}`;
    }
    return `${months} mois`;
  };

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t("title")}
              </h2>
              {member && (
                <p className="text-sm text-gray-600">
                  {member.user?.firstName} {member.user?.lastName}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 font-medium">{error}</p>
              <Button variant="outline" onClick={onClose} className="mt-4">
                {tCommon("close")}
              </Button>
            </div>
          ) : member ? (
            <div className="space-y-6">
              {/* Statut & Admin */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusBadge(member.status)}
                  {member.isAdmin && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      {t("admin")}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {t("memberSince")} {calculateMembershipDuration(member.joinDate)}
                </div>
              </div>

              {/* Informations personnelles */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("personalInfo")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t("phone")}</p>
                      <p className="font-medium text-gray-900">
                        {member.user?.phoneNumber || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t("email")}</p>
                      <p className="font-medium text-gray-900">
                        {member.user?.email || t("notProvided")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <UserCheck className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t("memberType")}</p>
                      <p className="font-medium text-gray-900">
                        {member.memberType || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t("joinDate")}</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(member.joinDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section (si multi-sections) */}
              {member.section && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t("section")}
                  </h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-900">{member.section.name}</p>
                    <p className="text-sm text-blue-700">
                      {member.section.city}, {member.section.country}
                    </p>
                  </div>
                </div>
              )}

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

              {/* Informations financières */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("financialInfo")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-600 mb-1">{t("monthlyContribution")}</p>
                    <p className="text-2xl font-bold text-green-700">
                      {member.cotisationAmount || 0}€
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">{t("totalContributed")}</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {member.totalContributed || 0}€
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
                    {member.customPermissions?.granted &&
                      member.customPermissions.granted.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-medium text-green-900 mb-2">
                            {t("grantedPermissions")}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {member.customPermissions.granted.map((perm) => (
                              <Badge key={perm} variant="success" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {member.customPermissions?.revoked &&
                      member.customPermissions.revoked.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-900 mb-2">
                            {t("revokedPermissions")}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {member.customPermissions.revoked.map((perm) => (
                              <Badge key={perm} variant="danger" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            {tCommon("close")}
          </Button>
        </div>
      </div>
    </div>
  );
};