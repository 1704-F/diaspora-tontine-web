// src/app/modules/associations/[id]/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
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
  Eye,
  EyeOff,
  Building2,
  Info,
} from "lucide-react";

interface Association {
  id: number;
  name: string;
  memberTypes: Array<{
    name: string;
    cotisationAmount: number;
    permissions: string[];
    description: string;
  }>;
  accessRights: {
    finances: string;
    membersList: string;
    statistics: string;
    calendar: string;
    expenses: string;
  };
  permissionsMatrix?: {
    [actionKey: string]: {
      allowed_roles: string[];
      conditions?: string[];
      requires_both?: boolean;
      notification_required?: string[];
    };
  };
  cotisationSettings: {
    dueDay: number;
    gracePeriodDays: number;
    lateFeesEnabled: boolean;
    lateFeesAmount: number;
    inactivityThresholdMonths: number;
  };
  centralBoard?: {
    [key: string]: {
      userId?: number;
      name?: string;
      role: string;
      phoneNumber?: string;
      // Propriétés pour rôles personnalisés
      description?: string;
      status?: string;
      optional?: boolean;
      createdAt?: string;
      createdBy?: number;
    };
  };
  isMultiSection?: boolean;
  features: {
    maxMembers: number;
    maxSections: number;
    customTypes: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
  };
}

interface MemberType {
  name: string;
  cotisationAmount: number;
  permissions: string[];
  description: string;
}

interface SectionCardProps {
  section: any;
  associationId: string;
  token: string | null; // ✅ ACCEPTER null
  onUpdate: () => void;
}

interface BureauSectionFormProps {
  bureau: {
    responsable?: { name?: string; phoneNumber?: string };
    secretaire?: { name?: string; phoneNumber?: string };
    tresorier?: { name?: string; phoneNumber?: string };
  };
  setBureau: (updater: (prev: any) => any) => void;
  onSave: () => void;
  onCancel: () => void;
}

interface NewCustomRole {
  name: string;
  description: string;
  permissions?: string[];
}

