// src/app/modules/associations/[id]/finances/create/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
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
    
    if (!form.expenseType || !form.title || !form.description || !form.amountRequested) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      
      // Données de base
      formData.append('expenseType', form.expenseType);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('amountRequested', form.amountRequested);
      formData.append('currency', form.currency);
      formData.append('urgencyLevel', form.urgencyLevel);
      formData.append('isLoan', form.isLoan.toString());

      // Données optionnelles
      if (form.expenseSubtype) formData.append('expenseSubtype', form.expenseSubtype);
      if (form.beneficiaryId) formData.append('beneficiaryId', form.beneficiaryId);
      if (form.expectedImpact) formData.append('expectedImpact', form.expectedImpact);
      
      // Bénéficiaire externe
      if (form.beneficiaryExternal) {
        formData.append('beneficiaryExternal', JSON.stringify(form.beneficiaryExternal));
      }

      // Conditions de prêt
      if (form.isLoan && form.loanTerms) {
        formData.append('loanTerms', JSON.stringify(form.loanTerms));
      }

      // Documents
      form.documents.forEach((file, index) => {
        formData.append(`documents[${index}]`, file);
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/expense-requests`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        const result = await response.json();
        router.push(`/modules/associations/${associationId}/finances/${result.expenseRequest.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erreur lors de la création de la demande");
      }
    } catch (error) {
      console.error("Erreur création demande:", error);
      setError("Erreur de connexion");
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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
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
                  <Label htmlFor="expenseSubtype">Sous-catégorie (optionnel)</Label>
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
                <Label htmlFor="title">Titre de la demande *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Aide retour urgence, Achat matériel bureau..."
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description détaillée *</Label>
                <Textarea
                  id="description"
                  placeholder="Expliquez en détail la raison de cette demande, son importance et son impact attendu..."
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amountRequested">Montant demandé *</Label>
                  <Input
                    id="amountRequested"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={form.amountRequested}
                    onChange={(e) => handleInputChange('amountRequested', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={form.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="XOF">XOF (FCFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="urgencyLevel">Niveau d'urgence</Label>
                  <Select value={form.urgencyLevel} onValueChange={(value) => handleInputChange('urgencyLevel', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center space-x-2">
                            <div className={`h-2 w-2 rounded-full bg-${level.color}-500`}></div>
                            <span>{level.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="beneficiaryId">Membre bénéficiaire</Label>
                  <Select value={form.beneficiaryId} onValueChange={(value) => handleInputChange('beneficiaryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un membre" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.firstName} {member.lastName} - {member.memberType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <Label htmlFor="beneficiaryName">Nom</Label>
                      <Input
                        id="beneficiaryName"
                        placeholder="Nom de l'organisation"
                        value={form.beneficiaryExternal.name}
                        onChange={(e) => handleBeneficiaryExternalChange('name', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="beneficiaryType">Type</Label>
                      <Select 
                        value={form.beneficiaryExternal.type} 
                        onValueChange={(value) => handleBeneficiaryExternalChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="association">Association</SelectItem>
                          <SelectItem value="entreprise">Entreprise</SelectItem>
                          <SelectItem value="particulier">Particulier</SelectItem>
                          <SelectItem value="institution">Institution</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="beneficiaryContact">Contact</Label>
                      <Input
                        id="beneficiaryContact"
                        placeholder="Email ou téléphone"
                        value={form.beneficiaryExternal.contact}
                        onChange={(e) => handleBeneficiaryExternalChange('contact', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="beneficiaryIban">IBAN (optionnel)</Label>
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
                <Label htmlFor="isLoan">Il s'agit d'un prêt à rembourser</Label>
              </div>

              {form.isLoan && form.loanTerms && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
                  <div>
                    <Label htmlFor="durationMonths">Durée (mois)</Label>
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
                    <Label htmlFor="interestRate">Taux d'intérêt (%)</Label>
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
                    <Label htmlFor="monthlyPayment">Remboursement mensuel</Label>
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
                <Label htmlFor="expectedImpact">Impact attendu</Label>
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

          {/* Documents justificatifs */}
          <Card>
            <CardHeader>
              <CardTitle>Documents justificatifs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Glissez vos fichiers ici ou cliquez pour parcourir</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  Choisir des fichiers
                </Button>
                <p className="text-xs text-gray-500 mt-2">PDF, images, documents Word (max 10MB par fichier)</p>
              </div>

              {form.documents.length > 0 && (
                <div className="space-y-2">
                  {form.documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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