"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Building2,
  Calendar,
  Briefcase,
  AlertCircle,
  Shield,
  Info,
  Check,
} from "lucide-react";
import { toast } from "sonner";

// ✅ Imports depuis l'architecture centralisée
import { useAssociation } from "@/hooks/association/useAssociation";
import { useSections } from "@/hooks/association/useSections";
import { useRoles } from "@/hooks/association/useRoles";
import { useRoleAssignments } from "@/hooks/association/useRoleAssignments";
import { membersApi } from "@/lib/api/association/members";
import type { CreateMemberPayload } from "@/types/association/member";
import type { Role } from "@/types/association/role";
import { COUNTRIES, CURRENCIES } from "@/lib/constants/countries";

// ✅ Components UI
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";

/**
 * Obtenir le symbole de la devise à partir du code
 */
const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

export default function AddMemberPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("addMember");
  const tCommon = useTranslations("common");
  const associationId = params.id as string;

  // ✅ Utilisation des hooks centralisés
  const {
    association,
    loading: associationLoading,
    error: associationError,
  } = useAssociation(Number(associationId));
  const { sections, fetchSections, isLoading: sectionsLoading } = useSections();
  const { roles, loading: rolesLoading } = useRoles(Number(associationId));

  const {
    isRoleAssigned,
    getRoleAssignee,
    loading: loadingAssignments,
  } = useRoleAssignments(Number(associationId));

  // États locaux (uniquement pour le formulaire)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateMemberPayload>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    memberType: "",
    sectionId: undefined,
    country: "",
    city: "",
    address: "",
    dateOfBirth: "",
    profession: "",
    emergencyContact: "",
    notes: "",
    status: "active", // ✅ Par défaut actif
    roles: [], // ✅ Rôles multiples
  });

  // Charger les sections si multi-sections
  useEffect(() => {
    if (association?.isMultiSection) {
      fetchSections(Number(associationId));
    }
  }, [association, associationId, fetchSections]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Champs obligatoires
    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = t("form.firstName.error.required");
    }

    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = t("form.lastName.error.required");
    }

    if (!formData.phoneNumber || formData.phoneNumber.trim().length < 8) {
      newErrors.phoneNumber = t("form.phoneNumber.error.required");
    }

    if (!formData.memberType) {
      newErrors.memberType = t("form.memberType.error.required");
    }

    if (association?.isMultiSection && !formData.sectionId) {
      newErrors.sectionId = t("form.section.error.required");
    }

    if (!formData.country) {
      newErrors.country = t("form.country.error.required");
    }

    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = t("form.city.error.required");
    }

    // Validation email si fourni
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("form.email.error.invalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("validation.invalidData"), {
        description: t("validation.pleaseCheckForm"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Nettoyer les données avant envoi
      const cleanedData: CreateMemberPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        memberType: formData.memberType,
        country: formData.country,
        city: formData.city.trim(),
        status: "active", // ✅ Toujours actif
        assignedRoles: selectedRoles, // ✅ Rôles sélectionnés
      };

      // Ajouter les champs optionnels
      if (formData.email?.trim()) {
        cleanedData.email = formData.email.trim();
      }
      if (formData.sectionId) {
        cleanedData.sectionId = formData.sectionId;
      }
      if (formData.address?.trim()) {
        cleanedData.address = formData.address.trim();
      }
      if (formData.dateOfBirth?.trim()) {
        cleanedData.dateOfBirth = formData.dateOfBirth.trim();
      }
      if (formData.profession?.trim()) {
        cleanedData.profession = formData.profession.trim();
      }
      if (formData.emergencyContact?.trim()) {
        cleanedData.emergencyContact = formData.emergencyContact.trim();
      }
      if (formData.notes?.trim()) {
        cleanedData.notes = formData.notes.trim();
      }

      // ✅ Utilisation de l'API client centralisé
      const result = await membersApi.create(
        Number(associationId),
        cleanedData
      );

      if (result.success) {
        toast.success(t("success.title"), {
          description: t("success.message", {
            firstName: formData.firstName,
            lastName: formData.lastName,
          }),
        });

        // Redirection vers la liste des membres
        router.push(`/modules/associations/${associationId}/members`);
      }
    } catch (error: unknown) {
      console.error("Erreur création membre:", error);

      // Gestion des erreurs spécifiques
      const apiError = error as { response?: { data?: { code?: string } } };
      if (apiError.response?.data?.code === "PHONE_EXISTS") {
        toast.error(t("errors.phoneExists"));
      } else if (apiError.response?.data?.code === "EMAIL_EXISTS") {
        toast.error(t("errors.emailExists"));
      } else {
        toast.error(t("errors.createMember"), {
          description: t("errors.tryAgain"),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mise à jour du formulaire
  const updateFormData = (
    field: keyof CreateMemberPayload,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Gestion des rôles multiples
  const handleRoleToggle = useCallback((roleId: string) => {
    console.log("🔄 Toggle role:", roleId); // ✅ Debug
    setSelectedRoles((prev) => {
      const newRoles = prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId];
      console.log("📋 New selectedRoles:", newRoles); // ✅ Debug
      return newRoles;
    });
  }, []);

  // Vérifier si un rôle unique est déjà attribué

  const isUniqueRoleAssigned = (role: Role): boolean => {
    if (!role.isUnique) return false;
    return isRoleAssigned(role.id);
  };

  // Obtenir le nom du membre qui a le rôle
  const getUniqueRoleAssigneeName = (roleId: string): string | null => {
    const assignee = getRoleAssignee(roleId);
    if (!assignee?.user) return null;
    return `${assignee.user.firstName} ${assignee.user.lastName}`;
  };

  // États de chargement

  if (
    associationLoading ||
    sectionsLoading ||
    rolesLoading ||
    loadingAssignments
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (associationError || !association) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">
                  {t("errors.loadAssociation")}
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {t("errors.tryAgain")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérifier s'il y a des types de membres configurés
  if (!association.memberTypes || association.memberTypes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  {t("info.noMemberTypes")}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {t("info.noMemberTypesMessage")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button
          onClick={() => router.push("/modules/associations")}
          className="hover:text-foreground cursor-pointer"
        >
          {t("breadcrumb.associations")}
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/modules/associations/${associationId}`)}
          className="hover:text-foreground cursor-pointer"
        >
          {association.name}
        </button>
        <span>/</span>
        <button
          onClick={() =>
            router.push(`/modules/associations/${associationId}/members`)
          }
          className="hover:text-foreground cursor-pointer"
        >
          {t("breadcrumb.members")}
        </button>
        <span>/</span>
        <span className="text-foreground">{t("breadcrumb.add")}</span>
      </div>

      {/* Bouton retour */}
      <Button
        variant="ghost"
        onClick={() =>
          router.push(`/modules/associations/${associationId}/members`)
        }
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("buttons.cancel")}
      </Button>

      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("form.personalInfo.title")}
            </CardTitle>
            <CardDescription>
              {t("form.personalInfo.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prénom */}
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("form.firstName.label")} *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  placeholder={t("form.firstName.placeholder")}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>

              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("form.lastName.label")} *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  placeholder={t("form.lastName.placeholder")}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phoneNumber"
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  {t("form.phoneNumber.label")} *
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    updateFormData("phoneNumber", e.target.value)
                  }
                  placeholder={t("form.phoneNumber.placeholder")}
                  className={errors.phoneNumber ? "border-red-500" : ""}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500">{errors.phoneNumber}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t("form.phoneNumber.helper")}
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t("form.email.label")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder={t("form.email.placeholder")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t("form.email.helper")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations d'adhésion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("form.membershipInfo.title")}
            </CardTitle>
            <CardDescription>
              {t("form.membershipInfo.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type de membre */}
              <div className="space-y-2">
                <Label htmlFor="memberType">
                  {t("form.memberType.label")} *
                </Label>
                <Select
                  value={formData.memberType}
                  onValueChange={(value) => updateFormData("memberType", value)}
                >
                  <SelectTrigger
                    className={errors.memberType ? "border-red-500" : ""}
                  >
                    <SelectValue
                      placeholder={t("form.memberType.placeholder")}
                    />
                  </SelectTrigger>

                  <SelectContent>
  {association.memberTypes.map((type) => (
    <SelectItem key={type.name} value={type.name}>
      <div className="flex items-center justify-between w-full">
        <span>{type.name}</span>
        {type.cotisationAmount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {type.cotisationAmount} {getCurrencySymbol(association.primaryCurrency)}
          </Badge>
        )}
      </div>
    </SelectItem>
  ))}
</SelectContent>

                 
                </Select>
                {errors.memberType && (
                  <p className="text-sm text-red-500">{errors.memberType}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {t("form.memberType.helper")}
                </p>
              </div>

              {/* Section (si multi-sections) */}
              {association.isMultiSection && (
                <div className="space-y-2">
                  <Label htmlFor="sectionId">{t("form.section.label")} *</Label>
                  <Select
                    value={formData.sectionId?.toString() || ""}
                    onValueChange={(value) =>
                      updateFormData("sectionId", Number(value))
                    }
                  >
                    <SelectTrigger
                      className={errors.sectionId ? "border-red-500" : ""}
                    >
                      <SelectValue
                        placeholder={t("form.section.placeholder")}
                      />
                    </SelectTrigger>
                    <SelectContent>
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
                  {errors.sectionId && (
                    <p className="text-sm text-red-500">{errors.sectionId}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {t("form.section.helper")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rôles et permissions */}
        {roles && roles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("form.rolesInfo.title")}
              </CardTitle>
              <CardDescription>
                {t("form.rolesInfo.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  <Info className="h-4 w-4 inline mr-1" />
                  {t("info.rolesOptional")}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {roles.map((role) => {
  const isAssigned = isUniqueRoleAssigned(role);
  const isDisabled = role.isUnique && isAssigned;
  const isSelected = selectedRoles.includes(role.id);
  const assignedTo = isDisabled ? getUniqueRoleAssigneeName(role.id) : null; // ✅ AJOUT

  return (
    <button
      key={role.id}
      type="button"
      onClick={() => !isDisabled && handleRoleToggle(role.id)}
      disabled={isDisabled}
      className={`border rounded-lg p-4 transition-all text-left w-full ${
        isDisabled 
          ? 'bg-gray-50 opacity-60 cursor-not-allowed border-gray-300' 
          : isSelected
            ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
            : 'border-gray-200 hover:border-blue-300 cursor-pointer'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox visuelle */}
        <div 
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
            transition-all duration-200
            ${isSelected 
              ? 'bg-blue-500 border-blue-500'
              : 'bg-white border-gray-300'
            }
          `}
        >
          {isSelected && (
            <Check className="h-3 w-3 text-white font-bold" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="font-semibold flex items-center gap-2">
            {role.name}
            {role.isUnique && (
              <Badge variant="outline" className="ml-2 text-xs">
                {t('roleCard.uniqueRole')}
              </Badge>
            )}
          </div>
          
          {role.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {role.description}
            </p>
          )}
          
          {/* ✅ AJOUT : Message si rôle déjà attribué */}
          {isDisabled && assignedTo && (
            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {t('form.roles.roleAssignedTo', { name: assignedTo })}
            </p>
          )}
          
          {/* ✅ MODIFICATION : Texte grisé si disabled */}
          <p className={`text-xs mt-2 ${isDisabled ? 'text-gray-400' : 'text-muted-foreground'}`}>
            {t('roleCard.permissions', { count: role.permissions?.length || 0 })}
          </p>
        </div>
      </div>
    </button>
  );
})}

                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Adresse */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t("form.addressInfo.title")}
            </CardTitle>
            <CardDescription>
              {t("form.addressInfo.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pays */}
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t("form.country.label")} *
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => updateFormData("country", value)}
                >
                  <SelectTrigger
                    className={errors.country ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder={t("form.country.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {tCommon(country.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-sm text-red-500">{errors.country}</p>
                )}
              </div>

              {/* Ville */}
              <div className="space-y-2">
                <Label htmlFor="city">{t("form.city.label")} *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  placeholder={t("form.city.placeholder")}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>

              {/* Adresse complète */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">{t("form.address.label")}</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder={t("form.address.placeholder")}
                />
                <p className="text-sm text-muted-foreground">
                  {t("form.address.helper")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations complémentaires */}
        <Card>
          <CardHeader>
            <CardTitle>{t("form.additionalInfo.title")}</CardTitle>
            <CardDescription>
              {t("form.additionalInfo.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date de naissance */}
              <div className="space-y-2">
                <Label
                  htmlFor="dateOfBirth"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  {t("form.dateOfBirth.label")}
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) =>
                    updateFormData("dateOfBirth", e.target.value)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t("form.dateOfBirth.helper")}
                </p>
              </div>

              {/* Profession */}
              <div className="space-y-2">
                <Label htmlFor="profession" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {t("form.profession.label")}
                </Label>
                <Input
                  id="profession"
                  value={formData.profession || ""}
                  onChange={(e) => updateFormData("profession", e.target.value)}
                  placeholder={t("form.profession.placeholder")}
                />
                <p className="text-sm text-muted-foreground">
                  {t("form.profession.helper")}
                </p>
              </div>

              {/* Contact d'urgence */}
              <div className="space-y-2">
                <Label
                  htmlFor="emergencyContact"
                  className="flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  {t("form.emergencyContact.label")}
                </Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact || ""}
                  onChange={(e) =>
                    updateFormData("emergencyContact", e.target.value)
                  }
                  placeholder={t("form.emergencyContact.placeholder")}
                />
                <p className="text-sm text-muted-foreground">
                  {t("form.emergencyContact.helper")}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">{t("form.notes.label")}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) => updateFormData("notes", e.target.value)}
                  placeholder={t("form.notes.placeholder")}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  {t("form.notes.helper")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/modules/associations/${associationId}/members`)
            }
            disabled={isSubmitting}
          >
            {t("buttons.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("buttons.creating") : t("buttons.create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
