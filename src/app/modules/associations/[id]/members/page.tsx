// src/app/modules/associations/[id]/members/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  X,
  Eye,
  Edit,
  Trash2,
  Crown,
  MapPin,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  FileDown,
  LayoutGrid,
  List,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Imports hooks
import { useAssociation } from "@/hooks/association/useAssociation";
import { useAssociationMembers } from "@/hooks/association/useAssociationMembers";
import { useSections } from "@/hooks/association/useSections";
import { usePermissions } from "@/hooks/association/usePermissions";
import { useRoles } from "@/hooks/association/useRoles";
import { membersApi } from "@/lib/api/association/members";

// ✅ Imports types
import type {
  AssociationMember,
  FetchMembersParams,
} from "@/types/association/member";

// ✅ Imports components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { StatCard } from "@/components/ui/StatCard";
import { MemberCard } from "@/components/modules/associations/MemberCard";
import { MemberDetailsModal } from "@/components/modules/associations/MemberDetailsModal";
import EditMemberModal from "@/components/modules/associations/EditMemberModal";

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("members");
  const associationId = Number(params.id);

  // ============================================
  // HOOKS
  // ============================================
  const { association, loading: associationLoading } =
    useAssociation(associationId);
  const {
    members,
    pagination,
    loading: membersLoading,
    fetchMembers,
  } = useAssociationMembers(associationId);
  const { sections, fetchSections } = useSections();
  const { canManageMembers, canViewDetails } =
    usePermissions(associationId);
  const { roles } = useRoles(associationId);

  // ============================================
  // ÉTATS LOCAUX
  // ============================================
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMemberType, setSelectedMemberType] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<number | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // ✅ NOUVEAU : Colonnes optionnelles
  const [showStatusColumn, setShowStatusColumn] = useState(false);
  const [showJoinDateColumn, setShowJoinDateColumn] = useState(false);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);

  // États modals
  const [selectedMember, setSelectedMember] =
    useState<AssociationMember | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AssociationMember | null>(
    null
  );

  // ============================================
  // CHARGEMENT INITIAL
  // ============================================
  useEffect(() => {
    const params: FetchMembersParams = {
      search: searchQuery || undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      memberType: selectedMemberType !== "all" ? selectedMemberType : undefined,
      sectionId: selectedSection,
      page: currentPage,
      limit: itemsPerPage,
    };

    fetchMembers(params);
  }, [
    currentPage,
    itemsPerPage,
    searchQuery,
    selectedStatus,
    selectedMemberType,
    selectedSection,
    fetchMembers,
  ]);

  useEffect(() => {
    if (association?.isMultiSection) {
      fetchSections(associationId);
    }
  }, [association, associationId, fetchSections]);

  // ============================================
  // HANDLERS FILTRES
  // ============================================
  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedMemberType("all");
    setSelectedSection(undefined);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleMemberTypeChange = (value: string) => {
    setSelectedMemberType(value);
    setCurrentPage(1);
  };

  const handleSectionChange = (value: string) => {
    setSelectedSection(value === "all" ? undefined : Number(value));
    setCurrentPage(1);
  };

  // ============================================
  // HANDLERS PAGINATION
  // ============================================
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // ============================================
  // HANDLERS ACTIONS
  // ============================================
  const handleExportPDF = async () => {
    try {
      toast.info(t("export.generating"));

      const blob = await membersApi.exportMembersPDF(associationId, {
        search: searchQuery || undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        memberType:
          selectedMemberType !== "all" ? selectedMemberType : undefined,
        sectionId: selectedSection,
      });

      const fileName = `Membres_${association?.name}_${new Date().toISOString().split("T")[0]}.pdf`;
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(t("export.success"));
    } catch (error: unknown) {
      console.error("❌ Erreur export PDF:", error);
      toast.error(t("export.error"));
    }
  };

  const handleViewDetails = (member: AssociationMember) => {
    if (!canViewDetails) {
      toast.error(t("errors.noPermission"));
      return;
    }
    setSelectedMember(member);
    setIsDetailsModalOpen(true);
  };

  const handleEditMember = (member: AssociationMember) => {
    if (!canManageMembers) {
      toast.error(t("errors.noPermission"));
      return;
    }
    setEditingMember(member);
  };

  const handleDeleteMember = async (member: AssociationMember) => {
    if (!canManageMembers) {
      toast.error(t("errors.noPermission"));
      return;
    }
    toast.info("Fonctionnalité de suppression à venir");
  };

  const loadData = useCallback(async () => {
    const params: FetchMembersParams = {
      search: searchQuery || undefined,
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      memberType: selectedMemberType !== "all" ? selectedMemberType : undefined,
      sectionId: selectedSection,
      page: currentPage,
      limit: itemsPerPage,
    };
    await fetchMembers(params);
  }, [
    searchQuery,
    selectedStatus,
    selectedMemberType,
    selectedSection,
    currentPage,
    itemsPerPage,
    fetchMembers,
  ]);

  // ============================================
  // HELPERS
  // ============================================
  const getStatusBadge = (status: AssociationMember["status"]) => {
    const config = {
      active: { variant: "success" as const, label: t("status.active") },
      pending: { variant: "warning" as const, label: t("status.pending") },
      inactive: { variant: "secondary" as const, label: t("status.inactive") },
      suspended: { variant: "danger" as const, label: t("status.suspended") },
    };
    const statusConfig = config[status] || config.inactive;
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculer statistiques
  const stats = {
    total: pagination.total,
    active: members.filter((m) => m.status === "active").length,
    pending: members.filter((m) => m.status === "pending").length,
    sections: association?.isMultiSection ? sections.length : 1,
  };

  // ============================================
  // RENDU LOADING
  // ============================================
  if (associationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!association) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{t("errors.associationNotFound")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDU PRINCIPAL
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ✅ HEADER */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                {t("title")}
              </h1>
              <p className="text-gray-600 mt-2">{t("subtitle")}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Toggle Vue Liste/Grille */}
              <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  {t("viewList")}
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="flex items-center gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  {t("viewGrid")}
                </Button>
              </div>

              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="flex items-center gap-2 shadow-sm"
              >
                <FileDown className="h-4 w-4" />
                {t("exportPDF")}
              </Button>
              {canManageMembers && (
                <Button
                  onClick={() =>
                    router.push(
                      `/modules/associations/${associationId}/members/add`
                    )
                  }
                  className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
                >
                  <UserPlus className="h-4 w-4" />
                  {t("addMember")}
                </Button>
              )}
            </div>
          </div>

          {/* ✅ STATISTIQUES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title={t("stats.totalMembers")}
              value={stats.total}
              icon={Users}
              color="blue"
              subtitle={t("stats.registered")}
            />
            <StatCard
              title={t("stats.activeMembers")}
              value={stats.active}
              icon={Users}
              color="green"
              trend={{
                value: "+12%",
                isPositive: true,
              }}
            />
            <StatCard
              title={t("stats.pendingMembers")}
              value={stats.pending}
              icon={Users}
              color="orange"
              subtitle={t("stats.awaitingValidation")}
            />
            <StatCard
              title={t("stats.sections")}
              value={stats.sections}
              icon={Users}
              color="purple"
            />
          </div>
        </div>

        {/* ✅ FILTRES */}
        <Card className="mb-6 shadow-sm">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5 text-primary" />
                {t("filters.title")}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? t("filters.hide") : t("filters.show")}
              </Button>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Barre de recherche */}
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder={t("filters.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10 h-11"
                    />
                  </div>
                  <Button onClick={handleSearch} className="h-11 px-6">
                    {t("filters.search")}
                  </Button>
                </div>

                {/* Filtres avancés */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <Select
                    value={selectedStatus}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("filters.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("filters.allStatuses")}
                      </SelectItem>
                      <SelectItem value="active">
                        {t("status.active")}
                      </SelectItem>
                      <SelectItem value="pending">
                        {t("status.pending")}
                      </SelectItem>
                      <SelectItem value="inactive">
                        {t("status.inactive")}
                      </SelectItem>
                      <SelectItem value="suspended">
                        {t("status.suspended")}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedMemberType}
                    onValueChange={handleMemberTypeChange}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("filters.memberType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t("filters.allTypes")}
                      </SelectItem>
                      {association.memberTypes?.map((type) => (
                        <SelectItem key={type.name} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {association.isMultiSection && (
                    <Select
                      value={selectedSection?.toString() || "all"}
                      onValueChange={handleSectionChange}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={t("filters.section")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("filters.allSections")}
                        </SelectItem>
                        {sections.map((section) => (
                          <SelectItem
                            key={section.id}
                            value={section.id.toString()}
                          >
                            {section.name} ({section.city})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="flex items-center gap-2 h-11"
                  >
                    <X className="h-4 w-4" />
                    {t("filters.reset")}
                  </Button>
                </div>

                {/* Pills filtres actifs */}
                <div className="flex flex-wrap gap-2">
                  {selectedStatus !== "all" && (
                    <Badge variant="secondary" className="pl-3 pr-2 py-1">
                      {t("filters.filterStatus")}: {selectedStatus}
                      <button
                        onClick={() => setSelectedStatus("all")}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedMemberType !== "all" && (
                    <Badge variant="secondary" className="pl-3 pr-2 py-1">
                      {t("filters.filterType")}: {selectedMemberType}
                      <button
                        onClick={() => setSelectedMemberType("all")}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedSection && (
                    <Badge variant="secondary" className="pl-3 pr-2 py-1">
                      {t("filters.filterSection")}:{" "}
                      {sections.find((s) => s.id === selectedSection)?.name}
                      <button
                        onClick={() => setSelectedSection(undefined)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {searchQuery && (
                    <Badge variant="secondary" className="pl-3 pr-2 py-1">
                      {t("filters.filterSearch")}: {searchQuery}
                      <button
                        onClick={() => setSearchQuery("")}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ✅ CONTENU PRINCIPAL */}
        {membersLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-20">
              <div className="text-center">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("list.noMembers")}
                </h3>
                <p className="text-gray-600 mb-6">
                  {t("list.noMembersDescription")}
                </p>
                {canManageMembers && (
                  <Button
                    onClick={() =>
                      router.push(
                        `/modules/associations/${associationId}/members/add`
                      )
                    }
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t("addFirstMember")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ✅ VUE GRILLE */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    roles={roles || []}
                    onView={() => handleViewDetails(member)}
                    onEdit={() => handleEditMember(member)}
                    onDelete={() => handleDeleteMember(member)}
                    canManage={canManageMembers}
                    isMultiSection={association.isMultiSection || false}
                  />
                ))}
              </div>
            ) : (
              /* ✅ VUE LISTE (TABLEAU AVEC COLONNES PERSONNALISABLES) */
              <Card className="shadow-sm mb-6">
                {/* ✅ HEADER AVEC BOUTON COLONNES */}
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t("list.title")}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {pagination.total} {t("list.membersFound")}
                      </p>
                    </div>
                    {/* ✅ DROPDOWN COLONNES */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowColumnsMenu(!showColumnsMenu)}
                        className="flex items-center gap-2"
                      >
                        <Settings2 className="h-4 w-4" />
                        {t("columns.customize")}
                      </Button>
                      {showColumnsMenu && (
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                          <h4 className="font-semibold text-sm text-gray-900 mb-3">
                            {t("columns.title")}
                          </h4>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={showStatusColumn}
                                onChange={(e) =>
                                  setShowStatusColumn(e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{t("columns.status")}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={showJoinDateColumn}
                                onChange={(e) =>
                                  setShowJoinDateColumn(e.target.checked)
                                }
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">
                                {t("columns.joinDate")}
                              </span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {/* ✅ COLONNES PAR DÉFAUT */}
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t("table.member")}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t("table.contact")}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t("table.type")}
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t("table.roles")}
                          </th>
                          {association.isMultiSection && (
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t("table.section")}
                            </th>
                          )}
                          
                          {/* ✅ COLONNES OPTIONNELLES */}
                          {showStatusColumn && (
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t("table.status")}
                            </th>
                          )}
                          {showJoinDateColumn && (
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              {t("table.joinDate")}
                            </th>
                          )}
                          
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t("table.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {members.map((member) => (
                          <tr
                            key={member.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            {/* Membre avec Avatar */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  firstName={member.user?.firstName}
                                  lastName={member.user?.lastName}
                                  imageUrl={member.user?.profilePicture}
                                  size="md"
                                />
                                <div>
                                  <div className="font-medium text-gray-900 flex items-center gap-2">
                                    {member.user?.firstName}{" "}
                                    {member.user?.lastName}
                                    {member.isAdmin && (
                                      <Crown className="h-4 w-4 text-yellow-500" />
                                    )}
                                  </div>
                                  {member.profession && (
                                    <div className="text-sm text-gray-500">
                                      {member.profession}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="space-y-1">
                                {member.user?.phoneNumber && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    {member.user.phoneNumber}
                                  </div>
                                )}
                                {member.user?.email && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="h-3 w-3 text-gray-400" />
                                    <span className="truncate max-w-[200px]">
                                      {member.user.email}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Type */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="secondary">
                                {member.memberType || "-"}
                              </Badge>
                            </td>

                            {/* Rôles */}
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {member.assignedRoles &&
                                member.assignedRoles.length > 0 ? (
                                  <>
                                    {member.assignedRoles
                                      .slice(0, 2)
                                      .map((roleId) => {
                                        const role = roles?.find(
                                          (r) => r.id === roleId
                                        );
                                        return role ? (
                                          <Badge
                                            key={roleId}
                                            variant="secondary"
                                            style={{
                                              backgroundColor:
                                                role.color + "20",
                                              color: role.color,
                                              borderColor: role.color,
                                            }}
                                            className="border text-xs"
                                          >
                                            {role.name}
                                          </Badge>
                                        ) : null;
                                      })}
                                    {member.assignedRoles.length > 2 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        +{member.assignedRoles.length - 2}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    {t("table.noRoles")}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Section */}
                            {association.isMultiSection && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                {member.section ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-3 w-3 text-gray-400" />
                                    <span>{member.section.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            )}

                            {/* ✅ COLONNES OPTIONNELLES */}
                            {showStatusColumn && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(member.status)}
                              </td>
                            )}
                            {showJoinDateColumn && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  {formatDate(member.joinDate)}
                                </div>
                              </td>
                            )}

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(member)}
                                  title={t("actions.view")}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {canManageMembers && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditMember(member)}
                                      title={t("actions.edit")}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteMember(member)
                                      }
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title={t("actions.delete")}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ✅ PAGINATION */}
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemsPerPageOptions={[10, 25, 50, 100]}
                showItemsPerPage={true}
              />
            </div>
          </>
        )}
      </div>

      {/* ✅ MODALS */}
      {selectedMember && (
        <MemberDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedMember(null);
          }}
          memberId={selectedMember.id}
          associationId={associationId}
          primaryCurrency={association.primaryCurrency}
        />
      )}

      {editingMember && (
        <EditMemberModal
          open={true}
          onClose={() => {
            setEditingMember(null);
          }}
          member={editingMember}
          associationId={associationId}
          isMultiSection={association.isMultiSection || false}
          memberTypes={association.memberTypes || []}
          primaryCurrency={association.primaryCurrency || "EUR"}
          onSuccess={() => {
            setEditingMember(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}