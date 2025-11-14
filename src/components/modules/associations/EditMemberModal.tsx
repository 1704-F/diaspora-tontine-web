'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, User, Phone, Mail, MapPin, Globe, Calendar, Briefcase, Shield, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// ✅ Imports depuis l'architecture centralisée
import { useRoles } from '@/hooks/association/useRoles';
import { useSections } from '@/hooks/association/useSections';
import { useRoleAssignments } from '@/hooks/association/useRoleAssignments'; // ✅ AJOUT
import { membersApi } from '@/lib/api/association/members';
import type { AssociationMember, UpdateMemberPayload } from '@/types/association/member';
import type { Role } from '@/types/association/role';
import { COUNTRIES, CURRENCIES } from '@/lib/constants/countries'; // ✅ AJOUT CURRENCIES

// ✅ Components UI
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';

interface EditMemberModalProps {
  member: AssociationMember;
  associationId: number;
  isMultiSection: boolean;
  memberTypes: Array<{
    name: string;
    cotisationAmount: number;
    description?: string;
  }>;
  primaryCurrency: string; // ✅ AJOUT
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ✅ Helper pour obtenir le symbole de la devise
const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

export default function EditMemberModal({
  member,
  associationId,
  isMultiSection,
  memberTypes,
  primaryCurrency, // ✅ AJOUT
  open,
  onClose,
  onSuccess,
}: EditMemberModalProps) {
  const t = useTranslations('editMember');
  const tCommon = useTranslations('common');

  // ✅ Hooks centralisés
  const { roles, loading: rolesLoading } = useRoles(associationId);
  const { sections, fetchSections, isLoading: sectionsLoading } = useSections();
  const { isRoleAssigned, getRoleAssignee, loading: loadingAssignments } = useRoleAssignments(associationId); // ✅ AJOUT

  // États locaux
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>(member.assignedRoles || []);
  const [formData, setFormData] = useState<UpdateMemberPayload>({
    firstName: member.user?.firstName || '',
    lastName: member.user?.lastName || '',
    phoneNumber: member.user?.phoneNumber || '',
    email: member.user?.email || '',
    memberType: member.memberType || '',
    sectionId: member.sectionId || undefined,
    country: member.user?.country || '',
    city: member.user?.city || '',
    address: member.user?.address || '',
    dateOfBirth: member.user?.dateOfBirth || '',
    profession: member.profession || '',
    emergencyContact: member.emergencyContact || '',
    notes: member.notes || '',
    status: member.status,
    assignedRoles: member.assignedRoles || [], // ✅ Correction: assignedRoles au lieu de roles
  });

  // ✅ Réinitialiser le formData à l'ouverture du modal
  useEffect(() => {
    if (open) {
      setFormData({
        firstName: member.user?.firstName || '',
        lastName: member.user?.lastName || '',
        phoneNumber: member.user?.phoneNumber || '',
        email: member.user?.email || '',
        memberType: member.memberType || '',
        sectionId: member.sectionId || undefined,
        country: member.user?.country || '',
        city: member.user?.city || '',
        address: member.user?.address || '',
        dateOfBirth: member.user?.dateOfBirth || '',
        profession: member.profession || '',
        emergencyContact: member.emergencyContact || '',
        notes: member.notes || '',
        status: member.status,
        assignedRoles: member.assignedRoles || [],
      });
      setSelectedRoles(member.assignedRoles || []);
    }
  }, [open, member]);

  // ✅ Helper pour obtenir le label de la section sélectionnée
  const getSelectedSectionLabel = (): string => {
    if (!formData.sectionId) return '';
    const section = sections.find(s => s.id === formData.sectionId);
    return section ? `${section.name} (${section.city})` : '';
  };

  // ✅ Helper pour obtenir le label du pays sélectionné
  const getSelectedCountryLabel = (): string => {
    if (!formData.country) return '';
    const country = COUNTRIES.find(c => c.code === formData.country);
    return country ? `${country.flag} ${tCommon(country.name)}` : '';
  };

  // Charger les sections si multi-sections
  useEffect(() => {
    if (isMultiSection && open) {
      fetchSections(associationId);
    }
  }, [isMultiSection, open, associationId, fetchSections]);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = t('fields.firstName.error.required');
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = t('fields.lastName.error.required');
    }

