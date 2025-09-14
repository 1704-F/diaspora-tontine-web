// src/components/modules/associations/EditMemberModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuthStore } from "@/stores/authStore";
import {
  X,
  Save,
  User,
  MapPin,
  Shield,
  AlertTriangle,
  Crown,
  UserCheck,
  DollarSign,
} from "lucide-react";

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  associationId: string;
  onMemberUpdated: () => void;
}

interface MemberData {
  id: number;
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
  };
  memberType: string;
  status: string;
  sectionId: number | null;
  section: {
    id: number;
    name: string;
    country: string;
    city: string;
  } | null;
  roles: string[];
  cotisationAmount: string;
}

interface Section {
  id: number;
  name: string;
  country: string;
  city: string;
}

interface MemberType {
  name: string;
  cotisationAmount: number;
  description: string;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  memberId,
  associationId,
  onMemberUpdated,
}) => {
  const { token } = useAuthStore();
  const [member, setMember] = useState<MemberData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [memberTypes, setMemberTypes] = useState<MemberType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasOtherAdmins, setHasOtherAdmins] = useState(true);

  // États pour les modifications
  const [editedData, setEditedData] = useState({
    memberType: "",
    status: "",
    sectionId: null as number | null,
    roles: [] as string[],
    cotisationAmount: "",
  });

  const ROLE_OPTIONS = [
    {
      value: "president",
      label: "Président",
      icon: Crown,
      color: "text-yellow-600",
    },
    {
      value: "secretaire",
      label: "Secrétaire",
      icon: UserCheck,
      color: "text-blue-600",
    },
    {
      value: "tresorier",
      label: "Trésorier",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      value: "admin_association",
      label: "Administrateur",
      icon: Shield,
      color: "text-red-600",
    },
  ];

  const STATUS_OPTIONS = [
    { value: "active", label: "Actif", color: "bg-green-100 text-green-800" },
    {
      value: "suspended",
      label: "Suspendu",
      color: "bg-yellow-100 text-yellow-800",
    },
    { value: "inactive", label: "Inactif", color: "bg-gray-100 text-gray-800" },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchMemberData();
    }
  }, [isOpen, memberId]);

  const fetchMemberData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);

      // Récupérer les données du membre, sections, types membres et autres admins
      const [
        memberResponse,
        sectionsResponse,
        associationResponse,
        membersResponse,
      ] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members/${memberId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      if (memberResponse.ok) {
        const memberResult = await memberResponse.json();
        const memberData = memberResult.data.member;
        setMember(memberData);

        // Initialiser les données éditées
        setEditedData({
          memberType: memberData.memberType,
          status: memberData.status,
          sectionId: memberData.sectionId,
          roles: [...memberData.roles],
          cotisationAmount: memberData.cotisationAmount || "0",
        });
      }

      if (sectionsResponse.ok) {
        const sectionsResult = await sectionsResponse.json();
        setSections(sectionsResult.data.sections || []);
      }

      if (associationResponse.ok) {
        const assocResult = await associationResponse.json();
        setMemberTypes(assocResult.data.association.memberTypes || []);
      }

      if (membersResponse.ok) {
        const membersResult = await membersResponse.json();
        const allMembers = membersResult.data.members;

        // Vérifier s'il y a d'autres admins
        const admins = allMembers.filter(
          (m: any) =>
            m.roles.includes("admin_association") && m.userId !== member?.userId
        );
        setHasOtherAdmins(admins.length > 0);
      }
    } catch (error) {
      console.error("Erreur chargement données membre:", error);
      setErrors({ fetch: "Erreur de chargement des données" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleToggle = (roleValue: string) => {
    // Si c'est admin_association et qu'il est le seul admin, ne pas permettre la suppression
    if (
      roleValue === "admin_association" &&
      editedData.roles.includes("admin_association") &&
      !hasOtherAdmins
    ) {
      setErrors({
        roles:
          "Impossible de retirer le rôle admin : vous êtes le seul administrateur",
      });
      return;
    }

    setErrors({ ...errors, roles: "" });

    setEditedData((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleValue)
        ? prev.roles.filter((r) => r !== roleValue)
        : [...prev.roles, roleValue],
    }));
  };

  const handleSave = async () => {
    if (!member || !token) return;

    setIsSaving(true);
    setErrors({});

    try {
      const updateData = {
        memberType: editedData.memberType,
        status: editedData.status,
        sectionId: editedData.sectionId,
        roles: editedData.roles,
        cotisationAmount: parseFloat(editedData.cotisationAmount) || 0,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members/${memberId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        onMemberUpdated();
        onClose();
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || "Erreur lors de la mise à jour" });
      }
    } catch (error) {
      console.error("Erreur mise à jour membre:", error);
      setErrors({ submit: "Erreur de connexion" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Modifier le membre
              </h2>
              {member && (
                <p className="text-sm text-gray-600">
                  {member.user.firstName} {member.user.lastName}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : member ? (
            <div className="space-y-6">
              {/* Informations utilisateur (lecture seule) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nom complet:</span>
                    <p className="font-medium">
                      {member.user.firstName} {member.user.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Téléphone:</span>
                    <p className="font-medium">{member.user.phoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">
                      {member.user.email || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Membre depuis:</span>
                    <p className="font-medium">
                      {new Date(member.joinDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Type de membre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de membre
                </label>

                <select
                  value={editedData.memberType}
                  onChange={(e) => {
                    const selectedType = memberTypes.find(
                      (type) => type.name === e.target.value
                    );
                    setEditedData((prev) => ({
                      ...prev,
                      memberType: e.target.value,
                      cotisationAmount: selectedType
                        ? selectedType.cotisationAmount.toString()
                        : "0",
                    }));
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {memberTypes.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name} ({type.cotisationAmount}€/mois)
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              {sections.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section géographique
                  </label>
                  <select
                    value={editedData.sectionId || ""}
                    onChange={(e) =>
                      setEditedData((prev) => ({
                        ...prev,
                        sectionId: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">
                      Aucune section (association centrale)
                    </option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name} - {section.city}, {section.country}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut du membre
                </label>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() =>
                        setEditedData((prev) => ({
                          ...prev,
                          status: status.value,
                        }))
                      }
                      className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition-colors ${
                        editedData.status === status.value
                          ? `${status.color} border-blue-300`
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rôles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôles dans l'association
                </label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map((role) => {
                    const Icon = role.icon;
                    const isSelected = editedData.roles.includes(role.value);
                    const isAdminLastOne =
                      role.value === "admin_association" &&
                      isSelected &&
                      !hasOtherAdmins;

                    return (
                      <div
                        key={role.value}
                        className={`flex items-center justify-between p-3 border-2 rounded-lg transition-colors ${
                          isSelected
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${role.color}`} />
                          <span className="font-medium">{role.label}</span>
                          {isAdminLastOne && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <span className="text-xs text-amber-600">
                                Seul admin
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(role.value)}
                          disabled={isAdminLastOne}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300 hover:border-gray-400"
                          } ${isAdminLastOne ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {errors.roles && (
                  <p className="text-red-500 text-sm mt-1">{errors.roles}</p>
                )}
              </div>

              {/* Cotisation (lecture seule) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cotisation mensuelle (€)
                </label>
                <div className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600">
                  {editedData.cotisationAmount}€/mois
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Déterminée automatiquement par le type de membre sélectionné
                </p>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{errors.submit}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Membre introuvable</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {member && (
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving && <LoadingSpinner size="sm" />}
              <Save className="h-4 w-4" />
              Sauvegarder
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
