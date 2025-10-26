// src/app/modules/associations/[id]/sections/[sectionId]/page.tsx
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Globe,
  DollarSign,
  Settings,
  Trash2,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Shield,
  UserCog,
} from "lucide-react";

// ✅ CORRECT : Importer les types centralisés
import type { Section } from "@/types/association/section";
import type { Association } from "@/types/association/association";

// ✅ CORRECT : Importer les hooks centralisés
import { useAssociation } from "@/hooks/association/useAssociation";
import { useSectionDetail } from "@/hooks/association/useSectionDetail";

export default function SectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("sections");
  const tCommon = useTranslations("common");

  const associationId = parseInt(params.id as string);
  const sectionId = parseInt(params.sectionId as string);

  // ✅ CORRECT : Utiliser les hooks centralisés
  const { association, loading: associationLoading } =
    useAssociation(associationId);
  const {
    section,
    stats,
    isLoading: sectionLoading,
    error,
    fetchSection,
    deleteSection,
  } = useSectionDetail(associationId);

  useEffect(() => {
    if (associationId && sectionId) {
      fetchSection(sectionId);
    }
  }, [associationId, sectionId]);

  const handleDeleteSection = async () => {
    if (!section) return;

    const confirmMessage =
      section.membersCount && section.membersCount > 0
        ? t("deleteConfirmWithMembers", { count: section.membersCount })
        : t("deleteConfirm", { name: section.name });

    if (!confirm(confirmMessage)) return;

    try {
      await deleteSection(sectionId);
      router.push(
        `/modules/associations/${associationId}/settings?tab=sections`
      );
    } catch (error) {
      console.error("Erreur suppression section:", error);
      alert(t("deleteError"));
    }
  };

  if (associationLoading || sectionLoading) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !section || !association) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              {error || t("notFound")}
            </h1>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tCommon("back")}
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
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
                {section.name}
              </h1>
              <p className="text-gray-600">{association.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={
                section.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }
            >
              {t(`status.${section.status}`)}
            </Badge>

            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 border-red-300"
              onClick={handleDeleteSection}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {tCommon("delete")}
            </Button>
          </div>
        </div>

        {/* Message RBAC */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  {t("rbacTitle")}
                </h4>
                <p className="text-sm text-blue-800 mb-3">
                  {t("rbacDescription")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() =>
                    router.push(
                      `/modules/associations/${associationId}/settings?tab=roles`
                    )
                  }
                >
                  <UserCog className="h-4 w-4 mr-1" />
                  {t("manageRoles")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    {t("location")}
                  </label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {section.city && `${section.city}, `}
                      {section.country}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {t("currency")}
                  </label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{section.currency}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {t("language")}
                  </label>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {section.language.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {t("createdAt")}
                  </label>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {section.created_at
                        ? new Date(section.created_at).toLocaleDateString(
                            "fr-FR"
                          )
                        : "Date non disponible"}
                    </span>
                  </div>
                </div>
              </div>

              {section.contactPhone && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    {t("contact")}
                  </label>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-900">
                        {section.contactPhone}
                      </span>
                    </div>
                    {section.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">
                          {section.contactEmail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("statistics")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {section.membersCount || 0}
                </div>
                <div className="text-sm text-gray-600">{t("totalMembers")}</div>
              </div>

              {stats?.activeMembers !== undefined && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {stats.activeMembers}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("activeMembers")}
                  </div>
                </div>
              )}

              {stats?.pendingMembers !== undefined &&
                stats.pendingMembers > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {stats.pendingMembers}
                    </div>
                    <div className="text-sm text-gray-600">
                      {t("pendingMembers")}
                    </div>
                  </div>
                )}

              {stats?.monthlyRevenue !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.monthlyRevenue}€
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("monthlyRevenue")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            className="flex items-center gap-2"
            onClick={() =>
              router.push(
                `/modules/associations/${associationId}/sections/${sectionId}/members`
              )
            }
          >
            <Users className="h-4 w-4" />
            {t("manageMembers", { count: section.membersCount || 0 })}
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() =>
              router.push(
                `/modules/associations/${associationId}/sections/${sectionId}/settings`
              )
            }
          >
            <Settings className="h-4 w-4" />
            {t("sectionSettings")}
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/modules/associations/${associationId}/settings?tab=sections`
              )
            }
          >
            {t("viewAllSections")}
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
