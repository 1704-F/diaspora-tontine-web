'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, MapPin, Building2, Globe, DollarSign, Languages, Clock, Phone, Mail, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// ✅ Imports depuis l'architecture centralisée
import { useAssociation } from '@/hooks/association/useAssociation';
import { sectionsApi } from '@/lib/api/association/sections';
import type { CreateSectionPayload } from '@/types/association/section';
import { COUNTRIES, CURRENCIES, LANGUAGES, TIMEZONES } from '@/lib/constants/countries';

// ✅ Components UI
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CreateSectionPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('createSection');
  const associationId = params.id as string;

  // ✅ Utilisation du hook centralisé
  const { association, loading: associationLoading, error: associationError } = useAssociation(Number(associationId));

  // États locaux (uniquement pour le formulaire)
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateSectionPayload>({
    name: '',
    country: '',
    city: '',
    region: '',
    currency: '',
    language: 'fr',
    timezone: 'Europe/Paris',
    contactPhone: '',
    contactEmail: '',
    description: '',
  });

  // Vérification si association est multi-sections
  useEffect(() => {
    if (association && !association.isMultiSection) {
      toast.error(t('info.multiSectionRequired'), {
        description: t('info.multiSectionMessage'),
      });
      router.push(`/modules/associations/${associationId}/sections`);
    }
  }, [association, associationId, router, t]);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = t('form.name.error.required');
    }

    if (!formData.country) {
      newErrors.country = t('form.country.error.required');
    }

    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = t('form.city.error.required');
    }

    if (!formData.currency) {
      newErrors.currency = t('form.currency.error.required');
    }

    if (!formData.language) {
      newErrors.language = t('form.language.error.required');
    }

    if (!formData.timezone) {
      newErrors.timezone = t('form.timezone.error.required');
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = t('form.contactEmail.error.invalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion de la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('errors.generic'), {
        description: t('errors.tryAgain'),
      });
      return;
    }

    setIsSaving(true);

    try {
      // ✅ Nettoyer les champs vides avant envoi
      const cleanedData: CreateSectionPayload = {
        name: formData.name,
        country: formData.country,
        city: formData.city,
        currency: formData.currency,
        language: formData.language,
        timezone: formData.timezone,
      };

      // Ajouter les champs optionnels uniquement s'ils sont remplis
      if (formData.region?.trim()) {
        cleanedData.region = formData.region.trim();
      }
      if (formData.contactPhone?.trim()) {
        cleanedData.contactPhone = formData.contactPhone.trim();
      }
      if (formData.contactEmail?.trim()) {
        cleanedData.contactEmail = formData.contactEmail.trim();
      }
      if (formData.description?.trim()) {
        cleanedData.description = formData.description.trim();
      }

      // ✅ Utilisation de l'API client centralisé
      const result = await sectionsApi.createSection(
        Number(associationId),
        cleanedData
      );

      if (result.success) {
        toast.success(t('success.title'), {
          description: t('success.message', { name: formData.name }),
        });

        // Redirection vers la section créée
        router.push(`/modules/associations/${associationId}/sections/${result.data.section.id}`);
      }
    } catch (error) {
      console.error('Erreur création section:', error);
      toast.error(t('errors.createSection'), {
        description: t('errors.tryAgain'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Mise à jour du formulaire
  const updateFormData = (field: keyof CreateSectionPayload, value: string) => {
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

  // États de chargement
  if (associationLoading) {
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
                <h3 className="font-semibold text-red-900">{t('errors.loadAssociation')}</h3>
                <p className="text-sm text-red-700 mt-1">{t('errors.tryAgain')}</p>
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
          onClick={() => router.push('/modules/associations')}
          className="hover:text-foreground cursor-pointer"
        >
          {t('breadcrumb.associations')}
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
          onClick={() => router.push(`/modules/associations/${associationId}/sections`)}
          className="hover:text-foreground cursor-pointer"
        >
          {t('breadcrumb.sections')}
        </button>
        <span>/</span>
        <span className="text-foreground">{t('breadcrumb.create')}</span>
      </div>

      {/* Bouton retour */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/modules/associations/${associationId}/sections`)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('buttons.cancel')}
      </Button>

      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('title')}
            </CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grille 2 colonnes sur desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom de la section */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {t('form.name.label')}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder={t('form.name.placeholder')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('form.name.helper')}</p>
              </div>

              {/* Pays */}
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('form.country.label')}
                </Label>
                <Select value={formData.country} onValueChange={(value) => updateFormData('country', value)}>
                  <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('form.country.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.flag} {t(country.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-sm text-red-500">{errors.country}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('form.country.helper')}</p>
              </div>

              {/* Ville */}
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('form.city.label')}
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  placeholder={t('form.city.placeholder')}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('form.city.helper')}</p>
              </div>

              {/* Région (optionnel) - Pleine largeur */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="region">{t('form.region.label')}</Label>
                <Input
                  id="region"
                  value={formData.region || ''}
                  onChange={(e) => updateFormData('region', e.target.value)}
                  placeholder={t('form.region.placeholder')}
                />
                <p className="text-sm text-muted-foreground">{t('form.region.helper')}</p>
              </div>

              {/* Devise */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('form.currency.label')}
                </Label>
                <Select value={formData.currency} onValueChange={(value) => updateFormData('currency', value)}>
                  <SelectTrigger className={errors.currency ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('form.currency.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {t(currency.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency && (
                  <p className="text-sm text-red-500">{errors.currency}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('form.currency.helper')}</p>
              </div>

              {/* Langue */}
              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  {t('form.language.label')}
                </Label>
                <Select value={formData.language} onValueChange={(value) => updateFormData('language', value)}>
                  <SelectTrigger className={errors.language ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('form.language.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.language && (
                  <p className="text-sm text-red-500">{errors.language}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('form.language.helper')}</p>
              </div>

              {/* Fuseau horaire - Pleine largeur */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="timezone" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('form.timezone.label')}
                </Label>
                <Select value={formData.timezone} onValueChange={(value) => updateFormData('timezone', value)}>
                  <SelectTrigger className={errors.timezone ? 'border-red-500' : ''}>
                    <SelectValue placeholder={t('form.timezone.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {t(timezone.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.timezone && (
                  <p className="text-sm text-red-500">{errors.timezone}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('form.timezone.helper')}</p>
              </div>

              {/* Téléphone de contact (optionnel) */}
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('form.contactPhone.label')}
                </Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone || ''}
                  onChange={(e) => updateFormData('contactPhone', e.target.value)}
                  placeholder={t('form.contactPhone.placeholder')}
                />
                <p className="text-sm text-muted-foreground">{t('form.contactPhone.helper')}</p>
              </div>

              {/* Email de contact (optionnel) */}
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('form.contactEmail.label')}
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => updateFormData('contactEmail', e.target.value)}
                  placeholder={t('form.contactEmail.placeholder')}
                  className={errors.contactEmail ? 'border-red-500' : ''}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-red-500">{errors.contactEmail}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('form.contactEmail.helper')}</p>
              </div>
            </div>

            {/* Description (optionnel) - En dehors de la grille */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('form.description.label')}
              </Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder={t('form.description.placeholder')}
                rows={4}
              />
              <p className="text-sm text-muted-foreground">{t('form.description.helper')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/modules/associations/${associationId}/sections`)}
            disabled={isSaving}
          >
            {t('buttons.cancel')}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t('buttons.creating') : t('buttons.create')}
          </Button>
        </div>
      </form>
    </div>
  );
}