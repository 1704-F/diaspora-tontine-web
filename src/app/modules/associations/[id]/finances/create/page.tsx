// src/app/modules/associations/[id]/finances/create/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  Users,
  Building,
  Handshake,
  Star,
  Zap,
  Euro,
  FileText,
  Upload,
  X
} from "lucide-react";

// Composants temporaires pour éviter les erreurs TypeScript
const FormLabel = ({ htmlFor, required = false, children, className = "" }: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <label 
    htmlFor={htmlFor} 
    className={`text-sm font-medium text-gray-700 ${className}`}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const FormSelect = ({ value, onChange, children, className = "", placeholder = "Sélectionner..." }: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  placeholder?: string;
}) => (
  <select 
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
  >
    {!value && <option value="">{placeholder}</option>}
    {children}
  </select>
);

interface CreateExpenseRequestForm {
  expenseType: string;
  expenseSubtype: string;
  title: string;
  description: string;
  amountRequested: string;
  currency: string;
  urgencyLevel: string;
  beneficiaryId: string;
  beneficiaryExternal: {
    name: string;
    type: string;
    contact: string;
    iban: string;
  } | null;
  expectedImpact: string;
  isLoan: boolean;
  loanTerms: {
    durationMonths: string;
    interestRate: string;
    monthlyPayment: string;
  } | null;
  documents: File[];
}

const initialForm: CreateExpenseRequestForm = {
  expenseType: '',
  expenseSubtype: '',
  title: '',
  description: '',
  amountRequested: '',
  currency: 'EUR',
  urgencyLevel: 'normal',
  beneficiaryId: '',
  beneficiaryExternal: null,
  expectedImpact: '',
  isLoan: false,
  loanTerms: null,
  documents: []
};

