// src/app/modules/associations/[id]/sections/page.tsx
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import SectionsTab from "@/components/modules/associations/SectionsTab";
import { ArrowLeft, AlertCircle } from "lucide-react";

// ✅ CORRECT : Importer les hooks centralisés
import { useAssociation } from "@/hooks/association/useAssociation";

export default function SectionsPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("sections");
  const tCommon = useTranslations("common");
  
  const associationId = parseInt(params.id as string);

  // ✅ CORRECT : Utiliser le hook centralisé
  const { association, loading, error, refetch } = useAssociation(associationId);

  useEffect(() => {
    if (associationId && token) {
      refetch();
    }
  }, [associationId, token]);

  if (loading) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !association) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              {error?.message || t("loadError")}
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
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
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
              {t("pageTitle")} - {association.name}
            </h1>
            <p className="text-gray-600">{t("pageDescription")}</p>
          </div>
        </div>

        {/* Composant SectionsTab */}
        <SectionsTab association={association} token={token} />
      </div>
    </ProtectedRoute>
  );
}