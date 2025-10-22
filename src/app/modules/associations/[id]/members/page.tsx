// src/app/modules/associations/[id]/members/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EditMemberModal } from "@/components/modules/associations/EditMemberModal";
import { MemberDetailsModal } from "@/components/modules/associations/MemberDetailsModal";
import {
  ArrowLeft,
  Users,
  Search,
  UserPlus,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Phone,
  Shield,
  Crown,
  XCircle,
} from "lucide-react";

// ✅ IMPORTS TYPES
import type { AssociationMember } from "@/types/association/member";
import type { Association } from "@/types/association/association";

// ✅ IMPORTS HOOKS
import { useAssociation } from "@/hooks/association/useAssociation";
import { useAssociationMembers } from "@/hooks/association/useAssociationMembers";
import { usePermissions } from "@/hooks/association/usePermissions";

// ============================================
// INTERFACES LOCALES
// ============================================

interface MemberFilters {
  search: string;
  status: string;
  memberType: string;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("members");
  const tCommon = useTranslations("common");

  const associationId = parseInt(params.id as string);

  // ✅ HOOKS
  const {
    association,
    currentMembership,
    loading: assocLoading,
  } = useAssociation(associationId);
  const {
    membersWithRoleDetails,
    loading: membersLoading,
    fetchMembers,
  } = useAssociationMembers(associationId);
  const { hasPermission } = usePermissions(associationId);

  // ✅ ÉTATS LOCAUX
  const [filters, setFilters] = useState<MemberFilters>({
    search: "",
    status: "all",
    memberType: "all",
  });
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [viewingMember, setViewingMember] = useState<number | null>(null);

  // ✅ PERMISSIONS
  const canViewMembers = hasPermission("membres.view_list");
  const canManageMembers = hasPermission("membres.manage_members");
  const canViewDetails = hasPermission("membres.view_details");

  // ✅ LOADING GLOBAL
  const isLoading = assocLoading || membersLoading;

  // ============================================
  // FILTRAGE MEMBRES
  // ============================================

