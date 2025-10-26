// src/components/modules/associations/SectionsTab.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Building2,
  Plus,
  Users,
  MapPin,
  Trash2,
  AlertTriangle,
  Shield,
  UserCog,
} from "lucide-react";

// ✅ CORRECT : Importer les types centralisés
import type { Association } from "@/types/association/association";
import type { Section } from "@/types/association/section";

// ✅ CORRECT : Importer les hooks centralisés
import { useSections } from "@/hooks/association/useSections";

interface SectionsTabProps {
  association: Association;
  token: string | null;
}

export default function SectionsTab({ association, token }: SectionsTabProps) {
  const router = useRouter();
  const t = useTranslations("sections");
  
  // ✅ CORRECT : Utiliser le hook centralisé au lieu de fetch manuel
  const {
    sections,
    isLoading,
    error,
    fetchSections,
    deleteSection,
    clearError,
  } = useSections();

  useEffect(() => {
    if (association.isMultiSection && association.id) {
      fetchSections(association.id);
    }
  }, [association.id, association.isMultiSection]);

  const handleMigrateToMultiSection = async () => {
    if (!token || !association.id) return;

    if (!confirm(t("migrateConfirm"))) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${association.id}/migrate-to-multi-section`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Erreur migration:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!association.isMultiSection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("structureTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-blue-50 rounded-lg">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              {t("simpleAssociationTitle")}
            </h3>
            <p className="text-blue-700 text-sm mb-4">
              {t("simpleAssociationDescription")}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-yellow-800 font-medium">
                    {t("migrationWarningTitle")}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {t("migrationWarningDescription")}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={handleMigrateToMultiSection}
            >
              <Building2 className="h-4 w-4 mr-2" />
              {t("migrateToMultiSections")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t("managementTitle", {
                  count: sections.length,
                  max: association.features?.maxSections || 10,
                })}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {t("managementDescription")}
              </p>
            </div>
            {sections.length < (association.features?.maxSections || 10) && (
              <Button
                onClick={() =>
                  router.push(
                    `/modules/associations/${association.id}/sections/create`
                  )
                }
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("createSection")}
              </Button>
            )}
          </div>
        </CardHeader>

        {error && (
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="mt-2"
              >
                {t("dismiss")}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

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
                    `/modules/associations/${association.id}/settings?tab=roles`
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

      {/* Liste des sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            associationId={association.id}
            onDelete={() => deleteSection(association.id, section.id)}
            onNavigate={(path) => router.push(path)}
          />
        ))}

        {sections.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">{t("noSections")}</h3>
            <p className="text-sm mb-4">{t("noSectionsDescription")}</p>
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/modules/associations/${association.id}/sections/create`
                )
              }
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("createFirstSection")}
            </Button>
          </div>
        )}
      </div>

      {/* Statistiques globales */}
      {sections.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {sections.length}
                </div>
                <div className="text-sm text-gray-600">
                  {t("activeSections")}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {sections.reduce(
                    (total, section) => total + (section.membersCount || 0),
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">{t("totalMembers")}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {sections.filter((s) => s.status === "active").length}
                </div>
                <div className="text-sm text-gray-600">
                  {t("activeStatus")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== Composant SectionCard =====
interface SectionCardProps {
  section: Section;
  associationId: number;
  onDelete: () => Promise<void>;
  onNavigate: (path: string) => void;
}

function SectionCard({
  section,
  associationId,
  onDelete,
  onNavigate,
}: SectionCardProps) {
  const t = useTranslations("sections");

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm", { name: section.name }))) return;

    try {
      await onDelete();
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert(t("deleteError"));
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900">{section.name}</h3>
            <Badge
              variant="secondary"
              className={
                section.status === "active"
                  ? "bg-green-100 text-green-700 text-xs"
                  : "bg-gray-100 text-gray-700 text-xs"
              }
            >
              {t(`status.${section.status}`)}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {section.city && `${section.city}, `}
              {section.country}
            </span>
            <span>{section.currency}</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {section.membersCount || 0} {t("members")}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onNavigate(
                `/modules/associations/${associationId}/sections/${section.id}`
              )
            }
          >
            <Building2 className="h-3 w-3 mr-1" />
            {t("manage")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onNavigate(
                `/modules/associations/${associationId}/sections/${section.id}/members`
              )
            }
          >
            <Users className="h-3 w-3 mr-1" />
            {t("members")}
          </Button>
        </div>
      </div>
    </Card>
  );
}