    if (!formData.phoneNumber?.trim()) {
      newErrors.phone = t('fields.phone.error.required');
    }

    if (!formData.memberType) {
      newErrors.memberType = t('fields.memberType.error.required');
    }

    if (!formData.country) {
      newErrors.country = t('fields.country.error.required');
    }

    if (!formData.city?.trim()) {
      newErrors.city = t('fields.city.error.required');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('fields.email.error.invalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('errors.generic'));
      return;
    }

    setIsSaving(true);

    try {
      // ✅ Nettoyer les données
      const cleanedData: UpdateMemberPayload = {
        firstName: formData.firstName?.trim(),
        lastName: formData.lastName?.trim(),
        phoneNumber: formData.phoneNumber?.trim(),
        memberType: formData.memberType,
        country: formData.country,
        city: formData.city?.trim(),
        status: formData.status,
        assignedRoles: selectedRoles, // ✅ CORRECTION: assignedRoles
      };

      // Ajouter champs optionnels
      if (formData.email?.trim()) cleanedData.email = formData.email.trim();
      if (formData.sectionId) cleanedData.sectionId = formData.sectionId;
      if (formData.address?.trim()) cleanedData.address = formData.address.trim();
      if (formData.dateOfBirth?.trim()) cleanedData.dateOfBirth = formData.dateOfBirth.trim();
      if (formData.profession?.trim()) cleanedData.profession = formData.profession.trim();
      if (formData.emergencyContact?.trim()) cleanedData.emergencyContact = formData.emergencyContact.trim();
      if (formData.notes?.trim()) cleanedData.notes = formData.notes.trim();

      // ✅ Utilisation de l'API client
      const result = await membersApi.update(associationId, member.id, cleanedData);

      if (result.success) {
        toast.success(t('success.title'), {
          description: t('success.message'),
        });
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      console.error('Erreur modification membre:', error);
      const apiError = error as { response?: { data?: { code?: string; conflicts?: Array<{ roleName: string; assignedTo: string }> } } };
      
      // ✅ Gestion erreur rôle unique
      if (apiError.response?.data?.code === 'UNIQUE_ROLE_CONFLICT') {
        const conflicts = apiError.response.data.conflicts || [];
        const conflictMessages = conflicts.map(c => `${c.roleName} (attribué à ${c.assignedTo})`).join(', ');
        toast.error(t('errors.uniqueRoleConflict'), {
          description: conflictMessages,
        });
      } else {
        toast.error(t('errors.updateFailed'), {
          description: t('errors.tryAgain'),
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Mise à jour formulaire
  const updateFormData = (field: keyof UpdateMemberPayload, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Toggle rôle
  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  // ✅ NOUVEAU: Vérifier rôle unique (en excluant le membre actuel)
  const isUniqueRoleAssigned = (role: Role): boolean => {
    if (!role.isUnique) return false;
    const assignee = getRoleAssignee(role.id);
    // Si le rôle est attribué à quelqu'un d'autre que le membre actuel
    return assignee !== undefined && assignee.id !== member.id;
  };

  // ✅ NOUVEAU: Obtenir le nom du membre qui a le rôle
  const getUniqueRoleAssigneeName = (roleId: string): string | null => {
    const assignee = getRoleAssignee(roleId);
    if (!assignee?.user || assignee.id === member.id) return null;
    return `${assignee.user.firstName} ${assignee.user.lastName}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          {/* Warning Admin */}
          {member.isAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">{t('warnings.adminTitle')}</h4>
                  <p className="text-sm text-amber-700 mt-1">{t('warnings.adminMessage')}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('sections.personalInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prénom */}
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('fields.firstName.label')} *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>

              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('fields.lastName.label')} *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('fields.phone.label')} *
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                <p className="text-sm text-muted-foreground">{t('fields.phone.helper')}</p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('fields.email.label')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                <p className="text-sm text-muted-foreground">{t('fields.email.helper')}</p>
              </div>
            </div>
          </div>

          {/* Adhésion */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">{t('sections.membershipInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type membre - ✅ CORRIGÉ: Devise dynamique */}
              <div className="space-y-2">
                <Label htmlFor="memberType">{t('fields.memberType.label')} *</Label>
                <Select 
                  value={formData.memberType || ''} 
                  onValueChange={(value) => updateFormData('memberType', value)}
                >
                  <SelectTrigger className={errors.memberType ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('fields.memberType.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {memberTypes.map((type) => (
                      <SelectItem key={type.name} value={type.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{type.name}</span>
                          {type.cotisationAmount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {type.cotisationAmount} {getCurrencySymbol(primaryCurrency)}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.memberType && <p className="text-sm text-red-500">{errors.memberType}</p>}
              </div>

              {/* Section */}
              {isMultiSection && (
                <div className="space-y-2">
                  <Label htmlFor="sectionId">{t('fields.section.label')}</Label>
                  <Select 
                    value={formData.sectionId?.toString() || ''} 
                    onValueChange={(value) => updateFormData('sectionId', Number(value))}
                  >
                    <SelectTrigger>
                      {getSelectedSectionLabel() || <SelectValue placeholder={t('fields.section.placeholder')} />}
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.id} value={section.id.toString()}>
                          {section.name} ({section.city})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Statut */}
              <div className="space-y-2">
                <Label htmlFor="status">{t('fields.status.label')}</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => updateFormData('status', value as 'active' | 'pending' | 'inactive' | 'suspended')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('fields.status.active')}</SelectItem>
                    <SelectItem value="pending">{t('fields.status.pending')}</SelectItem>
                    <SelectItem value="suspended">{t('fields.status.suspended')}</SelectItem>
                    <SelectItem value="inactive">{t('fields.status.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Rôles - ✅ CORRIGÉ: Validation rôles uniques */}
          {roles && roles.length > 0 && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('sections.rolesInfo')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => {
                  const isAssigned = isUniqueRoleAssigned(role);
                  const isDisabled = role.isUnique && isAssigned;
                  const isSelected = selectedRoles.includes(role.id);
                  const assignedTo = isDisabled ? getUniqueRoleAssigneeName(role.id) : null;

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
                          {isSelected && <Check className="h-3 w-3 text-white font-bold" />}
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
                          {isDisabled && assignedTo && (
                            <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {t('roleCard.alreadyAssignedTo', { memberName: assignedTo })}
                            </p> 
                          )}
                          <p className={`text-xs mt-2 ${isDisabled ? 'text-gray-400' : 'text-muted-foreground'}`}>
                            ({role.permissions?.length || 0}) permissions
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Adresse */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('sections.addressInfo')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pays */}
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('fields.country.label')} *
                </Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => updateFormData('country', value)}
                >
                  <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                    {getSelectedCountryLabel() || <SelectValue placeholder={t('fields.country.placeholder')} />}
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {tCommon(country.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
              </div>

              {/* Ville */}
              <div className="space-y-2">
                <Label htmlFor="city">{t('fields.city.label')} *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
              </div>

              {/* Adresse */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">{t('fields.address.label')}</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  placeholder={t('fields.address.placeholder')}
                />
              </div>
            </div>
          </div>

          {/* Informations complémentaires */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">{t('sections.additionalInfo')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date de naissance */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('fields.dateOfBirth.label')}
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ''}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">{t('fields.dateOfBirth.helper')}</p>
              </div>

              {/* Profession */}
              <div className="space-y-2">
                <Label htmlFor="profession" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {t('fields.profession.label')}
                </Label>
                <Input
                  id="profession"
                  value={formData.profession || ''}
                  onChange={(e) => updateFormData('profession', e.target.value)}
                  placeholder={t('fields.profession.placeholder')}
                />
                <p className="text-sm text-muted-foreground">{t('fields.profession.helper')}</p>
              </div>

              {/* Contact urgence */}
              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('fields.emergencyContact.label')}
                </Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact || ''}
                  onChange={(e) => updateFormData('emergencyContact', e.target.value)}
                  placeholder={t('fields.emergencyContact.placeholder')}
                />
                <p className="text-sm text-muted-foreground">{t('fields.emergencyContact.helper')}</p>
              </div>

              {/* Notes */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">{t('fields.notes.label')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder={t('fields.notes.placeholder')}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">{t('fields.notes.helper')}</p>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-4 pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              {t('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t('buttons.saving') : t('buttons.save')}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}