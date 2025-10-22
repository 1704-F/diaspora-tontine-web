// src/components/modules/associations/EditMemberModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";
import {
  X,
  Save,
  User,
  MapPin,
  Shield,
  AlertTriangle,
  Crown,
  CheckCircle,
  DollarSign,
} from "lucide-react";

// ✅ IMPORTS TYPES
import type { AssociationMember } from "@/types/association/member";
import type { Association } from "@/types/association/association";
import type { Section } from "@/types/association/section";

// ✅ IMPORTS API
import { membersApi } from "@/lib/api/association/members";
import { useAssociation } from "@/hooks/association/useAssociation";
import { useRoles } from "@/hooks/association/useRoles";

// ============================================
// INTERFACES
// ============================================

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  associationId: number;
}

interface FormData {
  memberType: string;
  status: AssociationMember["status"];
  sectionId: number | null;
  assignedRoles: string[]; // ✅ MULTI-RÔLES
  cotisationAmount: number;
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  memberId,
  associationId,
}) => {
  const t = useTranslations("editMember");
  const tCommon = useTranslations("common");

  // ✅ HOOKS
  const { association, currentMembership } = useAssociation(associationId);
  const { roles } = useRoles(associationId);

  // ✅ ÉTATS
  const [member, setMember] = useState<AssociationMember | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    memberType: "",
    status: "active",
    sectionId: null,
    assignedRoles: [],
    cotisationAmount: 0,
  });

  // ============================================
  // CHARGEMENT DONNÉES
  // ============================================

  useEffect(() => {
    if (isOpen && associationId && memberId) {
      loadMemberData();
      if (association?.isMultiSection) {
        loadSections();
      }
    }
  }, [isOpen, associationId, memberId]);

  const loadMemberData = async () => {
    setIsLoading(true);
    try {
      const response = await membersApi.getById(associationId, memberId);

      if (response.success && response.data.member) {
        const memberData = response.data.member;
        setMember(memberData);

        // ✅ Initialiser formulaire avec données RBAC
        setFormData({
          memberType: memberData.memberType || "",
          status: memberData.status,
          sectionId: memberData.sectionId || null,
          assignedRoles: memberData.assignedRoles || [], // ✅ MULTI-RÔLES
          cotisationAmount: memberData.cotisationAmount || 0,
        });
      }
    } catch (error) {
      console.error("Erreur chargement membre:", error);
      toast.error(t("errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSections(data.data.sections || []);
      }
    } catch (error) {
      console.error("Erreur chargement sections:", error);
    }
  };

  // ============================================
  // GESTION MULTI-RÔLES
  // ============================================

  const toggleRole = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedRoles: prev.assignedRoles.includes(roleId)
        ? prev.assignedRoles.filter((r) => r !== roleId)
        : [...prev.assignedRoles, roleId],
    }));
  };

  // ============================================
  // SAUVEGARDE
  // ============================================

  const handleSave = async () => {
    if (!member) return;

    // Validation
    if (!formData.memberType) {
      toast.error(t("errors.memberTypeRequired"));
      return;
    }

    if (formData.assignedRoles.length === 0) {
      toast.error(t("errors.rolesRequired"));
      return;
    }

    setIsSaving(true);

    try {
      const response = await membersApi.update(associationId, memberId, {
        memberType: formData.memberType,
        status: formData.status,
        sectionId: formData.sectionId,
        assignedRoles: formData.assignedRoles, // ✅ MULTI-RÔLES
        cotisationAmount: formData.cotisationAmount,
      });

      if (response.success) {
        setShowSuccess(true);
        toast.success(t("success.updated"));

        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Erreur modification membre:", error);
      toast.error(t("errors.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // FERMETURE
  // ============================================

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t("title")}
              </h2>
              {member && (
                <p className="text-sm text-gray-600">
                  {member.user?.firstName} {member.user?.lastName}
                  {member.isAdmin && (
                    <Crown className="inline h-4 w-4 ml-1 text-yellow-500" />
                  )}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : showSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-medium text-gray-900">
                {t("success.message")}
              </p>
            </div>
          ) : (
            <>
              {/* Infos membre (lecture seule) */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">
                  {t("sections.memberInfo")}
                </h3>
                <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-xs text-gray-600">
                      {t("fields.phone")}
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {member?.user?.phoneNumber}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">
                      {t("fields.email")}
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {member?.user?.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Type de membre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("fields.memberType")} *
                </label>
                <select
                  value={formData.memberType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      memberType: e.target.value,
                      cotisationAmount:
                        association?.memberTypes?.find(
                          (t) => t.name === e.target.value
                        )?.cotisationAmount || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isSaving}
                >
                  <option value="">{t("fields.selectMemberType")}</option>
                  {association?.memberTypes?.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name} ({type.cotisationAmount}€/mois)
                    </option>
                  ))}
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("fields.status")} *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as AssociationMember["status"],
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isSaving}
                >
                  <option value="active">{t("status.active")}</option>
                  <option value="pending">{t("status.pending")}</option>
                  <option value="suspended">{t("status.suspended")}</option>
                  <option value="inactive">{t("status.inactive")}</option>
                </select>
              </div>

              {/* Section (si multi-sections) */}
              {association?.isMultiSection && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {t("fields.section")}
                  </label>
                  <select
                    value={formData.sectionId || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sectionId: e.target.value ? parseInt(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={isSaving}
                  >
                    <option value="">{t("fields.noSection")}</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name} ({section.city}, {section.country})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ✅ RÔLES (MULTI-SÉLECTION) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Shield className="inline h-4 w-4 mr-1" />
                  {t("fields.roles")} *
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {t("fields.rolesHelp")}
                </p>

                <div className="space-y-2 border rounded-md p-3 max-h-64 overflow-y-auto">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.assignedRoles.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                        disabled={isSaving}
                        className="rounded"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color }}
                        />
                        <span className="font-medium">{role.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {role.permissions?.length || 0} perms
                      </Badge>
                    </label>
                  ))}
                </div>

                {formData.assignedRoles.length === 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    {t("errors.rolesRequired")}
                  </p>
                )}
              </div>

              {/* Cotisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  {t("fields.cotisationAmount")}
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cotisationAmount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cotisationAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("fields.cotisationHelp")}
                </p>
              </div>

              {/* Warning admin */}
              {member?.isAdmin && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium">{t("warnings.adminTitle")}</p>
                      <p className="text-xs mt-1">{t("warnings.adminMessage")}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !showSuccess && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              {tCommon("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {tCommon("saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {tCommon("save")}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};