export default function AssociationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMemberType, setEditingMemberType] = useState<number | null>(
    null
  );
  const [newMemberType, setNewMemberType] = useState<MemberType>({
    name: "",
    cotisationAmount: 0,
    description: "",
    permissions: ["view_profile"],
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "members" | "sections" | "access" | "cotisations" | "bureau"
  >("members");

  const [showAddCustomRole, setShowAddCustomRole] = useState(false);
  const [customRoles, setCustomRoles] = useState<
    Array<{
      name: string;
      description: string;
      permissions: string[];
    }>
  >([]);

  const [sections, setSections] = useState<
    Array<{
      id: number;
      name: string;
      country: string;
      city: string;
      currency: string;
      language: string;
      membersCount: number;
      bureauSection?: {
        responsable?: { userId: number; name: string; phoneNumber: string };
        secretaire?: { userId: number; name: string; phoneNumber: string };
        tresorier?: { userId: number; name: string; phoneNumber: string };
      };
    }>
  >([]);

  const [newCustomRole, setNewCustomRole] = useState<NewCustomRole>({
    name: "",
    description: "",
    permissions: [],
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
    key: string;
    data: any;
  } | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const associationId = params.id as string;

  const permissionOptions = [
    { key: "view_profile", label: "Voir les profils" },
    { key: "participate_events", label: "Participer aux événements" },
    { key: "vote", label: "Droit de vote" },
    { key: "create_events", label: "Créer des événements" },
    { key: "invite_members", label: "Inviter des membres" },
  ];

  const accessOptions = [
    { key: "all_members", label: "Tous les membres" },
    { key: "central_board_only", label: "Bureau central uniquement" },
    { key: "bureau_and_sections", label: "Bureau central + sections" },
    { key: "disabled", label: "Aucun accès" },
  ];

  useEffect(() => {
  const fetchData = async () => {
    if (!associationId || !token) return;

    try {
      const associationResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (associationResponse.ok) {
        const result = await associationResponse.json();
        console.log('🏛️ Association reçue du serveur:', result.data.association);
        console.log('📋 Bureau central reçu:', result.data.association.centralBoard);
        
        setAssociation(result.data.association);

        if (result.data.association.isMultiSection) {
          fetchSections();
        }
      }
    } catch (error) {
      console.error("Erreur chargement association:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [associationId, token]);

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

  const fetchSections = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const result = await response.json();
        setSections(result.data.sections || []);
      }
    } catch (error) {
      console.error("Erreur chargement sections:", error);
    }
  };

  const handleAddMemberType = async () => {
    if (!newMemberType.name || !newMemberType.description) return;

    try {
      const updatedMemberTypes = [
        ...(association?.memberTypes || []),
        newMemberType,
      ];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ memberTypes: updatedMemberTypes }),
        }
      );

      if (response.ok) {
        setAssociation((prev) =>
          prev
            ? {
                ...prev,
                memberTypes: updatedMemberTypes,
              }
            : null
        );
        setNewMemberType({
          name: "",
          cotisationAmount: 0,
          description: "",
          permissions: ["view_profile"],
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Erreur ajout type membre:", error);
    }
  };

  const handleUpdateMemberType = async (
    index: number,
    updatedType: MemberType
  ) => {
    try {
      const updatedMemberTypes =
        association?.memberTypes?.map((type, i) =>
          i === index ? updatedType : type
        ) || [];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ memberTypes: updatedMemberTypes }),
        }
      );

      if (response.ok) {
        setAssociation((prev) =>
          prev
            ? {
                ...prev,
                memberTypes: updatedMemberTypes,
              }
            : null
        );
        setEditingMemberType(null);
      }
    } catch (error) {
      console.error("Erreur modification type membre:", error);
    }
  };

  const handleDeleteMemberType = async (index: number) => {
    try {
      const updatedMemberTypes =
        association?.memberTypes?.filter((_, i) => i !== index) || [];

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ memberTypes: updatedMemberTypes }),
        }
      );

      if (response.ok) {
        setAssociation((prev) =>
          prev
            ? {
                ...prev,
                memberTypes: updatedMemberTypes,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Erreur suppression type membre:", error);
    }
  };

  const handleUpdateAccessRights = async (field: string, value: string) => {
    try {
      const updatedAccessRights = {
        ...association?.accessRights,
        [field]: value,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ accessRights: updatedAccessRights }),
        }
      );

      if (response.ok) {
        setAssociation((prev) =>
          prev
            ? {
                ...prev,
                accessRights: updatedAccessRights,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Erreur modification droits accès:", error);
    }
  };

  const handleUpdateCotisationSettings = async (field: string, value: any) => {
    try {
      const updatedCotisationSettings = {
        ...association?.cotisationSettings,
        [field]: value,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cotisationSettings: updatedCotisationSettings,
          }),
        }
      );

      if (response.ok) {
        setAssociation((prev) =>
          prev
            ? {
                ...prev,
                cotisationSettings: updatedCotisationSettings,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Erreur modification paramètres cotisations:", error);
    }
  };

  const handleEditBureauMember = (role: string, member: any) => {
    // TODO: Implémenter la modification des membres du bureau
    console.log("Modifier membre bureau:", role, member);
  };

  const handleDeleteCustomRole = async (roleKey: string) => {
  const roleToDelete = association?.centralBoard?.[roleKey];

  // ✅ VÉRIFICATION : Le rôle est-il attribué à quelqu'un ?
  if (roleToDelete?.userId) {
    toast.error("Impossible de supprimer ce rôle", {
      description: `Le rôle "${roleToDelete.role}" est actuellement attribué à ${roleToDelete.name}. Retirez d'abord l'assignation.`,
      duration: 5000,
    });
    return;
  }

  setConfirmDialog({
    isOpen: true,
    title: "Supprimer le rôle personnalisé",
    message: `Êtes-vous sûr de vouloir supprimer le rôle "${roleToDelete?.role}" ? Cette action est irréversible.`,
    onConfirm: async () => {
      try {
        // ✅ PROBLÈME 2 : Logs pour debug backend
        console.log('🗑️ Suppression rôle:', {
          roleKey,
          roleData: roleToDelete,
          associationId,
          currentBoard: association?.centralBoard
        });

        const updatedCentralBoard = { ...association?.centralBoard };
        delete updatedCentralBoard[roleKey];

        console.log('📝 Nouveau bureau après suppression:', updatedCentralBoard);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ centralBoard: updatedCentralBoard }),
          }
        );

        console.log('📡 Réponse serveur:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Réponse serveur OK:', result);

          // ✅ Mise à jour état local
          setAssociation((prev) =>
            prev
              ? {
                  ...prev,
                  centralBoard: updatedCentralBoard,
                }
              : null
          );

          toast.success("Rôle supprimé avec succès", {
            description: `Le rôle "${roleToDelete?.role}" a été retiré du bureau central`,
          });
        } else {
          const errorData = await response.text();
          console.error('❌ Erreur serveur:', response.status, errorData);
          throw new Error(`Erreur serveur: ${response.status}`);
        }
      } catch (error) {
        console.error("❌ Erreur suppression rôle:", error);
        toast.error("Erreur lors de la suppression", {
          description: "Le rôle n'a pas pu être supprimé. Vérifiez la console pour plus de détails.",
        });
      } finally {
        setConfirmDialog(null);
      }
    },
    onCancel: () => setConfirmDialog(null)
  });
};

  const handleAddCustomRole = async () => {
    if (!newCustomRole.name.trim() || !newCustomRole.description.trim()) {
      // ❌ Remplacer : alert("Veuillez remplir le nom et la description du rôle");
      toast.error("Veuillez remplir le nom et la description du rôle");
      return;
    }

    const roleKey = newCustomRole.name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    // Structure du rôle...
    const customRole = {
      role: newCustomRole.name.trim(),
      description: newCustomRole.description.trim(),
      permissions: newCustomRole.permissions || [],
      optional: true,
      createdAt: new Date().toISOString(),
      userId: null,
      name: null,
      phoneNumber: null,
    };

    try {
      const updatedCentralBoard = {
        ...association?.centralBoard,
        [roleKey]: customRole,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ centralBoard: updatedCentralBoard }),
        }
      );

      if (response.ok) {
        setAssociation((prev) =>
          prev
            ? {
                ...prev,
                centralBoard: updatedCentralBoard,
              }
            : null
        );

        setNewCustomRole({
          name: "",
          description: "",
          permissions: [],
        });
        setShowAddCustomRole(false);

        // ✅ Toast de succès personnalisé
        toast.success("Rôle personnalisé créé avec succès", {
          description: `Le rôle "${newCustomRole.name}" a été ajouté au bureau central`,
          duration: 4000,
        });
      } else {
        throw new Error("Erreur serveur");
      }
    } catch (error) {
      console.error("Erreur ajout rôle personnalisé:", error);
      // ❌ Remplacer : alert("Erreur lors de la création du rôle");
      toast.error("Erreur lors de la création du rôle", {
        description: "Veuillez réessayer ou contacter le support",
      });
    }
  };

  const loadMembers = async () => {
    if (!token || !associationId) return;

    setIsLoadingMembers(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setMembers(result.data.members || []);
      }
    } catch (error) {
      console.error("Erreur chargement membres:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // ✅ Fonction principale handleAssignRole
  const handleAssignRole = async (roleKey: string, role: any) => {
    console.log("Attribution rôle:", roleKey, role);

    // Préparer les données du rôle actuel
    setCurrentRole({ key: roleKey, data: role });

    // Pré-sélectionner le membre actuel s'il y en a un
    if (role.userId) {
      setSelectedMemberId(role.userId.toString());
    } else {
      setSelectedMemberId("");
    }

    // Charger les membres et ouvrir la modal
    await loadMembers();
    setShowAssignModal(true);
  };

  const handleConfirmAssignRole = async () => {
    if (!currentRole || !selectedMemberId) return;

    try {
      // Trouver le membre sélectionné
      const selectedMember = members.find(
        (m) => m.userId.toString() === selectedMemberId
      );
      if (!selectedMember) {
        toast.error("Membre introuvable", {
          description: "Veuillez sélectionner un membre valide",
        });
        return;
      }

      // Mettre à jour le bureau central
      const updatedCentralBoard = { ...association?.centralBoard };

      // Supprimer le membre de ses anciens rôles personnalisés s'il en avait
      Object.keys(updatedCentralBoard).forEach((key) => {
        const boardRole = updatedCentralBoard[key];
        if (
          boardRole?.optional &&
          boardRole?.userId === selectedMember.userId
        ) {
          // Ne supprimer que si c'est un rôle différent
          if (key !== currentRole.key) {
            delete updatedCentralBoard[key].userId;
            delete updatedCentralBoard[key].name;
            delete updatedCentralBoard[key].phoneNumber;
            delete updatedCentralBoard[key].assignedAt;
          }
        }
      });

      // Assigner le rôle au membre sélectionné
      updatedCentralBoard[currentRole.key] = {
        ...currentRole.data,
        userId: selectedMember.userId,
        name: `${selectedMember.user.firstName} ${selectedMember.user.lastName}`,
        phoneNumber: selectedMember.user.phoneNumber,
        assignedAt: new Date().toISOString(),
      };

      // Sauvegarder en base
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ centralBoard: updatedCentralBoard }),
        }
      );

      if (response.ok) {
        // Mettre à jour l'état local
        setAssociation((prev) =>
          prev
            ? {
                ...prev,
                centralBoard: updatedCentralBoard,
              }
            : null
        );

        // Fermer la modal
        setShowAssignModal(false);
        setCurrentRole(null);
        setSelectedMemberId("");

        toast.success(`Rôle attribué avec succès`, {
          description: `${selectedMember.user.firstName} ${selectedMember.user.lastName} est maintenant ${currentRole.data.role}`,
          duration: 5000,
        });
      } else {
        throw new Error("Erreur serveur");
      }
    } catch (error) {
      console.error("Erreur attribution rôle:", error);
      toast.error("Erreur lors de l'attribution", {
        description: "Le rôle n'a pas pu être attribué au membre sélectionné",
      });
    }
  };

  const handleRemoveRoleAssignment = async () => {
    if (!currentRole) return;

    // ❌ Remplacer : if (!confirm(`Êtes-vous sûr de vouloir retirer ce rôle à ${currentRole.data.name} ?`))

    // ✅ Nouvelle approche
    showConfirmDialog(
      "Retirer l'assignation du rôle",
      `Êtes-vous sûr de vouloir retirer le rôle "${currentRole.data.role}" à ${currentRole.data.name} ?`,
      async () => {
        try {
          const updatedCentralBoard = { ...association?.centralBoard };

          updatedCentralBoard[currentRole.key] = {
            ...currentRole.data,
            userId: null,
            name: null,
            phoneNumber: null,
            assignedAt: null,
          };

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ centralBoard: updatedCentralBoard }),
            }
          );

          if (response.ok) {
            setAssociation((prev) =>
              prev
                ? {
                    ...prev,
                    centralBoard: updatedCentralBoard,
                  }
                : null
            );

            setShowAssignModal(false);
            setCurrentRole(null);

            toast.success("Rôle retiré avec succès", {
              description: `${currentRole.data.name} n'occupe plus le rôle de ${currentRole.data.role}`,
            });
          }
        } catch (error) {
          console.error("Erreur retrait rôle:", error);
          toast.error("Erreur lors du retrait", {
            description: "Le rôle n'a pas pu être retiré",
          });
        } finally {
          setConfirmDialog(null);
        }
      }
    );
  };

  const getAvailableMembers = () => {
    if (!members) return [];

    const assignedUserIds = new Set();

    // Ajouter les membres ayant déjà des rôles dans le bureau central
    if (association?.centralBoard) {
      Object.values(association.centralBoard).forEach((boardMember: any) => {
        if (
          boardMember.userId &&
          boardMember.userId !== currentRole?.data.userId
        ) {
          assignedUserIds.add(boardMember.userId);
        }
      });
    }

    return members.filter(
      (member) =>
        member.status === "active" && !assignedUserIds.has(member.userId)
    );
  };

  const handleUpdatePermission = async (permissionKey: string, permissionConfig: any) => {
  try {
    const updatedPermissionsMatrix = {
      ...association?.permissionsMatrix,
      [permissionKey]: permissionConfig
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
      {
        method: "PUT", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          permissionsMatrix: updatedPermissionsMatrix
        }),
      }
    );

    if (response.ok) {
      setAssociation((prev) =>
        prev
          ? {
              ...prev,
              permissionsMatrix: updatedPermissionsMatrix,
            }
          : null
      );
      
      toast.success("Permissions mises à jour", {
        description: `Les droits d'accès pour "${permissionKey}" ont été modifiés`,
      });
    } else {
      throw new Error('Erreur lors de la mise à jour');
    }
  } catch (error) {
    console.error("Erreur mise à jour permissions:", error);
    toast.error("Erreur lors de la mise à jour des permissions");
  }
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  if (!association) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Association introuvable
        </h2>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
            Paramètres - {association.name}
          </h1>
          <p className="text-gray-600">
            Configuration avancée de votre association
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: "members", label: "Types de membres", icon: Users },
            ...(association?.isMultiSection
              ? [{ key: "sections", label: "Sections", icon: Building2 }]
              : []),
            { key: "access", label: "Droits d'accès", icon: Shield },
            { key: "cotisations", label: "Cotisations", icon: Euro },
            { key: "bureau", label: "Bureau", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
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

      {/* Content */}
      {activeTab === "members" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Types de membres
              </CardTitle>
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un type
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formulaire d'ajout */}
            {showAddForm && (
              <Card className="p-4 border-dashed border-2 border-gray-300">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Nom du type"
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
                      placeholder="Cotisation (€)"
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
                    placeholder="Description du type de membre"
                    value={newMemberType.description}
                    onChange={(e) =>
                      setNewMemberType((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {permissionOptions.map((option) => (
                        <label
                          key={option.key}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="checkbox"
                            checked={newMemberType.permissions.includes(
                              option.key
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewMemberType((prev) => ({
                                  ...prev,
                                  permissions: [
                                    ...prev.permissions,
                                    option.key,
                                  ],
                                }));
                              } else {
                                setNewMemberType((prev) => ({
                                  ...prev,
                                  permissions: prev.permissions.filter(
                                    (p) => p !== option.key
                                  ),
                                }));
                              }
                            }}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddMemberType}>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Liste des types existants */}
            <div className="space-y-3">
              {association.memberTypes.map((type, index) => (
                <Card key={index} className="p-4">
                  {editingMemberType === index ? (
                    <EditMemberTypeForm
                      memberType={type}
                      onSave={(updatedType) =>
                        handleUpdateMemberType(index, updatedType)
                      }
                      onCancel={() => setEditingMemberType(null)}
                      permissionOptions={permissionOptions}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <h4 className="font-medium capitalize">
                            {type.name.replace("_", " ")}
                          </h4>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-700"
                          >
                            {type.cotisationAmount}€/mois
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {type.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {type.permissions.map((perm) => (
                            <Badge
                              key={perm}
                              variant="outline"
                              className="text-xs"
                            >
                              {permissionOptions.find((p) => p.key === perm)
                                ?.label || perm}
                            </Badge>
                          ))}
                        </div>
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
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "access" && (
  <Card>
    <CardHeader>
      <CardTitle>Droits d'accès et autorisations</CardTitle>
      <p className="text-sm text-gray-600">
        Configurez qui peut effectuer quelles actions dans votre association
      </p>
    </CardHeader>
    <CardContent className="space-y-6">
      
      {/* Actions disponibles */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Permissions par action</h3>
        
        {[
          {
            key: 'view_finances',
            label: 'Voir les finances',
            description: 'Accès aux données financières (cotisations, budget, transactions)'
          },
          {
            key: 'manage_members', 
            label: 'Gérer les membres',
            description: 'Ajouter, modifier, suspendre des membres'
          },
          {
            key: 'approve_aids',
            label: 'Approuver les aides',
            description: 'Valider et approuver les demandes d\'aide'
          },
          {
            key: 'view_member_list',
            label: 'Voir la liste des membres', 
            description: 'Accès à la liste complète des membres'
          },
          {
            key: 'export_data',
            label: 'Exporter des données',
            description: 'Télécharger des rapports et données de l\'association'
          },
          {
            key: 'manage_events',
            label: 'Gérer les événements',
            description: 'Créer et organiser des événements'
          }
          ].map((permission) => {
  const currentPermission = association?.permissionsMatrix?.[permission.key] || { allowed_roles: [] };
  
  // ✅ S'assurer que admin_association est toujours inclus
  const ensureAdminIncluded = (roles: string[]) => {
    if (!roles.includes('admin_association')) {
      return ['admin_association', ...roles];
    }
    return roles;
  };
  
  return (
    <div key={permission.key} className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{permission.label}</h4>
          <p className="text-sm text-gray-500 mt-1">{permission.description}</p>
          
          {/* Note importante */}
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            📝 L'administrateur a automatiquement tous les droits et ne peut pas être retiré
          </div>
          
          {/* Rôles autorisés */}
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Rôles autorisés :</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'admin_association', label: 'Administrateur', locked: true },
                { value: 'president', label: 'Président', locked: false },
                { value: 'secretaire', label: 'Secrétaire', locked: false },
                { value: 'tresorier', label: 'Trésorier', locked: false },
                { value: 'responsable_section', label: 'Responsable section', locked: false },
                { value: 'secretaire_section', label: 'Secrétaire section', locked: false },
                { value: 'tresorier_section', label: 'Trésorier section', locked: false }
              ].map((role) => (
                <label key={role.value} className={`flex items-center space-x-2 ${role.locked ? 'opacity-75' : ''}`}>
                  <input
                    type="checkbox"
                    checked={ensureAdminIncluded(currentPermission.allowed_roles).includes(role.value)}
                    disabled={role.locked} // ✅ Admin ne peut pas être décoché
                    onChange={(e) => {
                      if (role.locked) return; // Sécurité supplémentaire
                      
                      let updatedRoles = e.target.checked
                        ? [...currentPermission.allowed_roles, role.value]
                        : currentPermission.allowed_roles.filter(r => r !== role.value);
                      
                      // ✅ Toujours s'assurer que admin est inclus
                      updatedRoles = ensureAdminIncluded(updatedRoles);
                      
                      handleUpdatePermission(permission.key, {
                        ...currentPermission,
                        allowed_roles: updatedRoles
                      });
                    }}
                    className={`rounded border-gray-300 ${role.locked ? 'cursor-not-allowed' : ''}`}
                  />
                  <span className={`text-sm ${role.locked ? 'text-gray-500 font-medium' : 'text-gray-700'}`}>
                    {role.label} {role.locked && '(toujours activé)'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})}
        
      </div>

      {/* Permissions par rôle - Vue alternative */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-lg font-medium">Vue par rôle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'president', label: 'Président', color: 'bg-blue-50 border-blue-200' },
            { key: 'secretaire', label: 'Secrétaire', color: 'bg-green-50 border-green-200' },
            { key: 'tresorier', label: 'Trésorier', color: 'bg-purple-50 border-purple-200' },
            { key: 'admin_association', label: 'Administrateur', color: 'bg-red-50 border-red-200' }
          ].map((role) => {
            const rolePermissions = Object.entries(association?.permissionsMatrix || {})
              .filter(([_, config]) => config.allowed_roles?.includes(role.key))
              .map(([key, _]) => key);

            return (
              <div key={role.key} className={`border rounded-lg p-4 ${role.color}`}>
                <h4 className="font-medium text-gray-900 mb-2">{role.label}</h4>
                <div className="space-y-1">
                  {rolePermissions.length > 0 ? (
                    rolePermissions.map((perm) => (
                      <div key={perm} className="text-sm text-gray-600">
                        • {[
                          { key: 'view_finances', label: 'Voir les finances' },
                          { key: 'manage_members', label: 'Gérer les membres' },
                          { key: 'approve_aids', label: 'Approuver les aides' },
                          { key: 'view_member_list', label: 'Voir la liste des membres' },
                          { key: 'export_data', label: 'Exporter des données' },
                          { key: 'manage_events', label: 'Gérer les événements' }
                        ].find(p => p.key === perm)?.label || perm}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">Aucune permission spécifique</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </CardContent>
  </Card>
)}

      {activeTab === "cotisations" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Paramètres des cotisations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jour d'échéance mensuelle
                  </label>
                  <select
                    value={association.cotisationSettings.dueDay}
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
                        {day} de chaque mois
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Délai de grâce (jours)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={association.cotisationSettings.gracePeriodDays}
                    onChange={(e) =>
                      handleUpdateCotisationSettings(
                        "gracePeriodDays",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nombre de jours après l'échéance avant considération en
                    retard
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seuil d'inactivité (mois)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={
                      association.cotisationSettings.inactivityThresholdMonths
                    }
                    onChange={(e) =>
                      handleUpdateCotisationSettings(
                        "inactivityThresholdMonths",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nombre de mois sans cotiser avant passage en statut inactif
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={association.cotisationSettings.lateFeesEnabled}
                      onChange={(e) =>
                        handleUpdateCotisationSettings(
                          "lateFeesEnabled",
                          e.target.checked
                        )
                      }
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Activer les frais de retard
                    </span>
                  </label>
                </div>

                {association.cotisationSettings.lateFeesEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant des frais de retard (€)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={association.cotisationSettings.lateFeesAmount}
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
                    Mode de paiement
                  </h4>
                  <p className="text-sm text-blue-700">
                    Carte bancaire prioritaire pour des paiements instantanés.
                    Les virements bancaires restent possibles mais avec délais
                    de traitement.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Aperçu des règles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {association.cotisationSettings.dueDay}
                  </div>
                  <div className="text-sm text-gray-600">Jour d'échéance</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {association.cotisationSettings.gracePeriodDays}
                  </div>
                  <div className="text-sm text-gray-600">Jours de grâce</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {association.cotisationSettings.inactivityThresholdMonths}
                  </div>
                  <div className="text-sm text-gray-600">
                    Mois avant inactivité
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "bureau" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gestion du bureau
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bureau Central Actuel */}
            <div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {association.centralBoard &&
                  Object.entries(association.centralBoard).map(
                    ([role, member]) => (
                      <Card key={role} className="p-4">
                        <div className="text-center">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {member.role}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {member.name}
                          </p>
                          {member.phoneNumber && (
                            <p className="text-xs text-gray-500">
                              {member.phoneNumber}
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => handleEditBureauMember(role, member)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </Card>
                    )
                  )}
              </div>
            </div>

            {/* Rôles Personnalisés */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Rôles personnalisés
                </h3>
                <Button
                  onClick={() => setShowAddCustomRole(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un rôle
                </Button>
              </div>

              {/* Formulaire d'ajout */}
              {showAddCustomRole && (
                <Card className="p-4 border-dashed border-2 border-gray-300 mb-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        placeholder="Ex: Commissaire aux comptes"
                        value={newCustomRole.name}
                        onChange={(e) =>
                          setNewCustomRole((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description du rôle *
                      </label>
                      <Textarea
                        placeholder="Ex: Vérification annuelle des comptes de l'association et audit des procédures financières..."
                        value={newCustomRole.description}
                        onChange={(e) =>
                          setNewCustomRole((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Décrivez précisément les responsabilités et missions de
                        ce rôle
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <h4 className="font-medium mb-1">
                            Rôle personnalisé
                          </h4>
                          <p>
                            Ce rôle sera ajouté à votre bureau central. Vous
                            pourrez ensuite assigner un membre à ce poste et
                            définir ses permissions spécifiques selon vos
                            besoins.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleAddCustomRole}>
                        <Save className="h-4 w-4 mr-2" />
                        Créer le rôle
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddCustomRole(false);
                          setNewCustomRole({
                            name: "",
                            description: "",
                            permissions: [], // ✅ Simplifié
                          });
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-3">
                {association?.centralBoard &&
                  Object.entries(association.centralBoard)
                    .filter(([key, role]) => role.optional === true) // Seulement les rôles personnalisés
                    .map(([roleKey, role]) => (
                      <Card key={roleKey} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {role.role}
                              </h4>
                              {/* ✅ Badge simple : occupé ou libre */}
                              <Badge
                                variant={role.userId ? "default" : "outline"}
                                className={
                                  role.userId
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }
                              >
                                {role.userId ? "Occupé" : "Libre"}
                              </Badge>
                              {role.userId && (
                                <Badge variant="secondary" className="text-xs">
                                  {role.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {role.description}
                            </p>
                            <div className="text-xs text-gray-500">
                              {role.createdAt && (
                                <span>
                                  Créé le{" "}
                                  {new Date(role.createdAt).toLocaleDateString(
                                    "fr-FR"
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {/* ✅ Bouton Attribuer/Modifier selon le statut */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignRole(roleKey, role)}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              {role.userId ? "Modifier" : "Attribuer"}
                            </Button>

                            <Button
  size="sm"
  variant="outline"
  className={`text-red-600 ${role.userId ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-700'}`}
  onClick={() => role.userId ? 
    toast.warning("Rôle attribué", {
      description: `Retirez d'abord l'assignation de ${role.name} avant de supprimer ce rôle.`
    }) : 
    handleDeleteCustomRole(roleKey)
  }
  disabled={!!role.userId}
  title={role.userId ? `Rôle attribué à ${role.name}` : "Supprimer ce rôle"}
>
  <Trash2 className="h-4 w-4" />
</Button>

                            

                          </div>
                        </div>
                      </Card>
                    ))}

                {/* ✅ Message si pas de rôles personnalisés */}
                {(!association?.centralBoard ||
                  Object.values(association.centralBoard).filter(
                    (role) => role.optional === true
                  ).length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Aucun rôle personnalisé configuré</p>
                    <p className="text-sm">
                      Ajoutez des rôles comme "Commissaire aux comptes" ou
                      "Chargé communication"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow de succession */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Mandats et transitions
              </h3>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">
                      Gestion des mandats
                    </h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Fonctionnalité à venir : Configuration des durées de
                      mandat, élections automatiques, et workflow de passation
                      de pouvoirs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "sections" && association && (
        <div className="space-y-6">
          <SectionsTab
            association={{
              id: association.id,
              name: association.name,
              isMultiSection: association.isMultiSection || false,
              features: association.features,
            }}
            token={token}
          />
        </div>
      )}

      {showAssignModal && currentRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Attribuer le rôle "{currentRole.data.role}"
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAssignModal(false);
                  setCurrentRole(null);
                  setSelectedMemberId("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {currentRole.data.description}
              </p>

              {/* Membre actuellement assigné */}
              {currentRole.data.userId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Actuellement assigné à :
                      </p>
                      <p className="text-sm text-blue-700">
                        {currentRole.data.name}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={handleRemoveRoleAssignment}
                    >
                      Retirer
                    </Button>
                  </div>
                </div>
              )}

              {/* Sélection nouveau membre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentRole.data.userId ? "Réassigner à :" : "Attribuer à :"}
                </label>

                {isLoadingMembers ? (
                  <p className="text-sm text-gray-500">
                    Chargement des membres...
                  </p>
                ) : (
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                  >
                    <option value="">Sélectionner un membre...</option>
                    {getAvailableMembers().map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.user.firstName} {member.user.lastName} -{" "}
                        {member.user.phoneNumber} ({member.memberType})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleConfirmAssignRole}
                disabled={!selectedMemberId}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Confirmer
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignModal(false);
                  setCurrentRole(null);
                  setSelectedMemberId("");
                }}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

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
          Annuler
        </Button>
        <Button
          onClick={confirmDialog.onConfirm}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          Supprimer
        </Button>
      </div>
    </div>
  </div>
)}
      
    </div>
  );
}

// Composant pour éditer un type de membre
function EditMemberTypeForm({
  memberType,
  onSave,
  onCancel,
  permissionOptions,
}: {
  memberType: MemberType;
  onSave: (type: MemberType) => void;
  onCancel: () => void;
  permissionOptions: Array<{ key: string; label: string }>;
}) {
  const [editedType, setEditedType] = useState(memberType);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Nom du type"
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
          placeholder="Cotisation (€)"
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
        placeholder="Description"
        value={editedType.description}
        onChange={(e) =>
          setEditedType((prev) => ({
            ...prev,
            description: e.target.value,
          }))
        }
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Permissions
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {permissionOptions.map((option) => (
            <label key={option.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedType.permissions.includes(option.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEditedType((prev) => ({
                      ...prev,
                      permissions: [...prev.permissions, option.key],
                    }));
                  } else {
                    setEditedType((prev) => ({
                      ...prev,
                      permissions: prev.permissions.filter(
                        (p) => p !== option.key
                      ),
                    }));
                  }
                }}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(editedType)}>
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  associationId,
  token,
  onUpdate,
}: SectionCardProps) {
  const router = useRouter(); // ✅ AJOUT MANQUANT
  const [isEditingBureau, setIsEditingBureau] = useState(false);
  const [bureauForm, setBureauForm] = useState(section.bureauSection || {});

  const handleUpdateBureau = async () => {
    if (!token) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${section.id}/bureau`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bureauSection: bureauForm }),
        }
      );

      if (response.ok) {
        setIsEditingBureau(false);
        onUpdate();
      }
    } catch (error) {
      console.error("Erreur mise à jour bureau section:", error);
    }
  };

  return (
    <Card className="p-4">
      {/* Header section */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900">{section.name}</h3>
          <p className="text-sm text-gray-600">
            📍 {section.city}, {section.country} • {section.currency}
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {section.membersCount} membres
        </Badge>
      </div>

      {/* Bureau section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Bureau section</h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditingBureau(!isEditingBureau)}
          >
            {isEditingBureau ? (
              <X className="h-3 w-3" />
            ) : (
              <Edit className="h-3 w-3" />
            )}
          </Button>
        </div>

        {isEditingBureau ? (
          <BureauSectionForm
            bureau={bureauForm}
            setBureau={setBureauForm}
            onSave={handleUpdateBureau}
            onCancel={() => setIsEditingBureau(false)}
          />
        ) : (
          <div className="space-y-2">
            {["responsable", "secretaire", "tresorier"].map((role) => {
              const member = section.bureauSection?.[role];
              return (
                <div
                  key={role}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600 capitalize">{role}:</span>
                  <span className="text-gray-900">
                    {member ? (
                      member.name
                    ) : (
                      <em className="text-gray-400">Non assigné</em>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t pt-4 mt-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() =>
              router.push(
                `/modules/associations/${associationId}/sections/${section.id}`
              )
            }
          >
            Gérer
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() =>
              router.push(
                `/modules/associations/${associationId}/sections/${section.id}/members`
              )
            }
          >
            Membres
          </Button>
        </div>
      </div>
    </Card>
  );
}

// 6. Composant formulaire bureau section
function BureauSectionForm({
  bureau,
  setBureau,
  onSave,
  onCancel,
}: BureauSectionFormProps) {
  return (
    <div className="space-y-3">
      {(["responsable", "secretaire", "tresorier"] as const).map((role) => (
        <div key={role}>
          <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
            {role} section
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Nom complet"
              value={bureau[role]?.name || ""}
              onChange={(e) =>
                setBureau((prev: any) => ({
                  // ✅ TYPAGE EXPLICITE
                  ...prev,
                  [role]: { ...prev[role], name: e.target.value },
                }))
              }
              className="text-sm"
            />
            <Input
              placeholder="Téléphone"
              value={bureau[role]?.phoneNumber || ""}
              onChange={(e) =>
                setBureau((prev: any) => ({
                  // ✅ TYPAGE EXPLICITE
                  ...prev,
                  [role]: { ...prev[role], phoneNumber: e.target.value },
                }))
              }
              className="text-sm"
            />
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={onSave} className="flex-1">
          <Save className="h-3 w-3 mr-1" />
          Sauvegarder
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}