export default function CreateExpenseRequestPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const associationId = params.id as string;

  const [association, setAssociation] = useState<any>(null);
  const [form, setForm] = useState<CreateExpenseRequestForm>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [members, setMembers] = useState<any[]>([]);

  const expenseTypes = [
    { value: 'aide_membre', label: 'Aide aux membres', icon: Users, description: 'Assistance financière pour les membres' },
    { value: 'depense_operationnelle', label: 'Dépense opérationnelle', icon: Building, description: 'Frais de fonctionnement de l\'association' },
    { value: 'pret_partenariat', label: 'Prêt & partenariat', icon: Handshake, description: 'Prêts ou financement de partenaires' },
    { value: 'projet_special', label: 'Projet spécial', icon: Star, description: 'Financement de projets spécifiques' },
    { value: 'urgence_communautaire', label: 'Urgence communautaire', icon: Zap, description: 'Situations d\'urgence nécessitant une aide rapide' }
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Faible', color: 'gray' },
    { value: 'normal', label: 'Normal', color: 'blue' },
    { value: 'high', label: 'Urgent', color: 'orange' },
    { value: 'critical', label: 'Critique', color: 'red' }
  ];

  // ✅ AJOUT: Devises supportées selon le backend
  const supportedCurrencies = [
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD ($)' },
    { value: 'CHF', label: 'CHF' },
    { value: 'XOF', label: 'XOF (FCFA)' },
    { value: 'XAF', label: 'XAF (FCFA)' }
  ];

  useEffect(() => {
    if (associationId && token) {
      fetchData();
    }
  }, [associationId, token]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAssociation(),
        fetchMembers()
      ]);
    } catch (error) {
      console.error("Erreur chargement données:", error);
      setError("Erreur de chargement des données");
      toast.error("Erreur de chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssociation = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      const result = await response.json();
      setAssociation(result.data.association);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setMembers(result.data?.members || []);
      }
    } catch (error) {
      console.error("Erreur chargement membres:", error);
      setMembers([]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLoanTermsChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      loanTerms: {
        ...prev.loanTerms!,
        [field]: value
      }
    }));
  };

  const handleBeneficiaryExternalChange = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      beneficiaryExternal: {
        ...prev.beneficiaryExternal!,
        [field]: value
      }
    }));
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setForm(prev => ({
        ...prev,
        documents: [...prev.documents, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ CORRECTION: Validation plus stricte selon le backend
    if (!form.expenseType || !form.title || !form.description || !form.amountRequested) {
      setError("Veuillez remplir tous les champs obligatoires");
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // ✅ CORRECTION: Validation du montant
    const amount = parseFloat(form.amountRequested);
    if (isNaN(amount) || amount < 0.01 || amount > 1000000) {
      setError("Le montant doit être entre 0.01 et 1,000,000");
      toast.error("Le montant doit être entre 0.01 et 1,000,000");
      return;
    }

    // ✅ CORRECTION: Validation du titre et description selon les critères backend
    if (form.title.length < 5 || form.title.length > 255) {
      setError("Le titre doit contenir entre 5 et 255 caractères");
      toast.error("Le titre doit contenir entre 5 et 255 caractères");
      return;
    }

    if (form.description.length < 20 || form.description.length > 2000) {
      setError("La description doit contenir entre 20 et 2000 caractères");
      toast.error("La description doit contenir entre 20 et 2000 caractères");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // ✅ CORRECTION: Utiliser Content-Type application/json au lieu de FormData pour plus de compatibilité
      const payload = {
        expenseType: form.expenseType,
        title: form.title.trim(),
        description: form.description.trim(),
        amountRequested: parseFloat(form.amountRequested), // ✅ CORRECTION: Envoyer comme number
        currency: form.currency,
        urgencyLevel: form.urgencyLevel,
        isLoan: form.isLoan,
        
        // ✅ CORRECTION: Inclure seulement si rempli
        ...(form.expenseSubtype && { expenseSubtype: form.expenseSubtype.trim() }),
        ...(form.beneficiaryId && { beneficiaryId: parseInt(form.beneficiaryId) }), // ✅ CORRECTION: Envoyer comme number
        ...(form.expectedImpact && { expectedImpact: form.expectedImpact.trim() }),
        
        // ✅ CORRECTION: Bénéficiaire externe - envoyer seulement si complet
        ...(form.beneficiaryExternal?.name && {
          beneficiaryExternal: form.beneficiaryExternal
        }),
        
        // ✅ CORRECTION: Conditions de prêt - envoyer seulement si prêt
        ...(form.isLoan && form.loanTerms && {
          loanTerms: {
            durationMonths: parseInt(form.loanTerms.durationMonths || '0'),
            interestRate: parseFloat(form.loanTerms.interestRate || '0'),
            monthlyPayment: parseFloat(form.loanTerms.monthlyPayment || '0')
          }
        })
        
        // TODO: Gérer les documents avec une route séparée si nécessaire
      };

      console.log('Payload envoyé:', payload); // Debug

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success("Demande créée avec succès");
        router.push(`/modules/associations/${associationId}/finances/${result.data?.expenseRequest?.id || result.expenseRequest?.id}`);
      } else {
        console.error('Erreur API:', result); // Debug
        setError(result.error || result.message || "Erreur lors de la création de la demande");
        toast.error(result.error || result.message || "Erreur lors de la création de la demande");
        
        // ✅ CORRECTION: Afficher les détails de validation si disponibles
        if (result.details) {
          console.error('Détails de validation:', result.details);
        }
      }
    } catch (error) {
      console.error("Erreur création demande:", error);
      setError("Erreur de connexion");
      toast.error("Erreur de connexion");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/modules/associations/${associationId}/finances`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux finances
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouvelle demande financière</h1>
            <p className="text-gray-600">{association?.name}</p>
          </div>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type de dépense */}
          <Card>
            <CardHeader>
              <CardTitle>Type de demande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expenseTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = form.expenseType === type.value;
                  return (
                    <div
                      key={type.value}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleInputChange('expenseType', type.value)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            isSelected ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{type.label}</h3>
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {form.expenseType && (
                <div className="mt-4">
                  <FormLabel htmlFor="expenseSubtype">Sous-catégorie (optionnel)</FormLabel>
                  <Input
                    id="expenseSubtype"
                    placeholder="Ex: aide_mariage_traditionnel, location_salle_ag..."
                    value={form.expenseSubtype}
                    onChange={(e) => handleInputChange('expenseSubtype', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FormLabel htmlFor="title" required>Titre de la demande</FormLabel>
                <Input
                  id="title"
                  placeholder="Ex: Aide retour urgence, Achat matériel bureau... (5-255 caractères)"
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  minLength={5}
                  maxLength={255}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {form.title.length}/255 caractères (minimum 5)
                </p>
              </div>

              <div>
                <FormLabel htmlFor="description" required>Description détaillée</FormLabel>
                <Textarea
                  id="description"
                  placeholder="Expliquez en détail la raison de cette demande, son importance et son impact attendu... (20-2000 caractères)"
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  required
                  minLength={20}
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {form.description.length}/2000 caractères (minimum 20)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FormLabel htmlFor="amountRequested" required>Montant demandé</FormLabel>
                  <Input
                    id="amountRequested"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1000000"
                    placeholder="0.00"
                    value={form.amountRequested}
                    onChange={(e) => handleInputChange('amountRequested', e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Entre 0.01 et 1,000,000
                  </p>
                </div>

                <div>
                  <FormLabel htmlFor="currency">Devise</FormLabel>
                  <FormSelect 
                    value={form.currency} 
                    onChange={(value) => handleInputChange('currency', value)}
                    placeholder="Choisir une devise"
                  >
                    {supportedCurrencies.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </FormSelect>
                </div>

                <div>
                  <FormLabel htmlFor="urgencyLevel">Niveau d'urgence</FormLabel>
                  <FormSelect 
                    value={form.urgencyLevel} 
                    onChange={(value) => handleInputChange('urgencyLevel', value)}
                    placeholder="Choisir l'urgence"
                  >
                    {urgencyLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </FormSelect>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bénéficiaire */}
          {form.expenseType === 'aide_membre' && (
            <Card>
              <CardHeader>
                <CardTitle>Bénéficiaire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <FormLabel htmlFor="beneficiaryId">Membre bénéficiaire</FormLabel>

                  <FormSelect 
  value={form.beneficiaryId} 
  onChange={(value) => handleInputChange('beneficiaryId', value)}
  placeholder="Sélectionner un membre"
>
  {members.map((member) => (
    <option key={member.id} value={member.user?.id?.toString() || member.userId?.toString()}>
      {member.user?.firstName} {member.user?.lastName} - {member.memberType}
    </option>
  ))}
</FormSelect>

                </div>
              </CardContent>
            </Card>
          )}

          {/* Bénéficiaire externe */}
          {(form.expenseType === 'pret_partenariat' || form.expenseType === 'projet_special') && (
            <Card>
              <CardHeader>
                <CardTitle>Bénéficiaire externe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (form.beneficiaryExternal) {
                      handleInputChange('beneficiaryExternal', null);
                    } else {
                      handleInputChange('beneficiaryExternal', {
                        name: '', type: 'association', contact: '', iban: ''
                      });
                    }
                  }}
                >
                  {form.beneficiaryExternal ? 'Supprimer bénéficiaire externe' : 'Ajouter bénéficiaire externe'}
                </Button>

                {form.beneficiaryExternal && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FormLabel htmlFor="beneficiaryName">Nom</FormLabel>
                      <Input
                        id="beneficiaryName"
                        placeholder="Nom de l'organisation"
                        value={form.beneficiaryExternal.name}
                        onChange={(e) => handleBeneficiaryExternalChange('name', e.target.value)}
                      />
                    </div>

                    <div>
                      <FormLabel htmlFor="beneficiaryType">Type</FormLabel>
                      <FormSelect 
                        value={form.beneficiaryExternal.type} 
                        onChange={(value) => handleBeneficiaryExternalChange('type', value)}
                        placeholder="Choisir un type"
                      >
                        <option value="association">Association</option>
                        <option value="entreprise">Entreprise</option>
                        <option value="particulier">Particulier</option>
                        <option value="institution">Institution</option>
                      </FormSelect>
                    </div>

                    <div>
                      <FormLabel htmlFor="beneficiaryContact">Contact</FormLabel>
                      <Input
                        id="beneficiaryContact"
                        placeholder="Email ou téléphone"
                        value={form.beneficiaryExternal.contact}
                        onChange={(e) => handleBeneficiaryExternalChange('contact', e.target.value)}
                      />
                    </div>

                    <div>
                      <FormLabel htmlFor="beneficiaryIban">IBAN (optionnel)</FormLabel>
                      <Input
                        id="beneficiaryIban"
                        placeholder="FR76 1234 5678 9012 3456 789"
                        value={form.beneficiaryExternal.iban}
                        onChange={(e) => handleBeneficiaryExternalChange('iban', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Conditions de prêt */}
          <Card>
            <CardHeader>
              <CardTitle>Conditions financières</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isLoan"
                  checked={form.isLoan}
                  onChange={(e) => {
                    const isLoan = e.target.checked;
                    handleInputChange('isLoan', isLoan);
                    if (isLoan && !form.loanTerms) {
                      handleInputChange('loanTerms', {
                        durationMonths: '',
                        interestRate: '0',
                        monthlyPayment: ''
                      });
                    } else if (!isLoan) {
                      handleInputChange('loanTerms', null);
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <FormLabel htmlFor="isLoan">Il s'agit d'un prêt à rembourser</FormLabel>
              </div>

              {form.isLoan && form.loanTerms && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
                  <div>
                    <FormLabel htmlFor="durationMonths">Durée (mois)</FormLabel>
                    <Input
                      id="durationMonths"
                      type="number"
                      min="1"
                      placeholder="12"
                      value={form.loanTerms.durationMonths}
                      onChange={(e) => handleLoanTermsChange('durationMonths', e.target.value)}
                    />
                  </div>

                  <div>
                    <FormLabel htmlFor="interestRate">Taux d'intérêt (%)</FormLabel>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0"
                      value={form.loanTerms.interestRate}
                      onChange={(e) => handleLoanTermsChange('interestRate', e.target.value)}
                    />
                  </div>

                  <div>
                    <FormLabel htmlFor="monthlyPayment">Remboursement mensuel</FormLabel>
                    <Input
                      id="monthlyPayment"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Calculé automatiquement"
                      value={form.loanTerms.monthlyPayment}
                      onChange={(e) => handleLoanTermsChange('monthlyPayment', e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <FormLabel htmlFor="expectedImpact">Impact attendu</FormLabel>
                <Textarea
                  id="expectedImpact"
                  placeholder="Décrivez l'impact positif attendu de cette dépense sur l'association ou la communauté..."
                  value={form.expectedImpact}
                  onChange={(e) => handleInputChange('expectedImpact', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents justificatifs - Simplifié pour l'instant */}
          <Card>
            <CardHeader>
              <CardTitle>Documents justificatifs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  📎 La gestion des documents sera disponible prochainement. 
                  Vous pourrez les ajouter après création de la demande.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/modules/associations/${associationId}/finances`)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.expenseType || !form.title || !form.description || !form.amountRequested}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer la demande
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}