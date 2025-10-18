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
} from "lucide-react";

import { useAuthStore } from "@/stores/authStore";
import { associationsApi } from "@/lib/api/association/associations";
import { rolesApi } from "@/lib/api/association/roles";
import type { CreateRolePayload, Permission } from "@/types/association/role";
import type { MemberTypeConfig } from "@/types/association/member";
import { toast } from "sonner";

// ============================================
// INTERFACES
// ============================================

interface RoleFormData extends Omit<CreateRolePayload, "permissions"> {
  permissions: string[];
}

interface MemberTypeFormData extends MemberTypeConfig {
  defaultRole: string;
}

interface FormData {
  // Étape 1: Infos de base
  name: string;
  description: string;
  legalStatus: string;
  country: string;
  city: string;
  registrationNumber: string;

  // Étape 2: Rôles
  roles: RoleFormData[];

  // Étape 3: Types de membres
  memberTypes: MemberTypeFormData[];
}

type Step = 1 | 2 | 3 | 4;

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

// Permissions disponibles par catégorie (tirées du backend)
const AVAILABLE_PERMISSIONS: Permission[] = [
  // 💰 FINANCES
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

  // 👥 MEMBRES
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

  // 🏛️ ADMINISTRATION
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

  // 📄 DOCUMENTS
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

  // 📅 ÉVÉNEMENTS
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
  const tCommon = useTranslations("common");

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    // Étape 1
    name: "",
    description: "",
    legalStatus: "association_1901",
    country: "FR",
    city: "",
    registrationNumber: "",

    // Étape 2
    roles: [],

    // Étape 3
    memberTypes: [],
  });

  // Ajout après les imports
  const COUNTRY_CODE_TO_NAME: Record<string, string> = {
    FR: "France",
    BE: "Belgique",
    SN: "Sénégal",
    IT: "Italie",
    ES: "Espagne",
    US: "États-Unis",
    CA: "Canada",
  };

  // ============================================
  // VALIDATION
  // ============================================

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = t("basicInfo.nameRequired");
        if (formData.name.length < 3)
          newErrors.name = t("validation.nameTooShort");
        if (!formData.legalStatus)
          newErrors.legalStatus = t("basicInfo.legalStatusRequired");
        if (!formData.country)
          newErrors.country = t("basicInfo.countryRequired");
        if (!formData.city.trim()) newErrors.city = t("basicInfo.cityRequired");
        break;

      case 2:
        if (formData.roles.length === 0) {
          newErrors.roles = t("validation.atLeastOneRole");
        }
        formData.roles.forEach((role, index) => {
          if (!role.name.trim())
            newErrors[`role_${index}_name`] = t("roles.roleNameRequired");
          if (!role.description.trim())
            newErrors[`role_${index}_desc`] = t("roles.roleDescRequired");
          if (role.permissions.length === 0)
            newErrors[`role_${index}_perms`] = t("roles.minPermissions");
        });
        break;

      case 3:
        if (formData.memberTypes.length === 0) {
          newErrors.memberTypes = t("validation.atLeastOneMemberType");
        }
        formData.memberTypes.forEach((type, index) => {
          if (!type.name.trim())
            newErrors[`type_${index}_name`] = t("memberTypes.typeNameRequired");
          if (type.cotisationAmount < 0)
            newErrors[`type_${index}_amount`] = t("memberTypes.amountPositive");
          if (!type.defaultRole)
            newErrors[`type_${index}_role`] = t("memberTypes.roleRequired");
        });
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // NAVIGATION
  // ============================================

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4) as Step);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  // ============================================
  // SOUMISSION
  // ============================================

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);

    try {
      // 1️⃣ Créer l'association
      console.log("📝 Étape 1: Création association...");
      const createResponse = await associationsApi.create({
        name: formData.name,
        description: formData.description,
        legalStatus: formData.legalStatus,
        domiciliationCountry:
          COUNTRY_CODE_TO_NAME[formData.country] || formData.country, // ✅ Conversion code → nom
        domiciliationCity: formData.city,
        registrationNumber: formData.registrationNumber || undefined,
      });

      if (!createResponse.success) {
        throw new Error(t("errors.createFailed"));
      }

      const associationId = createResponse.data.association.id;
      console.log(`✅ Association créée avec ID: ${associationId}`);

      // 2️⃣ Créer les rôles
      console.log("🎭 Étape 2: Création des rôles...");
      const createdRoles: Array<{ tempId: string; realId: string }> = [];

      for (const role of formData.roles) {
        const roleResponse = await rolesApi.create(associationId, {
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          color: role.color,
          iconName: role.iconName,
          isUnique: role.isUnique || false,
        });

        if (roleResponse.success) {
          // Mapper l'index temporaire au vrai ID
          const tempId = formData.roles.indexOf(role).toString();
          createdRoles.push({
            tempId,
            realId: roleResponse.data.role.id,
          });
          console.log(
            `✅ Rôle "${role.name}" créé avec ID: ${roleResponse.data.role.id}`
          );
        }
      }

      // 3️⃣ Mettre à jour les memberTypes avec les vrais IDs de rôles
      console.log("👥 Étape 3: Configuration des types de membres...");
      const memberTypesWithRealIds = formData.memberTypes.map((type) => {
        const mapping = createdRoles.find((r) => r.tempId === type.defaultRole);
        return {
          ...type,
          defaultRole: mapping?.realId || type.defaultRole,
        };
      });

      // Mettre à jour la configuration
      const configResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            memberTypes: memberTypesWithRealIds,
          }),
        }
      );

      if (!configResponse.ok) {
        console.warn("⚠️  Erreur configuration memberTypes (non bloquant)");
      } else {
        console.log("✅ Types de membres configurés");
      }

      // 4️⃣ Succès ! Redirection
      toast.success(t("success.created"), {
        description: t("success.redirecting"),
      });

      setTimeout(() => {
        router.push(`/modules/associations/${associationId}`);
      }, 1000);
    } catch (error) {
      console.error("❌ Erreur création association:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("errors.connectionError");
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
          isUnique: false,
        },
      ],
    }));
  };

  const deleteRole = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index),
    }));
  };

  const updateRole = (
    index: number,
    field: keyof RoleFormData,
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) =>
        i === index ? { ...role, [field]: value } : role
      ),
    }));
  };

  const togglePermission = (roleIndex: number, permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) => {
        if (i !== roleIndex) return role;
        const perms = role.permissions.includes(permissionId)
          ? role.permissions.filter((p) => p !== permissionId)
          : [...role.permissions, permissionId];
        return { ...role, permissions: perms };
      }),
    }));
  };

  const selectAllPermissions = (roleIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) =>
        i === roleIndex
          ? { ...role, permissions: AVAILABLE_PERMISSIONS.map((p) => p.id) }
          : role
      ),
    }));
  };

  const deselectAllPermissions = (roleIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role, i) =>
        i === roleIndex ? { ...role, permissions: [] } : role
      ),
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
          defaultRole: "",
        },
      ],
    }));
  };

  const deleteMemberType = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      memberTypes: prev.memberTypes.filter((_, i) => i !== index),
    }));
  };

  const updateMemberType = (
    index: number,
    field: keyof MemberTypeFormData,
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      memberTypes: prev.memberTypes.map((type, i) =>
        i === index ? { ...type, [field]: value } : type
      ),
    }));
  };

  // ============================================
  // RENDER
  // ============================================

  const steps = [
    { id: 1, label: t("steps.basic"), icon: Building2 },
    { id: 2, label: t("steps.roles"), icon: Shield },
    { id: 3, label: t("steps.memberTypes"), icon: Users },
    { id: 4, label: t("steps.finalization"), icon: Check },
  ];

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
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`
                  flex items-center gap-3 px-4 py-2 rounded-lg transition-colors w-full justify-center
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-600"
                      : isCompleted
                        ? "bg-green-50 text-green-600"
                        : "bg-gray-50 text-gray-400"
                  }
                `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium hidden sm:block">
                    {step.label}
                  </span>
                  {isCompleted && <Check className="h-4 w-4" />}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-full h-px bg-gray-200 mx-2" />
                )}
              </div>
            );
          })}
        </div>

        {/* Contenu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, {
                className: "h-5 w-5",
              })}
              {steps[currentStep - 1].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ÉTAPE 1: Informations de base */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("basicInfo.name")} *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder={t("basicInfo.namePlaceholder")}
                      error={errors.name}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("basicInfo.legalStatus")} *
                    </label>
                    <select
                      value={formData.legalStatus}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          legalStatus: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("basicInfo.description")}
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder={t("basicInfo.descriptionPlaceholder")}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("basicInfo.country")} *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="FR">{t("countries.FR")}</option>
                      <option value="BE">{t("countries.BE")}</option>
                      <option value="SN">{t("countries.SN")}</option>
                      <option value="IT">{t("countries.IT")}</option>
                      <option value="ES">{t("countries.ES")}</option>
                      <option value="US">{t("countries.US")}</option>
                      <option value="CA">{t("countries.CA")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("basicInfo.city")} *
                    </label>
                    <Input
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder={t("basicInfo.cityPlaceholder")}
                      error={errors.city}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("basicInfo.registrationNumber")}
                  </label>
                  <Input
                    value={formData.registrationNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        registrationNumber: e.target.value,
                      }))
                    }
                    placeholder={t("basicInfo.registrationNumberPlaceholder")}
                  />
                </div>
              </div>
            )}

            {/* ÉTAPE 2: Rôles */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">{t("roles.title")}</h3>
                    <p className="text-sm text-gray-600">
                      {t("roles.subtitle")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("roles.minimumRoles")}
                    </p>
                  </div>
                  <Button onClick={addRole} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {t("roles.addRole")}
                  </Button>
                </div>

                {errors.roles && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {errors.roles}
                  </div>
                )}

                <div className="space-y-4">
                  {formData.roles.map((role, roleIndex) => (
                    <Card key={roleIndex} className="p-4 border-2">
                      <div className="space-y-4">
                        {/* Header avec suppression */}
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Rôle {roleIndex + 1}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRole(roleIndex)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Nom & Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Input
                              value={role.name}
                              onChange={(e) =>
                                updateRole(roleIndex, "name", e.target.value)
                              }
                              placeholder={t("roles.roleNamePlaceholder")}
                              error={errors[`role_${roleIndex}_name`]}
                            />
                          </div>
                          <div>
                            <select
                              value={role.color}
                              onChange={(e) =>
                                updateRole(roleIndex, "color", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              {PRESET_COLORS.map((color) => (
                                <option key={color.value} value={color.value}>
                                  {t(`colors.${color.label}`)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <Textarea
                            value={role.description}
                            onChange={(e) =>
                              updateRole(
                                roleIndex,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder={t("roles.roleDescriptionPlaceholder")}
                            rows={2}
                            error={errors[`role_${roleIndex}_desc`]}
                          />
                        </div>

                        {/* Permissions */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              {t("roles.permissions")} (
                              {role.permissions.length})
                            </label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => selectAllPermissions(roleIndex)}
                              >
                                {t("roles.selectAll")}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  deselectAllPermissions(roleIndex)
                                }
                              >
                                {t("roles.deselectAll")}
                              </Button>
                            </div>
                          </div>

                          {errors[`role_${roleIndex}_perms`] && (
                            <p className="text-sm text-red-600 mb-2">
                              {errors[`role_${roleIndex}_perms`]}
                            </p>
                          )}

                          <div className="space-y-3 max-h-96 overflow-y-auto border rounded-md p-3">
                            {Object.entries(GROUPED_PERMISSIONS).map(
                              ([category, perms]) => (
                                <div key={category}>
                                  <h5 className="font-medium text-sm mb-2">
                                    {t(`permissionCategories.${category}`)}
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-2">
                                    {perms.map((perm) => (
                                      <label
                                        key={perm.id}
                                        className="flex items-center gap-2 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={role.permissions.includes(
                                            perm.id
                                          )}
                                          onChange={() =>
                                            togglePermission(roleIndex, perm.id)
                                          }
                                          className="rounded"
                                        />
                                        <span className="text-sm">
                                          {perm.name}
                                        </span>
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

                  {formData.roles.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>{t("roles.roleCount", { count: 0 })}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ÉTAPE 3: Types de membres */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
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

                {errors.memberTypes && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {errors.memberTypes}
                  </div>
                )}

                <div className="space-y-3">
                  {formData.memberTypes.map((type, typeIndex) => (
                    <Card key={typeIndex} className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <Input
                              value={type.name}
                              onChange={(e) =>
                                updateMemberType(
                                  typeIndex,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder={t("memberTypes.typeNamePlaceholder")}
                              error={errors[`type_${typeIndex}_name`]}
                            />
                          </div>
                          <div>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={type.cotisationAmount}
                              onChange={(e) =>
                                updateMemberType(
                                  typeIndex,
                                  "cotisationAmount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder={t("memberTypes.amountPlaceholder")}
                              error={errors[`type_${typeIndex}_amount`]}
                            />
                          </div>
                          <div>
                            <Input
                              value={type.description}
                              onChange={(e) =>
                                updateMemberType(
                                  typeIndex,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder={t(
                                "memberTypes.descriptionPlaceholder"
                              )}
                            />
                          </div>
                          <div>
                            <select
                              value={type.defaultRole}
                              onChange={(e) =>
                                updateMemberType(
                                  typeIndex,
                                  "defaultRole",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="">
                                {t("memberTypes.selectRole")}
                              </option>
                              {formData.roles.map((role, roleIndex) => (
                                <option
                                  key={roleIndex}
                                  value={roleIndex.toString()}
                                >
                                  {role.name} ({role.permissions.length} perms)
                                </option>
                              ))}
                            </select>
                            {errors[`type_${typeIndex}_role`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {errors[`type_${typeIndex}_role`]}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMemberType(typeIndex)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}

                  {formData.memberTypes.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>{t("memberTypes.typeCount", { count: 0 })}</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      {t("memberTypes.roleHelp")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 4: Finalisation */}
            {currentStep === 4 && (
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
                        <strong>{t("finalization.status")}:</strong>{" "}
                        {t(`legalStatus.${formData.legalStatus}`)}
                      </div>
                      <div>
                        <strong>{t("finalization.country")}:</strong>{" "}
                        {t(`countries.${formData.country}`)}
                      </div>
                      {formData.city && (
                        <div>
                          <strong>{t("finalization.city")}:</strong>{" "}
                          {formData.city}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Rôles */}
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
                </div>

                {/* Types de membres */}
                <Card className="p-4">
                  <h4 className="font-medium mb-3">
                    {t("finalization.memberTypesCreated", {
                      count: formData.memberTypes.length,
                    })}
                  </h4>
                  <div className="space-y-2 text-sm">
                    {formData.memberTypes.map((type, index) => {
                      const roleIndex = parseInt(type.defaultRole);
                      const role = formData.roles[roleIndex];
                      return (
                        <div key={index} className="flex justify-between">
                          <span>{type.name}</span>
                          <span>
                            {t("finalization.perMonth", {
                              amount: type.cotisationAmount,
                            })}
                            {role &&
                              ` - ${t("finalization.withRole", { role: role.name })}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Next steps */}
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <h3 className="font-medium text-blue-800 mb-2">
                        {t("finalization.nextStepsTitle")}
                      </h3>
                      <ul className="space-y-1">
                        {(t.raw("finalization.nextSteps") as string[]).map(
                          (step, index) => (
                            <li key={index}>• {step}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

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

          {currentStep < 4 ? (
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
