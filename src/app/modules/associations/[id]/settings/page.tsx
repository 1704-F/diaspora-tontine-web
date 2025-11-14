// src/app/modules/associations/[id]/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAssociation, useRoles, usePermissions } from "@/hooks/association";
import { associationsApi } from "@/lib/api/association";
import type { MemberTypeConfig, CustomRole, CotisationSettings } from "@/types/association";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import SectionsTab from "@/components/modules/associations/SectionsTab";
import { toast } from "sonner";
import {
  ArrowLeft,
  Settings,
  Users,
  Euro,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Shield,
  Calendar,
  Building2,
  Info,
} from "lucide-react";
import { DEFAULT_ASSOCIATION_FEATURES } from '@/lib/constants/features';
import { CURRENCIES } from '@/lib/constants/countries';

type ActiveTab = "members" | "sections" | "cotisations";

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function AssociationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("settings");
  const associationId = parseInt(params.id as string);

  // Hooks réutilisables
  const { association, currentMembership, loading, refetch } =
    useAssociation(associationId);
  const { roles } = useRoles(associationId);
  const { isAdmin, canModifySettings } = usePermissions(associationId);

  // États locaux
  const [editingMemberType, setEditingMemberType] = useState<number | null>(
    null
  );
  const [newMemberType, setNewMemberType] = useState<MemberTypeConfig>({
    name: "",
    cotisationAmount: 0,
    description: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("members");

  const [showAddCustomRole, setShowAddCustomRole] = useState(false);
  const [newCustomRole, setNewCustomRole] = useState<
    Omit<CustomRole, "id" | "assignedTo" | "assignedAt">
  >({
    name: "",
    description: "",
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentRole, setCurrentRole] = useState<{
    id: string;
    data: CustomRole;
  } | null>(null);
  const [members, setMembers] = useState<
    Array<{
      userId: number;
      status: string;
      user: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
      };
    }>
  >([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Vérification permissions (avec protection race condition)
  useEffect(() => {
    // 1️⃣ Attendre le loading
    if (loading) {
      console.log("⏳ Settings - En attente du chargement...");
      return;
    }

    // 2️⃣ Attendre que l'association existe
    if (!association) {
      console.log("⏳ Settings - Association non chargée...");
      return;
    }

    // 3️⃣ Attendre que currentMembership existe (SOURCE DE VÉRITÉ)
    if (!currentMembership) {
      console.log("⏳ Settings - currentMembership non chargé...");
      return;
    }

    // 4️⃣ Utiliser la source de vérité directement
    const hasAccess = currentMembership.isAdmin || canModifySettings;

    console.log("🔐 Settings - Permission Check:", {
      userId: currentMembership.userId,
      isAdmin: currentMembership.isAdmin,
      canModifySettings,
      hasAccess,
      shouldRedirect: !hasAccess,
    });

    // 5️⃣ Maintenant on peut vérifier les permissions
    if (!hasAccess) {
      console.log("❌ Settings - Redirection (accès refusé)");
      toast.error(t("accessDenied"), {
        description: t("accessDeniedDescription"),
      });
      router.push(`/modules/associations/${associationId}`);
    } else {
      console.log("✅ Settings - Accès autorisé");
    }
  }, [
    loading,
    association,
    currentMembership,
    canModifySettings,
    t,
    router,
    associationId,
  ]);

  const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      onCancel: () => setConfirmDialog(null),
    });
  };

  // ============================================
  // GESTION TYPES DE MEMBRES
  // ============================================
  const handleAddMemberType = async () => {
    if (!newMemberType.name || !newMemberType.description) {
      toast.error(t("memberTypes.missingFields"), {
        description: t("memberTypes.missingFieldsDescription"),
      });
      return;
    }

    try {
      const updatedMemberTypes = [
        ...(association?.memberTypes || []),
        newMemberType,
      ];

      await associationsApi.updateConfiguration(associationId, {
        memberTypes: updatedMemberTypes,
      });

      await refetch();
      setNewMemberType({
        name: "",
        cotisationAmount: 0,
        description: "",
      });
      setShowAddForm(false);
      toast.success(t("memberTypes.created"));
    } catch (error: unknown) {
      console.error("Erreur ajout type membre:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(errorMessage);
    }
  };

  const handleUpdateMemberType = async (
    index: number,
    updatedType: MemberTypeConfig
  ) => {
    try {
      const updatedMemberTypes =
        association?.memberTypes?.map((type, i) =>
          i === index ? updatedType : type
        ) || [];

      await associationsApi.updateConfiguration(associationId, {
        memberTypes: updatedMemberTypes,
      });

      await refetch();
      setEditingMemberType(null);
      toast.success(t("memberTypes.updated"));
    } catch (error: unknown) {
      console.error("Erreur modification type membre:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDeleteMemberType = async (index: number) => {
    const typeToDelete = association?.memberTypes?.[index];

    showConfirmDialog(
      t("memberTypes.deleteConfirmTitle"),
      t("memberTypes.deleteConfirmMessage", { name: typeToDelete?.name || "" }),
      async () => {
        try {
          const updatedMemberTypes =
            association?.memberTypes?.filter((_, i) => i !== index) || [];

          await associationsApi.updateConfiguration(associationId, {
            memberTypes: updatedMemberTypes,
          });

          await refetch();
          toast.success(t("memberTypes.deleted"));
        } catch (error: unknown) {
          console.error("Erreur suppression type membre:", error);
          toast.error("Erreur lors de la suppression");
        } finally {
          setConfirmDialog(null);
        }
      }
    );
  };

  // ============================================
  // GESTION CUSTOM ROLES
  // ============================================
  const handleAddCustomRole = async () => {
    if (!newCustomRole.name.trim() || !newCustomRole.description.trim()) {
      toast.error(t("memberTypes.missingFields"), {
        description: t("memberTypes.missingFieldsDescription"),
      });
      return;
    }

    const roleId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const customRole: CustomRole = {
      id: roleId,
      name: newCustomRole.name.trim(),
      description: newCustomRole.description.trim(),
      assignedTo: null,
    };

    try {
      const updatedCustomRoles = [
        ...(association?.customRoles || []),
        customRole,
      ];

      await associationsApi.updateConfiguration(associationId, {
        customRoles: updatedCustomRoles,
      });

      await refetch();
      setNewCustomRole({
        name: "",
        description: "",
      });
      setShowAddCustomRole(false);
      toast.success(t("organisation.roleCreated"), {
        description: t("organisation.roleCreatedDescription", {
          name: newCustomRole.name,
        }),
      });
    } catch (error: unknown) {
      console.error("Erreur ajout rôle personnalisé:", error);
      toast.error("Erreur lors de la création du rôle");
    }
  };

  const handleDeleteCustomRole = async (roleId: string) => {
    const roleToDelete = association?.customRoles?.find((r) => r.id === roleId);

    if (roleToDelete?.assignedTo) {
      toast.warning(t("organisation.roleAssigned"), {
        description: t("organisation.roleAssignedDescription"),
      });
      return;
    }

    showConfirmDialog(
      t("organisation.deleteRoleConfirmTitle"),

      t("organisation.deleteRoleConfirmMessage", {
        name: roleToDelete?.name || "",
      }),
      async () => {
        try {
          const updatedCustomRoles =
            association?.customRoles?.filter((r) => r.id !== roleId) || [];

          await associationsApi.updateConfiguration(associationId, {
            customRoles: updatedCustomRoles,
          });

          await refetch();
          toast.success(t("organisation.roleDeleted"));
        } catch (error: unknown) {
          console.error("Erreur suppression rôle:", error);
          toast.error("Erreur lors de la suppression");
        } finally {
          setConfirmDialog(null);
        }
      }
    );
  };

  // ============================================
  // GESTION ASSIGNATION RÔLES
  // ============================================
  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setMembers(result.data.members || []);
      }
    } catch (error: unknown) {
      console.error("Erreur chargement membres:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleAssignRole = async (roleId: string, role: CustomRole) => {
    setCurrentRole({ id: roleId, data: role });

    if (role.assignedTo) {
      setSelectedMemberId(role.assignedTo.toString());
    } else {
      setSelectedMemberId("");
    }

    await loadMembers();
    setShowAssignModal(true);
  };

  const handleConfirmAssignRole = async () => {
    if (!currentRole || !selectedMemberId) return;

    try {
      const selectedMember = members.find(
        (m) => m.userId.toString() === selectedMemberId
      );

      if (!selectedMember) {
        toast.error(t("organisation.memberNotFound"), {
          description: t("organisation.memberNotFoundDescription"),
        });
        return;
      }

      const updatedCustomRoles =
        association?.customRoles?.map((role) => {
          if (role.id === currentRole.id) {
            return {
              ...role,
              assignedTo: selectedMember.userId,
              assignedAt: new Date().toISOString(),
            };
          }
          if (role.assignedTo === selectedMember.userId) {
            return {
              ...role,
              assignedTo: null,
              assignedAt: undefined,
            };
          }
          return role;
        }) || [];

      await associationsApi.updateConfiguration(associationId, {
        customRoles: updatedCustomRoles,
      });

      await refetch();
      setShowAssignModal(false);
      setCurrentRole(null);
      setSelectedMemberId("");
      toast.success(t("organisation.roleAssignedSuccess"), {
        description: t("organisation.roleAssignedSuccessDescription", {
          name: `${selectedMember.user.firstName} ${selectedMember.user.lastName}`,
          role: currentRole.data.name,
        }),
      });
    } catch (error: unknown) {
      console.error("Erreur attribution rôle:", error);
      toast.error(t("organisation.assignError"), {
        description: t("organisation.assignErrorDescription"),
      });
    }
  };

  const handleRemoveRoleAssignment = async () => {
    if (!currentRole) return;

    showConfirmDialog(
      t("organisation.removeAssignment"),
      t("organisation.removeAssignmentMessage"),
      async () => {
        try {
          const updatedCustomRoles =
            association?.customRoles?.map((role) => {
              if (role.id === currentRole.id) {
                return {
                  ...role,
                  assignedTo: null,
                  assignedAt: undefined,
                };
              }
              return role;
            }) || [];

          await associationsApi.updateConfiguration(associationId, {
            customRoles: updatedCustomRoles,
          });

          await refetch();
          setShowAssignModal(false);
          setCurrentRole(null);
          toast.success(t("organisation.roleRemovedSuccess"));
        } catch (error: unknown) {
          console.error("Erreur retrait rôle:", error);
          toast.error(t("organisation.removeError"), {
            description: t("organisation.removeErrorDescription"),
          });
        } finally {
          setConfirmDialog(null);
        }
      }
    );
  };

  const getAvailableMembers = () => {
    if (!members) return [];

    const assignedUserIds = new Set(
      association?.customRoles
        ?.filter((r) => r.assignedTo && r.id !== currentRole?.id)
        .map((r) => r.assignedTo) || []
    );

    return members.filter(
      (member) =>
        member.status === "active" && !assignedUserIds.has(member.userId)
    );
  };

  // ============================================
  // GESTION COTISATIONS
  // ============================================
  const handleUpdateCotisationSettings = async (
    field: string,
    value: number | boolean
  ) => {
    try {
      const updatedCotisationSettings = {
        ...association?.cotisationSettings,
        [field]: value,
      };

      await associationsApi.updateConfiguration(associationId, {
        cotisationSettings: updatedCotisationSettings,
      });

      await refetch();
      toast.success(t("cotisations.updated"));
    } catch (error: unknown) {
      console.error("Erreur modification paramètres cotisations:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!association) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t("notFound")}
        </h2>
        <Button onClick={() => router.back()}>{t("backButton")}</Button>
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
            {t("backButton")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("title")} - {association.name}
            </h1>
            <p className="text-gray-600">{t("subtitle")}</p>
          </div>
        </div>

        <Button
          onClick={() =>
            router.push(`/modules/associations/${associationId}/settings/roles`)
          }
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          {t("accessRightsButton")}
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: "members" as const, label: t("tabs.members"), icon: Users },
            ...(association?.isMultiSection
              ? [
                  {
                    key: "sections" as const,
                    label: t("tabs.sections"),
                    icon: Building2,
                  },
                ]
              : []),
            {
              key: "cotisations" as const,
              label: t("tabs.cotisations"),
              icon: Euro,
            }
           
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.key
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content - Members Tab */}
      {activeTab === "members" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t("memberTypes.title")}
              </CardTitle>
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("memberTypes.add")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formulaire d'ajout */}
            {showAddForm && (
              <Card className="p-4 border-dashed border-2 border-gray-300">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder={t("memberTypes.name")}
                      value={newMemberType.name}
                      onChange={(e) =>
                        setNewMemberType((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder={t("memberTypes.amount")}
                      value={newMemberType.cotisationAmount}
                      onChange={(e) =>
                        setNewMemberType((prev) => ({
                          ...prev,
                          cotisationAmount: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <Textarea
                    placeholder={t("memberTypes.description")}
                    value={newMemberType.description}
                    onChange={(e) =>
                      setNewMemberType((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />

                  <div className="flex gap-2">
                    <Button onClick={handleAddMemberType}>
                      <Save className="h-4 w-4 mr-2" />
                      {t("memberTypes.save")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t("memberTypes.cancel")}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Liste des types existants */}
            <div className="space-y-3">
              {association.memberTypes?.map((type, index) => (
                <Card key={index} className="p-4">
                  {editingMemberType === index ? (
                    <EditMemberTypeForm
                      memberType={type}
                      onSave={(updatedType) =>
                        handleUpdateMemberType(index, updatedType)
                      }
                      onCancel={() => setEditingMemberType(null)}
                      translations={{
                        name: t("memberTypes.name"),
                        amount: t("memberTypes.amount"),
                        description: t("memberTypes.description"),
                        save: t("memberTypes.save"),
                        cancel: t("memberTypes.cancel"),
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <h4 className="font-medium capitalize">
                            {type.name}
                          </h4>

                          <Badge variant="secondary" className="bg-green-100 text-green-700">
  {type.cotisationAmount} {getCurrencySymbol(association.primaryCurrency)}/mois
</Badge>

                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {type.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMemberType(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteMemberType(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}

              {(!association.memberTypes ||
                association.memberTypes.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>{t("memberTypes.empty")}</p>
                  <p className="text-sm">{t("memberTypes.emptyHelp")}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content - Cotisations Tab */}
      {activeTab === "cotisations" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              {t("cotisations.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("cotisations.dueDay")}
                  </label>

                  <select
                    value={association.cotisationSettings?.dueDay || 1}
                    onChange={(e) =>
                      handleUpdateCotisationSettings(
                        "dueDay",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {t("cotisations.dueDayOption", { day })}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("cotisations.gracePeriod")}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={association.cotisationSettings?.gracePeriodDays || 0}
                    onChange={(e) =>
                      handleUpdateCotisationSettings(
                        "gracePeriodDays",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t("cotisations.gracePeriodHelp")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("cotisations.inactivityThreshold")}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={
                      association.cotisationSettings
                        ?.inactivityThresholdMonths || 3
                    }
                    onChange={(e) =>
                      handleUpdateCotisationSettings(
                        "inactivityThresholdMonths",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t("cotisations.inactivityThresholdHelp")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        association.cotisationSettings?.lateFeesEnabled || false
                      }
                      onChange={(e) =>
                        handleUpdateCotisationSettings(
                          "lateFeesEnabled",
                          e.target.checked
                        )
                      }
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {t("cotisations.lateFeesEnabled")}
                    </span>
                  </label>
                </div>

                {association.cotisationSettings?.lateFeesEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("cotisations.lateFeesAmount")}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        association.cotisationSettings?.lateFeesAmount || 0
                      }
                      onChange={(e) =>
                        handleUpdateCotisationSettings(
                          "lateFeesAmount",
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    {t("cotisations.paymentMode")}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {t("cotisations.paymentModeDescription")}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("cotisations.rulesPreview")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {association.cotisationSettings?.dueDay || 1}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("cotisations.dueDayLabel")}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {association.cotisationSettings?.gracePeriodDays || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("cotisations.graceDaysLabel")}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {association.cotisationSettings
                      ?.inactivityThresholdMonths || 3}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t("cotisations.inactivityLabel")}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

     

      {/* Content - Sections Tab */}
      {activeTab === "sections" && association && (
        <div className="space-y-6">

   <SectionsTab
  association={{
    ...association,
    features: association.features || DEFAULT_ASSOCIATION_FEATURES, // ✅ Sécurité
  }}
  token={localStorage.getItem("token")}
/>

        </div>
      )}

    

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {confirmDialog.title}
              </h3>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              {confirmDialog.message}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={confirmDialog.onCancel}
                className="flex-1"
              >
                {t("confirmDialog.cancel")}
              </Button>
              <Button
                onClick={confirmDialog.onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {t("confirmDialog.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

// ============================================
// COMPOSANT AUXILIAIRE
// ============================================

interface EditMemberTypeFormProps {
  memberType: MemberTypeConfig;
  onSave: (type: MemberTypeConfig) => void;
  onCancel: () => void;
  translations: {
    name: string;
    amount: string;
    description: string;
    save: string;
    cancel: string;
  };
}

function EditMemberTypeForm({
  memberType,
  onSave,
  onCancel,
  translations: t,
}: EditMemberTypeFormProps) {
  const [editedType, setEditedType] = useState(memberType);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder={t.name}
          value={editedType.name}
          onChange={(e) =>
            setEditedType((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
        />
        <Input
          type="number"
          placeholder={t.amount}
          value={editedType.cotisationAmount}
          onChange={(e) =>
            setEditedType((prev) => ({
              ...prev,
              cotisationAmount: parseFloat(e.target.value) || 0,
            }))
          }
        />
      </div>
      <Textarea
        placeholder={t.description}
        value={editedType.description}
        onChange={(e) =>
          setEditedType((prev) => ({
            ...prev,
            description: e.target.value,
          }))
        }
      />

      <div className="flex gap-2">
        <Button onClick={() => onSave(editedType)}>
          <Save className="h-4 w-4 mr-2" />
          {t.save}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          {t.cancel}
        </Button>
      </div>
    </div>
  );
}