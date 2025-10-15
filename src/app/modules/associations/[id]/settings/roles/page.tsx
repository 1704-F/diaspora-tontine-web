// src/app/modules/associations/[id]/settings/roles/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAssociation, useRoles, usePermissions } from "@/hooks/association";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Shield,
  Users,
  Lock,
  Crown,
  Edit,
  Trash2,
  Settings,
  Info,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// ============================================
// IMPORTS MODALS
// ============================================
import { CreateRoleModal } from '@/components/modules/associations/roles/modals/CreateRoleModal';
import { EditRoleModal } from '@/components/modules/associations/roles/modals/EditRoleModal';
import { DeleteRoleModal } from '@/components/modules/associations/roles/modals/DeleteRoleModal';
import { AssignRolesModal } from '@/components/modules/associations/roles/modals/AssignRolesModal';
import { CustomPermissionsModal } from '@/components/modules/associations/roles/modals/CustomPermissionsModal';
import { TransferAdminModal } from '@/components/modules/associations/roles/modals/TransferAdminModal';

// ============================================
// IMPORTS UI COMPONENTS
// ============================================
import { RoleBadge } from '@/components/modules/associations/roles/ui/RoleBadge';

// ============================================
// IMPORTS TYPES
// ============================================
import { RoleWithUsage } from '@/types/association/role';
import { AssociationMember } from '@/types/association/member';

interface ModalState {
  type: 
    | 'create-role'
    | 'edit-role'
    | 'delete-role'
    | 'assign-roles'
    | 'custom-permissions'
    | 'transfer-admin'
    | null;
  data?: RoleWithUsage | AssociationMember;
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export default function RolesManagementPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("roles");
  const tCommon = useTranslations("common");

  const associationId = parseInt(params.id as string);

  // ✅ Hooks RBAC
  const { association, currentMembership, loading: loadingAssociation } = useAssociation(associationId);
  const { roles, availablePermissions, loading: loadingRoles, refetch: refetchRoles } = useRoles(associationId);
  const { isAdmin, canManageRoles } = usePermissions(associationId);

  // ✅ États modals
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  // ✅ Calculer statistiques
  const stats = {
    totalRoles: roles.length,
    totalPermissions: availablePermissions.length,
    totalAdmins: association?.activeMembers || 0,
  };

  // Dans le useEffect de la page (ligne 88-119)
useEffect(() => {
  // Attendre que les données soient chargées
  if (loadingAssociation || loadingRoles) {
    console.log('⏳ Roles Page - En attente du chargement...');
    return;
  }
  
  if (!currentMembership) {
    console.log('⏳ Roles Page - En attente de currentMembership...');
    return;
  }

  // ✅ AJOUT : Attendre que isAdmin se stabilise
  if (currentMembership && !isAdmin && !canManageRoles) {
    // Petit délai pour laisser le temps aux hooks de se synchroniser
    const timer = setTimeout(() => {
      console.log('🔐 Roles Page - Permission Check:', {
        loadingAssociation,
        loadingRoles,
        hasCurrentMembership: !!currentMembership,
        isAdmin,
        canManageRoles,
        currentMembershipIsAdmin: currentMembership?.isAdmin, // ← DEBUG
        shouldRedirect: !isAdmin && !canManageRoles
      });
      
      // Vérifier les permissions seulement si vraiment pas admin
      if (!isAdmin && !canManageRoles && !currentMembership.isAdmin) {
        console.log('❌ Roles Page - Permissions insuffisantes, redirection...');
        toast.error(t("errors.insufficient_permissions"));
        router.push(`/modules/associations/${associationId}`);
      } else {
        console.log('✅ Roles Page - Accès autorisé');
      }
    }, 100); // 100ms pour laisser React se synchroniser

    return () => clearTimeout(timer);
  }
  
  console.log('✅ Roles Page - Accès autorisé (isAdmin ou canManageRoles)');
}, [isAdmin, canManageRoles, loadingAssociation, loadingRoles, currentMembership, associationId, router, t]);
 
  // ============================================
  // HANDLERS
  // ============================================

  const handleCreateRole = () => {
    setModalState({ type: 'create-role' });
  };

  const handleEditRole = (role: RoleWithUsage) => {
    setModalState({ type: 'edit-role', data: role });
  };

