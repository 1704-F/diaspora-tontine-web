// src/app/modules/associations/[id]/sections/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import SectionsTab from "@/components/modules/associations/SectionsTab";
import { ArrowLeft } from "lucide-react";

export default function SectionsPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const associationId = params.id as string;

  const [association, setAssociation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchAssociation();
  }, [associationId, token]);

  const fetchAssociation = async () => {
    if (!associationId || !token) return;

    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAssociation(result.data.association);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erreur de chargement");
      }
    } catch (error) {
      console.error("Erreur chargement association:", error);
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
            <Button onClick={() => router.back()}>Retour</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!association) return null;

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header simple */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sections - {association.name}
            </h1>
            <p className="text-gray-600">
              Gestion des sections géographiques
            </p>
          </div>
        </div>

        {/* Composant SectionsTab réutilisé */}
        <SectionsTab association={association} token={token} />
      </div>
    </ProtectedRoute>
  );
}