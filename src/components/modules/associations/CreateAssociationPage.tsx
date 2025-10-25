// src/components/modules/associations/CreateAssociationPage.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Users,
  Building2,
  Info,
  Shield,
  X,
  FileText,
  Globe,
  Upload,
  UserCog,
} from "lucide-react";

import { useAuthStore } from "@/stores/authStore";
import { associationsApi } from "@/lib/api/association/associations";
import { rolesApi } from "@/lib/api/association/roles";
import { toast } from "sonner";

// ============================================
// IMPORTS TYPES
// ============================================
import type { CreateRolePayload, Permission } from "@/types/association/role";
import type { MemberTypeConfig, AdminStatusFormData } from "@/types/association/member";

// ============================================
// INTERFACES LOCALES (spécifiques au formulaire)
// ============================================

interface RoleFormData extends Omit<CreateRolePayload, "permissions"> {
  permissions: string[];
  isUnique?: boolean;
  isRequired?: boolean;
}

interface FormData {
  // Étape 1: Informations de base
  name: string;
  description: string;
  legalStatus: string;
  domiciliationCountry: string;
  domiciliationCity: string;
  registrationNumber: string;
  isMultiSection: boolean;
  currency: string;

  // Étape 2: Statut administrateur
  adminStatus: AdminStatusFormData;

  // Étape 3: Rôles (skippée si admin externe)
  roles: RoleFormData[];

  // Étape 4: Types de membres (skippée si admin externe)
  memberTypes: MemberTypeConfig[];

  // Étape 5: Documents
  documents: Record<string, File | null>;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

// ============================================
// CONSTANTES
// ============================================

const PRESET_COLORS = [
  { value: "#3B82F6", label: "blue" },
  { value: "#8B5CF6", label: "violet" },
  { value: "#EC4899", label: "rose" },
  { value: "#EF4444", label: "red" },
  { value: "#F59E0B", label: "orange" },
  { value: "#10B981", label: "green" },
  { value: "#06B6D4", label: "cyan" },
  { value: "#6366F1", label: "indigo" },
];

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  FR: "France",
  BE: "Belgique",
  SN: "Sénégal",
  IT: "Italie",
  ES: "Espagne",
  US: "États-Unis",
  CA: "Canada",
};

const AVAILABLE_PERMISSIONS: Permission[] = [
  {
    id: "finances.view_treasury",
    name: "Voir la trésorerie",
    category: "finances",
    description: "Consulter le solde et l'historique des transactions",
  },
  {
    id: "finances.manage_budgets",
    name: "Gérer les budgets",
    category: "finances",
    description: "Créer et modifier les budgets de l'association",
  },
  {
    id: "finances.validate_expenses",
    name: "Valider les dépenses",
    category: "finances",
    description: "Approuver ou refuser les demandes de dépenses",
  },
  {
    id: "finances.create_income",
    name: "Créer des recettes",
    category: "finances",
    description: "Enregistrer les revenus de l'association",
  },
  {
    id: "finances.export_data",
    name: "Exporter les données financières",
    category: "finances",
    description: "Télécharger les rapports financiers en Excel/PDF",
  },
  {
    id: "membres.view_list",
    name: "Voir la liste des membres",
    category: "membres",
    description: "Accéder à la liste complète des membres",
  },
  {
    id: "membres.manage_members",
    name: "Gérer les membres",
    category: "membres",
    description: "Ajouter, modifier ou supprimer des membres",
  },
  {
    id: "membres.approve_members",
    name: "Approuver les membres",
    category: "membres",
    description: "Valider les demandes d'adhésion",
  },
  {
    id: "membres.view_details",
    name: "Voir les détails des membres",
    category: "membres",
    description: "Accéder aux informations personnelles des membres",
  },
  {
    id: "administration.manage_roles",
    name: "Gérer les rôles",
    category: "administration",
    description: "Créer et modifier les rôles et permissions",
  },
  {
    id: "administration.modify_settings",
    name: "Modifier les paramètres",
    category: "administration",
    description: "Changer les paramètres de l'association",
  },
  {
    id: "administration.view_reports",
    name: "Voir les rapports",
    category: "administration",
    description: "Accéder aux rapports d'activité",
  },
  {
    id: "administration.manage_sections",
    name: "Gérer les sections",
    category: "administration",
    description: "Créer et administrer les sections géographiques",
  },
  {
    id: "documents.upload",
    name: "Télécharger des documents",
    category: "documents",
    description: "Ajouter des documents à l'association",
  },
  {
    id: "documents.manage",
    name: "Gérer les documents",
    category: "documents",
    description: "Modifier ou supprimer des documents",
  },
  {
    id: "documents.validate",
    name: "Valider les documents",
    category: "documents",
    description: "Approuver les documents officiels",
  },
  {
    id: "evenements.create",
    name: "Créer des événements",
    category: "evenements",
    description: "Organiser des événements pour l'association",
  },
  {
    id: "evenements.manage",
    name: "Gérer les événements",
    category: "evenements",
    description: "Modifier ou annuler des événements",
  },
  {
    id: "evenements.view_attendance",
    name: "Voir les présences",
    category: "evenements",
    description: "Consulter les listes de présence aux événements",
  },
];