  const filteredMembers = useMemo(() => {
    return membersWithRoleDetails.filter((member) => {
      // Filtre recherche
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName =
          `${member.user?.firstName} ${member.user?.lastName}`.toLowerCase();
        const phone = member.user?.phoneNumber?.toLowerCase() || "";

        if (!fullName.includes(searchLower) && !phone.includes(searchLower)) {
          return false;
        }
      }

      // Filtre statut
      if (filters.status !== "all" && member.status !== filters.status) {
        return false;
      }

      // Filtre type de membre
      if (
        filters.memberType !== "all" &&
        member.memberType !== filters.memberType
      ) {
        return false;
      }

      return true;
    });
  }, [membersWithRoleDetails, filters]);

  // ============================================
  // STATISTIQUES
  // ============================================

  const stats = useMemo(() => {
    return {
      total: membersWithRoleDetails.length,
      active: membersWithRoleDetails.filter((m) => m.status === "active")
        .length,
      pending: membersWithRoleDetails.filter((m) => m.status === "pending")
        .length,
      admins: membersWithRoleDetails.filter((m) => m.isAdmin).length,
    };
  }, [membersWithRoleDetails]);

  // ============================================
  // OPTIONS FILTRES
  // ============================================

  const statusOptions = [
    { key: "all", label: t("filters.allStatuses") },
    { key: "active", label: t("filters.active") },
    { key: "pending", label: t("filters.pending") },
    { key: "suspended", label: t("filters.suspended") },
    { key: "inactive", label: t("filters.inactive") },
  ];

  const memberTypeOptions = useMemo(() => {
    if (!association?.memberTypes)
      return [{ key: "all", label: t("filters.allTypes") }];

    return [
      { key: "all", label: t("filters.allTypes") },
      ...association.memberTypes.map((type) => ({
        key: type.name,
        label: type.name,
      })),
    ];
  }, [association, t]);

  // ============================================
  // HELPERS BADGES
  // ============================================

  const getStatusBadge = (status: AssociationMember["status"]) => {
    const config = {
      active: {
        variant: "success" as const,
        icon: CheckCircle,
        label: t("status.active"),
      },
      pending: {
        variant: "warning" as const,
        icon: Clock,
        label: t("status.pending"),
      },
      suspended: {
        variant: "danger" as const,
        icon: XCircle,
        label: t("status.suspended"),
      },
      inactive: {
        variant: "secondary" as const,
        icon: AlertCircle,
        label: t("status.inactive"),
      },
    };

    const { variant, icon: Icon, label } = config[status] || config.inactive;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getRoleBadge = (role: { id: string; name: string; color: string }) => {
    return (
      <Badge
        key={role.id}
        style={{ backgroundColor: role.color + "20", color: role.color }}
        className="text-xs font-medium"
      >
        {role.name}
      </Badge>
    );
  };

  // ============================================
  // GESTION PERMISSIONS - ACCÈS REFUSÉ
  // ============================================

  if (!isLoading && !canViewMembers) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-7xl mx-auto p-6">
          <Card className="border-red-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t("errors.accessDenied")}
              </h2>
              <p className="text-gray-600 mb-4">{t("errors.noPermission")}</p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {tCommon("back")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
              <p className="text-gray-600">
                {association?.name} • {stats.total} {t("members")}
              </p>
            </div>
          </div>

          {canManageMembers && (
            <Button
              onClick={() =>
                router.push(
                  `/modules/associations/${associationId}/members/add`
                )
              }
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {t("addMember")}
            </Button>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600">
                {t("stats.totalMembers")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <div className="text-sm text-gray-600">
                {t("stats.activeMembers")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <div className="text-sm text-gray-600">
                {t("stats.pendingMembers")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {stats.admins}
              </div>
              <div className="text-sm text-gray-600">
                {t("stats.adminMembers")}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t("filters.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Recherche */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("filters.search")}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    placeholder={t("filters.searchPlaceholder")}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtre statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("filters.status")}
                </label>
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {statusOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre type membre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("filters.memberType")}
                </label>
                <select
                  value={filters.memberType}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      memberType: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {memberTypeOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Résultats filtres */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {filteredMembers.length} {t("filters.results")}
              </span>
              {(filters.search ||
                filters.status !== "all" ||
                filters.memberType !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilters({ search: "", status: "all", memberType: "all" })
                  }
                >
                  {t("filters.reset")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Liste des membres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("list.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{t("list.noMembers")}</p>
                <p className="text-sm">{t("list.noMembersHint")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        {t("table.name")}
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        {t("table.contact")}
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        {t("table.memberType")}
                      </th>
                      {association?.isMultiSection && (
                        <th className="text-left py-3 px-2 font-medium text-gray-900">
                          {t("table.section")}
                        </th>
                      )}
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        {t("table.status")}
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        {t("table.roles")}
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-900">
                        {t("table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        {/* Nom */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {member.user?.firstName} {member.user?.lastName}
                            </span>

                            {member.isAdmin && (
                              <span title={t("admin")}>
                                <Crown className="h-4 w-4 text-yellow-500" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 text-gray-600 text-sm">
                            <Phone className="h-3 w-3" />
                            {member.user?.phoneNumber || "N/A"}
                          </div>
                        </td>

                        {/* Type membre */}
                        <td className="py-3 px-2">
                          <span className="text-sm">
                            {member.memberType || "N/A"}
                          </span>
                        </td>

                        {/* Section (si multi-sections) */}
                        {association?.isMultiSection && (
                          <td className="py-3 px-2">
                            {member.section ? (
                              <span className="text-sm text-gray-600">
                                {member.section.name}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                        )}

                        {/* Statut */}
                        <td className="py-3 px-2">
                          {getStatusBadge(member.status)}
                        </td>

                        {/* Rôles */}
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {member.roleDetails &&
                            member.roleDetails.length > 0 ? (
                              member.roleDetails.map((role) =>
                                getRoleBadge(role)
                              )
                            ) : (
                              <span className="text-gray-400 text-sm">
                                {t("table.noRoles")}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {canViewDetails && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingMember(member.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}

                            {canManageMembers && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingMember(member.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modales */}
        {editingMember && (
          <EditMemberModal
            isOpen={!!editingMember}
            onClose={() => {
              setEditingMember(null);
              fetchMembers();
            }}
            associationId={associationId}
            memberId={editingMember}
          />
        )}

        {viewingMember && (
          <MemberDetailsModal
            isOpen={!!viewingMember}
            onClose={() => setViewingMember(null)}
            associationId={associationId}
            memberId={viewingMember}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