  const handleDeleteRole = (role: RoleWithUsage) => {
    setModalState({ type: 'delete-role', data: role });
  };

  const handleTransferAdmin = () => {
    setModalState({ type: 'transfer-admin' });
  };

  const closeModal = () => {
    setModalState({ type: null, data: undefined });
  };

  const handleModalSuccess = async () => {
    closeModal();
    await refetchRoles();
    toast.success(t("success.changes_saved"));
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderRoleCard = (role: RoleWithUsage) => {
    return (
      <Card key={role.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Badge coloré avec RoleBadge component */}
              <RoleBadge 
                role={role} 
                size="md" 
                showIcon={true}
                showTooltip={false}
              />
            </div>

            {/* Badges statut */}
            <div className="flex gap-2">
              {role.isUnique && (
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Unique
                </Badge>
              )}
              {role.isMandatory && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  Obligatoire
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4">{role.description}</p>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">{t("permissions")}</p>
              <p className="text-lg font-semibold text-gray-900">
                {role.permissions?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">{t("members")}</p>
              <p className="text-lg font-semibold text-gray-900">
                {role.membersCount || 0}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEditRole(role)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              {tCommon("edit")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDeleteRole(role)}
              className="text-red-600 hover:text-red-700"
              disabled={role.isMandatory}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loadingAssociation || loadingRoles || !currentMembership) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

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
            {tCommon("back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t("title")}
            </h1>
            <p className="text-gray-600">{t("subtitle")}</p>
          </div>
        </div>

        {/* Bouton Créer */}
        {(isAdmin || canManageRoles) && (
          <Button
            onClick={handleCreateRole}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("actions.create_role")}
          </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRoles}</p>
                <p className="text-sm text-gray-600">{t("stats.roles")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Lock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPermissions}</p>
                <p className="text-sm text-gray-600">{t("stats.permissions")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAdmins}</p>
                <p className="text-sm text-gray-600">{t("stats.admins")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info box si pas de rôles */}
      {roles.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("empty_state.title")}
            </h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              {t("empty_state.description")}
            </p>
            <Button onClick={handleCreateRole}>
              <Plus className="h-4 w-4 mr-2" />
              {t("actions.create_first_role")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Liste des rôles */}
      {roles.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("roles_list")} ({roles.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(renderRoleCard)}
          </div>
        </>
      )}

      {/* Actions additionnelles */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t("admin_actions.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={handleTransferAdmin}
              className="w-full justify-start"
            >
              <Crown className="h-4 w-4 mr-2" />
              {t("admin_actions.transfer_admin")}
            </Button>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">{t("admin_actions.info_title")}</p>
                  <p>{t("admin_actions.info_description")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================
          MODALS
          ============================================ */}

      {modalState.type === 'create-role' && (
        <CreateRoleModal
          isOpen={true}
          onClose={closeModal}
          associationId={associationId}
          onSuccess={handleModalSuccess}
        />
      )}

      {modalState.type === 'edit-role' && modalState.data && (
        <EditRoleModal
          isOpen={true}
          onClose={closeModal}
          associationId={associationId}
          role={modalState.data as RoleWithUsage}
          onSuccess={handleModalSuccess}
        />
      )}

      {modalState.type === 'delete-role' && modalState.data && (
        <DeleteRoleModal
          isOpen={true}
          onClose={closeModal}
          associationId={associationId}
          role={modalState.data as RoleWithUsage}
          onSuccess={handleModalSuccess}
        />
      )}

      {modalState.type === 'assign-roles' && modalState.data && (
        <AssignRolesModal
          isOpen={true}
          onClose={closeModal}
          associationId={associationId}
          member={modalState.data as AssociationMember}
          onSuccess={handleModalSuccess}
        />
      )}

      {modalState.type === 'custom-permissions' && modalState.data && (
        <CustomPermissionsModal
          isOpen={true}
          onClose={closeModal}
          associationId={associationId}
          member={modalState.data as AssociationMember}
          onSuccess={handleModalSuccess}
        />
      )}

      {modalState.type === 'transfer-admin' && (
        <TransferAdminModal
          isOpen={true}
          onClose={closeModal}
          associationId={associationId}
          onSuccess={handleModalSuccess}
        />
      )}

    </div>
  );
}