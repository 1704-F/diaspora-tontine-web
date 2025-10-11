// src/app/modules/associations/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAssociation, usePermissions } from "@/hooks/association";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Building2,
  Users,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Crown,
  Euro,
  RefreshCw,
} from "lucide-react";

export default function AssociationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("associations");
  const tCommon = useTranslations("common");

  const associationId = parseInt(params.id as string);

  // 🔥 Hooks réutilisables - Plus de fetch manuel !
  const {
    association,
    currentMembership,
    stats,
    isAdmin,
    loading,
    error,
    refetch,
  } = useAssociation(associationId);

  const { canViewFinances, canManageMembers } = usePermissions(associationId);

  // 🎯 Fonctions helpers
  const isSetupComplete = (): boolean => {
    return !!(
      association?.rolesConfiguration?.roles &&
      association.rolesConfiguration.roles.length > 0
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">{t("status.active")}</Badge>;
      case "pending_validation":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            {t("status.pending")}
          </Badge>
        );
      case "suspended":
        return <Badge className="bg-red-100 text-red-700">{t("status.suspended")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDocumentStatus = (doc: { uploaded: boolean; validated: boolean }) => {
    if (doc.validated) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (doc.uploaded) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getRoleBadge = () => {
    if (!currentMembership) return null;

    if (currentMembership.isAdmin) {
      return (
        <Badge className="bg-amber-100 text-amber-700">
          <Crown className="h-3 w-3 mr-1" />
          {t("role.admin")}
        </Badge>
      );
    }

    // Afficher premier rôle assigné
    if (currentMembership.assignedRoles.length > 0) {
      const firstRole = association?.rolesConfiguration.roles.find(
        (r) => r.id === currentMembership.assignedRoles[0]
      );
      return <Badge variant="secondary">{firstRole?.name || t("role.member")}</Badge>;
    }

    return <Badge variant="secondary">{t("role.member")}</Badge>;
  };

  // 🎨 Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // 🚨 Error state
  if (error || !association) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{tCommon("error")}</h2>
        <p className="text-gray-600 mb-4">
          {error?.message || t("notFound")}
        </p>
        <Button onClick={() => router.back()}>{tCommon("back")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {association.name}
            </h1>
            <p className="text-gray-600">{association.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(association.status || "active")}
          {getRoleBadge()}
        </div>
      </div>

      {/* Bureau Central - Si rôles configurés */}
      {isSetupComplete() &&
        association.rolesConfiguration.roles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("configuredRoles")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {association.rolesConfiguration.roles.map((role) => (
                  <div
                    key={role.id}
                    className="text-center p-3 rounded-lg border"
                    style={{ borderColor: role.color }}
                  >
                    <div className="font-semibold text-gray-900">
                      {role.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {role.permissions.length} {t("permissions")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations générales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("generalInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("country")}
                </label>
                <p className="text-gray-900">{association.country}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("city")}
                </label>
                <p className="text-gray-900">{association.city}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("currency")}
                </label>
                <p className="text-gray-900 flex items-center gap-1">
                  <Euro className="h-4 w-4" />
                  {association.settings?.currency || "EUR"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {t("createdAt")}
                </label>
                <p className="text-gray-900">
                  {new Date(association.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("statistics")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {stats?.totalMembers || association.totalMembers}
              </div>
              <div className="text-sm text-gray-600">{t("totalMembers")}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats?.activeMembers || association.activeMembers}
              </div>
              <div className="text-sm text-gray-600">{t("activeMembers")}</div>
            </div>
            {stats?.totalBalance !== undefined && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalBalance.toFixed(2)}€
                </div>
                <div className="text-sm text-gray-600">{t("balance")}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Types de membres configurables */}
      {association.memberTypes &&
        Object.keys(association.memberTypes).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("memberTypes")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(association.memberTypes).map(([key, type]) => (
                  <div key={key} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{type.name}</h4>
                      {type.defaultRoles && type.defaultRoles.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {type.defaultRoles.length} {t("defaultRoles")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {canManageMembers && (
          <Button
            className="flex items-center gap-2"
            onClick={() =>
              router.push(`/modules/associations/${params.id}/members`)
            }
          >
            <Users className="h-4 w-4" />
            {t("viewMembers")}
          </Button>
        )}

        {canViewFinances && (
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() =>
              router.push(`/modules/associations/${params.id}/finances`)
            }
          >
            <Euro className="h-4 w-4" />
            {t("finances")}
          </Button>
        )}

        {isAdmin && (
          <>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() =>
                router.push(
                  `/modules/associations/${params.id}/settings/roles`
                )
              }
            >
              <Crown className="h-4 w-4" />
              {t("manageRoles")}
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() =>
                router.push(`/modules/associations/${params.id}/settings`)
              }
            >
              <Settings className="h-4 w-4" />
              {t("settings")}
            </Button>
          </>
        )}

        {/* Bouton refresh pour debug */}
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="border-blue-500 text-blue-600 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {tCommon("refresh")}
        </Button>
      </div>
    </div>
  );
}