const CURRENCIES = [
  { code: "EUR", label: "€ Euro", countries: ["FR", "BE", "IT", "ES"] },
  { code: "USD", label: "$ Dollar US", countries: ["US"] },
  { code: "CAD", label: "$ Dollar Canadien", countries: ["CA"] },
  { code: "XOF", label: "CFA Franc", countries: ["SN", "ML", "CI", "TG"] },
  { code: "GBP", label: "£ Livre Sterling", countries: ["GB"] },
];

const GROUPED_PERMISSIONS = AVAILABLE_PERMISSIONS.reduce(
  (acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  },
  {} as Record<string, Permission[]>
);

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function CreateAssociationPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const t = useTranslations("createAssociation");

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    legalStatus: "association_1901",
    domiciliationCountry: "FR",
    domiciliationCity: "",
    registrationNumber: "",
    isMultiSection: false,
    currency: "EUR",
    adminStatus: {
      isMember: true,
      memberType: "",
      assignedRoles: [],
    },
    roles: [],
    memberTypes: [],
    documents: {
      statuts: null,
      receipisse: null,
      rib: null,
      pv_creation: null,
    },
  });

  // ============================================
  // VALIDATION
  // ============================================

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = t("basicInfo.nameRequired");
        if (!formData.domiciliationCountry) newErrors.country = t("basicInfo.countryRequired");
        if (!formData.domiciliationCity.trim()) newErrors.city = t("basicInfo.cityRequired");
        if (!formData.currency) newErrors.currency = t("basicInfo.currencyRequired");
        break;

      case 2:
     
        break;

      case 3:
        // Validation des rôles (seulement si admin membre)
        if (formData.adminStatus.isMember && formData.roles.length === 0) {
          newErrors.roles = t("validation.atLeastOneRole");
        }
        break;

      case 4:
        // Validation des types de membres (seulement si admin membre)
        if (formData.adminStatus.isMember && formData.memberTypes.length === 0) {
          newErrors.memberTypes = t("validation.atLeastOneMemberType");
        }
        break;

      case 5:
        // Documents optionnels - pas de validation
        break;

      case 6:
        // Finalisation - validation globale
        if (!formData.name.trim()) newErrors.name = t("basicInfo.nameRequired");
        if (formData.adminStatus.isMember) {
          if (formData.roles.length === 0) newErrors.roles = t("validation.atLeastOneRole");
          if (formData.memberTypes.length === 0) newErrors.memberTypes = t("validation.atLeastOneMemberType");
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // NAVIGATION
  // ============================================

  const getNextStep = (current: Step): Step => {
    // Si admin externe, on saute les étapes 3 et 4
    if (!formData.adminStatus.isMember) {
      if (current === 2) return 5 as Step; // Sauter directement aux documents
      if (current === 5) return 6 as Step;
    }
    
    // Navigation normale pour admin membre
    if (current < 6) return (current + 1) as Step;
    return current;
  };

  const getPreviousStep = (current: Step): Step => {
    // Si admin externe, on saute les étapes 3 et 4 dans l'autre sens
    if (!formData.adminStatus.isMember) {
      if (current === 5) return 2 as Step; // Revenir au statut admin
      if (current === 6) return 5 as Step;
    }
    
    // Navigation normale pour admin membre
    if (current > 1) return (current - 1) as Step;
    return current;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(getNextStep(currentStep));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(getPreviousStep(currentStep));
  };

  // ============================================
  // GESTION RÔLES
  // ============================================

  const addRole = () => {
    setFormData((prev) => ({
      ...prev,
      roles: [
        ...prev.roles,
        {
          name: "",
          description: "",
          permissions: [],
          color: PRESET_COLORS[prev.roles.length % PRESET_COLORS.length].value,
          iconName: "shield",
          isUnique: false,
          isRequired: false,
        },
      ],
    }));
  };

  const updateRole = (index: number, field: keyof RoleFormData, value: string | string[] | boolean) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) =>
        i === index ? { ...role, [field]: value } : role
      ),
    }));
  };

  const deleteRole = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index),
    }));
  };

  const togglePermission = (roleIndex: number, permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) => {
        if (i === roleIndex) {
          const newPermissions = role.permissions.includes(permissionId)
            ? role.permissions.filter((p) => p !== permissionId)
            : [...role.permissions, permissionId];
          return { ...role, permissions: newPermissions };
        }
        return role;
      }),
    }));
  };

  const toggleAllPermissions = (roleIndex: number, category: string, select: boolean) => {
    const categoryPermissions = GROUPED_PERMISSIONS[category].map((p) => p.id);

    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) => {
        if (i === roleIndex) {
          const otherPermissions = role.permissions.filter(
            (p) => !categoryPermissions.includes(p)
          );
          return {
            ...role,
            permissions: select
              ? [...otherPermissions, ...categoryPermissions]
              : otherPermissions,
          };
        }
        return role;
      }),
    }));
  };

  // ============================================
  // GESTION TYPES DE MEMBRES
  // ============================================

  const addMemberType = () => {
    setFormData((prev) => ({
      ...prev,
      memberTypes: [
        ...prev.memberTypes,
        {
          name: "",
          cotisationAmount: 0,
          description: "",
        },
      ],
    }));
  };

  const updateMemberType = (index: number, field: keyof MemberTypeConfig, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      memberTypes: prev.memberTypes.map((type, i) =>
        i === index ? { ...type, [field]: value } : type
      ),
    }));
  };

  const deleteMemberType = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      memberTypes: prev.memberTypes.filter((_, i) => i !== index),
    }));
  };

  // ============================================
  // GESTION DOCUMENTS
  // ============================================

  const handleDocumentChange = (type: string, file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [type]: file,
      },
    }));
  };

  // ============================================
  // GESTION RÔLES ADMIN (multi-sélection)
  // ============================================

  const toggleAdminRole = (roleIndex: string) => {
    setFormData((prev) => ({
      ...prev,
      adminStatus: {
        ...prev.adminStatus,
        assignedRoles: prev.adminStatus.assignedRoles.includes(roleIndex)
          ? prev.adminStatus.assignedRoles.filter((r) => r !== roleIndex)
          : [...prev.adminStatus.assignedRoles, roleIndex],
      },
    }));
  };

  // ============================================
  // SOUMISSION
  // ============================================

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);

    try {
      // 1️⃣ Créer l'association
      const createResponse = await associationsApi.create({
        name: formData.name,
        description: formData.description,
        legalStatus: formData.legalStatus,
        domiciliationCountry:
          COUNTRY_CODE_TO_NAME[formData.domiciliationCountry] ||
          formData.domiciliationCountry,
        domiciliationCity: formData.domiciliationCity,
        registrationNumber: formData.registrationNumber || undefined,
        primaryCurrency: formData.currency,
        settings: {
          isMultiSection: formData.isMultiSection,
        },
      });

      if (!createResponse.success) {
        throw new Error(t("errors.createFailed"));
      }

      const associationId = createResponse.data.association.id;

      // 2️⃣ Si admin membre : créer les rôles
      const createdRoles: Array<{ tempId: string; realId: string }> = [];

      if (formData.adminStatus.isMember) {
        for (const role of formData.roles) {
          const roleResponse = await rolesApi.create(associationId, {
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            color: role.color,
            iconName: role.iconName,
            isUnique: role.isUnique || false,
            isRequired: role.isRequired || false,
          });

          if (roleResponse.success) {
            const tempId = formData.roles.indexOf(role).toString();
            createdRoles.push({
              tempId,
              realId: roleResponse.data.role.id,
            });
          }
        }

        // 3️⃣ Configurer les types de membres
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberTypes: formData.memberTypes,
            }),
          }
        );

        // 4️⃣ Ajouter l'admin comme membre
        const adminRoleIds = formData.adminStatus.assignedRoles.map((tempId) => {
          const mapping = createdRoles.find((r) => r.tempId === tempId);
          return mapping?.realId || tempId;
        });

        const memberType = formData.memberTypes.find(
          (t) => t.name === formData.adminStatus.memberType
        );

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              memberType: formData.adminStatus.memberType,
              assignedRoles: adminRoleIds,
              cotisationAmount: memberType?.cotisationAmount || 0,
              status: "active",
            }),
          }
        );
      }

      // 5️⃣ Upload documents (si présents)
      if (Object.values(formData.documents).some((doc) => doc !== null)) {
        for (const [type, file] of Object.entries(formData.documents)) {
          if (file) {
            const formDataDoc = new FormData();
            formDataDoc.append("document", file);
            formDataDoc.append("type", type);

            await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/documents`,
              {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formDataDoc,
              }
            );
          }
        }
      }

      toast.success(t("success.created"), {
        description: t("success.redirecting"),
      });

      setTimeout(() => {
        router.push(`/modules/associations/${associationId}`);
      }, 1000);
    } catch (error) {
      console.error("❌ Erreur création association:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("errors.createFailed");
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const steps = [
    { id: 1, label: t("steps.basic"), icon: Building2 },
    { id: 2, label: t("steps.adminStatus"), icon: UserCog },
    { id: 3, label: t("steps.roles"), icon: Shield },
    { id: 4, label: t("steps.memberTypes"), icon: Users },
    { id: 5, label: t("steps.documents"), icon: FileText },
    { id: 6, label: t("steps.finalization"), icon: Check },
  ];

  // Filtrer les étapes à afficher selon le statut admin
  const visibleSteps = formData.adminStatus.isMember
    ? steps
    : steps.filter((s) => s.id !== 3 && s.id !== 4);

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
            {t("backButton")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-600">{t("subtitle")}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between overflow-x-auto">
          {visibleSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center flex-1 min-w-0">
                <div
                  className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full justify-center
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-600"
                      : isCompleted
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-50 text-gray-400"
                  }
                `}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {step.label}
                  </span>
                </div>

                {index < visibleSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-2 text-gray-300 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Formulaire */}
        <Card>
          <CardContent className="pt-6">
            {/* ÉTAPE 1: Informations de base */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{t("basicInfo.title")}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("basicInfo.name")} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder={t("basicInfo.namePlaceholder")}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("basicInfo.description")}
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder={t("basicInfo.descriptionPlaceholder")}
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("basicInfo.legalStatus")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formData.legalStatus}
                        onChange={(e) =>
                          setFormData({ ...formData, legalStatus: e.target.value })
                        }
                      >
                        <option value="association_1901">
                          {t("legalStatus.association_1901")}
                        </option>
                        <option value="asbl">{t("legalStatus.asbl")}</option>
                        <option value="nonprofit_501c3">
                          {t("legalStatus.nonprofit_501c3")}
                        </option>
                        <option value="other">{t("legalStatus.other")}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("basicInfo.currency")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formData.currency}
                        onChange={(e) =>
                          setFormData({ ...formData, currency: e.target.value })
                        }
                      >
                        {CURRENCIES.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.label}
                          </option>
                        ))}
                      </select>
                      {errors.currency && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.currency}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("basicInfo.country")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={formData.domiciliationCountry}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            domiciliationCountry: e.target.value,
                          })
                        }
                      >
                        {Object.keys(COUNTRY_CODE_TO_NAME).map((code) => (
                          <option key={code} value={code}>
                            {t(`countries.${code}`)}
                          </option>
                        ))}
                      </select>
                      {errors.country && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.country}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t("basicInfo.city")}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.domiciliationCity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            domiciliationCity: e.target.value,
                          })
                        }
                        placeholder={t("basicInfo.cityPlaceholder")}
                      />
                      {errors.city && (
                        <p className="text-sm text-red-600 mt-1">{errors.city}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t("basicInfo.registrationNumber")}
                    </label>
                    <Input
                      value={formData.registrationNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationNumber: e.target.value,
                        })
                      }
                      placeholder={t("basicInfo.registrationNumberPlaceholder")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("structure.title")}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card
                        className={`p-4 cursor-pointer transition-all ${
                          !formData.isMultiSection
                            ? "border-2 border-primary-500 bg-primary-50"
                            : "border border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, isMultiSection: false })
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">
                              {t("structure.simple.title")}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {t("structure.simple.description")}
                            </p>
                          </div>
                          <Badge variant="default">
                            {t("structure.simple.badge")}
                          </Badge>
                        </div>
                      </Card>

                      <Card
                        className={`p-4 cursor-pointer transition-all ${
                          formData.isMultiSection
                            ? "border-2 border-primary-500 bg-primary-50"
                            : "border border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData({ ...formData, isMultiSection: true })
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">
                              {t("structure.multiSection.title")}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {t("structure.multiSection.description")}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {t("structure.multiSection.badge")}
                          </Badge>
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2: Statut administrateur */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">
                    {t("adminStatus.title")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("adminStatus.subtitle")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      {t("adminStatus.question")}
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card
                        className={`p-4 cursor-pointer transition-all ${
                          formData.adminStatus.isMember
                            ? "border-2 border-primary-500 bg-primary-50"
                            : "border border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            adminStatus: {
                              ...formData.adminStatus,
                              isMember: true,
                            },
                          })
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                              formData.adminStatus.isMember
                                ? "border-primary-500 bg-primary-500"
                                : "border-gray-300"
                            }`}
                          >
                            {formData.adminStatus.isMember && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {t("adminStatus.yesMember")}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {t("adminStatus.yesMemberDesc")}
                            </p>
                          </div>
                        </div>
                      </Card>

                      <Card
                        className={`p-4 cursor-pointer transition-all ${
                          !formData.adminStatus.isMember
                            ? "border-2 border-primary-500 bg-primary-50"
                            : "border border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            adminStatus: {
                              isMember: false,
                              memberType: "",
                              assignedRoles: [],
                            },
                          })
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                              !formData.adminStatus.isMember
                                ? "border-primary-500 bg-primary-500"
                                : "border-gray-300"
                            }`}
                          >
                            {!formData.adminStatus.isMember && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">
                              {t("adminStatus.noMember")}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {t("adminStatus.noMemberDesc")}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {formData.adminStatus.isMember && formData.roles.length > 0 && formData.memberTypes.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                      <h4 className="font-medium text-blue-900">
                        {t("adminStatus.configureProfile")}
                      </h4>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t("adminStatus.selectMemberType")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          value={formData.adminStatus.memberType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              adminStatus: {
                                ...formData.adminStatus,
                                memberType: e.target.value,
                              },
                            })
                          }
                        >
                          <option value="">
                            {t("adminStatus.selectMemberTypePlaceholder")}
                          </option>
                          {formData.memberTypes.map((type, index) => (
                            <option key={index} value={type.name}>
                              {type.name} ({type.cotisationAmount}€/mois)
                            </option>
                          ))}
                        </select>
                        {errors.memberType && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.memberType}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t("adminStatus.selectRoles")}{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-600 mb-2">
                          {t("adminStatus.multiRolesInfo")}
                        </p>

                        <div className="space-y-2">
                          {formData.roles.map((role, index) => (
                            <label
                              key={index}
                              className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.adminStatus.assignedRoles.includes(
                                  index.toString()
                                )}
                                onChange={() => toggleAdminRole(index.toString())}
                                className="rounded"
                              />
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              <span className="text-sm">{role.name}</span>
                            </label>
                          ))}
                        </div>
                        {errors.roles && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.roles}
                          </p>
                        )}
                      </div>

                      {formData.adminStatus.memberType &&
                        formData.adminStatus.assignedRoles.length > 0 && (
                          <div className="mt-3 p-3 bg-white border border-blue-300 rounded text-sm">
                            <p className="font-medium text-blue-900 mb-1">
                              {t("adminStatus.summary")}
                            </p>
                            <p className="text-gray-700">
                              {t("adminStatus.summaryText", {
                                memberType: formData.adminStatus.memberType,
                                roles: formData.adminStatus.assignedRoles
                                  .map((idx) => formData.roles[parseInt(idx)]?.name)
                                  .join(", "),
                              })}
                            </p>
                          </div>
                        )}
                    </div>
                  )}

                  {!formData.adminStatus.isMember && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-700">
                          <p className="font-medium">
                            {t("adminStatus.externalAdminInfo")}
                          </p>
                          <ul className="mt-2 space-y-1 list-disc list-inside">
                            <li>{t("adminStatus.externalAdminPoint1")}</li>
                            <li>{t("adminStatus.externalAdminPoint2")}</li>
                            <li>{t("adminStatus.externalAdminPoint3")}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ÉTAPE 3: Rôles (seulement si admin membre) */}
            {currentStep === 3 && formData.adminStatus.isMember && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{t("roles.title")}</h3>
                    <p className="text-sm text-gray-600">{t("roles.subtitle")}</p>
                  </div>
                  <Button onClick={addRole} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {t("roles.addRole")}
                  </Button>
                </div>

                {formData.roles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t("roles.noRoles")}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {formData.roles.map((role, roleIndex) => (
                    <Card key={roleIndex} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">
                          {t("roles.roleNumber", { number: roleIndex + 1 })}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRole(roleIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              {t("roles.roleName")}{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={role.name}
                              onChange={(e) =>
                                updateRole(roleIndex, "name", e.target.value)
                              }
                              placeholder={t("roles.roleNamePlaceholder")}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              {t("roles.color")}
                            </label>
                            <div className="flex gap-2">
                              {PRESET_COLORS.map((color) => (
                                <button
                                  key={color.value}
                                  type="button"
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    role.color === color.value
                                      ? "border-gray-900 scale-110"
                                      : "border-transparent hover:scale-105"
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  onClick={() =>
                                    updateRole(roleIndex, "color", color.value)
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {t("roles.roleDescription")}
                          </label>
                          <Textarea
                            value={role.description}
                            onChange={(e) =>
                              updateRole(roleIndex, "description", e.target.value)
                            }
                            placeholder={t("roles.roleDescriptionPlaceholder")}
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={role.isUnique || false}
                              onChange={(e) =>
                                updateRole(roleIndex, "isUnique", e.target.checked)
                              }
                              className="rounded"
                            />
                            <span className="text-sm">{t("roles.isUnique")}</span>
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={role.isRequired || false}
                              onChange={(e) =>
                                updateRole(
                                  roleIndex,
                                  "isRequired",
                                  e.target.checked
                                )
                              }
                              className="rounded"
                            />
                            <span className="text-sm">
                              {t("roles.isRequired")}
                            </span>
                          </label>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            {t("roles.permissions")}
                          </label>
                          <p className="text-xs text-gray-600 mb-3">
                            {t("roles.permissionsSubtitle")}
                          </p>

                          <div className="space-y-4">
                            {Object.entries(GROUPED_PERMISSIONS).map(
                              ([category, perms]) => (
                                <div
                                  key={category}
                                  className="border border-gray-200 rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-sm">
                                      {t(`permissionCategories.${category}`)}
                                    </h5>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          toggleAllPermissions(
                                            roleIndex,
                                            category,
                                            true
                                          )
                                        }
                                        className="text-xs"
                                      >
                                        {t("roles.selectAll")}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          toggleAllPermissions(
                                            roleIndex,
                                            category,
                                            false
                                          )
                                        }
                                        className="text-xs"
                                      >
                                        {t("roles.deselectAll")}
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    {perms.map((perm) => (
                                      <label
                                        key={perm.id}
                                        className="flex items-start gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={role.permissions.includes(
                                            perm.id
                                          )}
                                          onChange={() =>
                                            togglePermission(roleIndex, perm.id)
                                          }
                                          className="mt-0.5 rounded"
                                        />
                                        <div>
                                          <div className="font-medium">
                                            {perm.name}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            {perm.description}
                                          </div>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {errors.roles && (
                  <p className="text-sm text-red-600">{errors.roles}</p>
                )}
              </div>
            )}

            {/* ÉTAPE 4: Types de membres (seulement si admin membre) */}
            {currentStep === 4 && formData.adminStatus.isMember && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {t("memberTypes.title")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t("memberTypes.subtitle")}
                    </p>
                  </div>
                  <Button
                    onClick={addMemberType}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t("memberTypes.addType")}
                  </Button>
                </div>

                {formData.memberTypes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{t("memberTypes.noTypes")}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {formData.memberTypes.map((type, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">
                          {t("memberTypes.typeCount", { count: index + 1 })}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMemberType(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              {t("memberTypes.typeName")}{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={type.name}
                              onChange={(e) =>
                                updateMemberType(index, "name", e.target.value)
                              }
                              placeholder={t("memberTypes.typeNamePlaceholder")}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              {t("memberTypes.amount")}{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={type.cotisationAmount}
                              onChange={(e) =>
                                updateMemberType(
                                  index,
                                  "cotisationAmount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder={t("memberTypes.amountPlaceholder")}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {t("memberTypes.description")}
                          </label>
                          <Textarea
                            value={type.description || ""}
                            onChange={(e) =>
                              updateMemberType(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder={t(
                              "memberTypes.descriptionPlaceholder"
                            )}
                            rows={2}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {errors.memberTypes && (
                  <p className="text-sm text-red-600">{errors.memberTypes}</p>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">{t("memberTypes.info")}</p>
                </div>
              </div>
            )}

            {/* ÉTAPE 5: Documents */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">
                    {t("documents.title")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("documents.subtitle")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "statuts", label: t("documents.statuts") },
                    { key: "receipisse", label: t("documents.receipisse") },
                    { key: "rib", label: t("documents.rib") },
                    { key: "pv_creation", label: t("documents.pv_creation") },
                  ].map((doc) => (
                    <Card key={doc.key} className="p-4">
                      <h4 className="font-medium mb-3">{doc.label}</h4>

                      {formData.documents[doc.key] ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700">
                              {formData.documents[doc.key]?.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentChange(doc.key, null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            id={`upload-${doc.key}`}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentChange(doc.key, file);
                            }}
                          />
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              document
                                .getElementById(`upload-${doc.key}`)
                                ?.click()
                            }
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {t("documents.upload")}
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ÉTAPE 6: Finalisation */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">
                    {t("finalization.title")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("finalization.subtitle")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Infos générales */}
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">
                      {t("finalization.generalInfo")}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>{t("finalization.name")}:</strong>{" "}
                        {formData.name}
                      </div>
                      <div>
                        <strong>{t("finalization.country")}:</strong>{" "}
                        {t(`countries.${formData.domiciliationCountry}`)}
                      </div>
                      <div>
                        <strong>{t("finalization.city")}:</strong>{" "}
                        {formData.domiciliationCity}
                      </div>
                    </div>
                  </Card>

                  {/* Rôles (seulement si admin membre) */}
                  {formData.adminStatus.isMember && (
                    <Card className="p-4">
                      <h4 className="font-medium mb-3">
                        {t("finalization.rolesCreated", {
                          count: formData.roles.length,
                        })}
                      </h4>
                      <div className="space-y-2 text-sm">
                        {formData.roles.map((role, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            <span>{role.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {role.permissions.length} perms
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>

                {/* Types de membres (seulement si admin membre) */}
                {formData.adminStatus.isMember && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">
                      {t("finalization.memberTypesCreated", {
                        count: formData.memberTypes.length,
                      })}
                    </h4>
                    <div className="space-y-2 text-sm">
                      {formData.memberTypes.map((type, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{type.name}</span>
                          <span>
                            {t("finalization.perMonth", {
                              amount: type.cotisationAmount,
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Statut admin */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3">
                    {t("finalization.adminStatus")}
                  </h4>
                  <div className="text-sm">
                    {formData.adminStatus.isMember ? (
                      <div className="space-y-2">
                        <p>
                          <strong>{t("finalization.adminAsMember")}:</strong>{" "}
                          {t("common.yes")}
                        </p>
                        <p>
                          <strong>{t("finalization.memberType")}:</strong>{" "}
                          {formData.adminStatus.memberType}
                        </p>
                        <p>
                          <strong>{t("finalization.roles")}:</strong>{" "}
                          {formData.adminStatus.assignedRoles
                            .map((idx) => formData.roles[parseInt(idx)]?.name)
                            .join(", ")}
                        </p>
                      </div>
                    ) : (
                      <p>{t("finalization.adminExternal")}</p>
                    )}
                  </div>
                </Card>

                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {errors.submit}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("navigation.previous")}
          </Button>

          {currentStep < 6 ? (
            <Button onClick={handleNext}>
              {t("navigation.next")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading && <LoadingSpinner size="sm" />}
              {t("navigation.create")}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}