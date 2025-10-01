// src/app/modules/associations/[id]/finances/income/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuthStore } from "@/stores/authStore";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/Select";
import {
  ArrowLeft,
  Plus,
  TrendingUp,
  Gift,
  Building2,
  PartyPopper,
  Handshake as HandshakeIcon,
  PiggyBank,
  Calendar,
  Euro,
  FileText,
  Download,
  Edit,
  Trash2,
  Filter,
  Search,
  BarChart3,
  Settings,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

// 🔧 INTERFACES CORRIGÉES SELON BACKEND
interface IncomeEntry {
  id: number;
  incomeType: string;
  amount: number;
  currency: string;
  title: string;
  sourceName: string;
  sourceDetails?: string;
  description: string;
  receivedDate: string;
  paymentMethod: string;
  manualReference?: string;
  documents?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
  validatedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  validatedAt?: string;
  status: string;
  createdAt: string;
  registeredByUser: {
    firstName: string;
    lastName: string;
  };
  receiptGenerated: boolean;
  receiptNumber?: string;
}

interface IncomeType {
  key: string;
  label: string;
  description: string;
  requiresReceipt: boolean;
  validationRequired: boolean;
  maxAmount?: number;
  statistics?: {
    count: number;
    totalAmount: number;
  };
}

interface NewIncomeData {
  incomeType: string;
  amount: string;
  title: string;
  sourceName: string;
  sourceDetails?: string;
  description: string;
  receivedDate: string;
  paymentMethod: string;
  manualReference: string;
  receiptGenerated: boolean;
  justificatifFile?: File;
}

export default function IncomePage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const associationId = params.id as string;

  const [association, setAssociation] = useState<any>(null);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'entries' | 'settings'>('overview');

  // Filtres
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal nouveau revenu
  const [showNewIncomeModal, setShowNewIncomeModal] = useState(false);
  const [newIncomeData, setNewIncomeData] = useState<NewIncomeData>({
    incomeType: '',
    amount: '',
    title: '',
    sourceName: '',
    sourceDetails: '',
    description: '',
    receivedDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    manualReference: '',
    receiptGenerated: false,
    justificatifFile: undefined
  });

  const [newTypeData, setNewTypeData] = useState({
  typeName: '',
  typeLabel: '',
  description: '',
  defaultSourceType: 'individual',
  requiresReceipt: false,
  validationRequired: false,
  maxAmount: '',
  allowAnonymous: true
});

  // Modal configuration types
  const [showTypesModal, setShowTypesModal] = useState(false);
  const [editingType, setEditingType] = useState<IncomeType | null>(null);

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
        fetchIncomeEntries(),
        fetchIncomeTypes()
      ]);
    } catch (error) {
      console.error("Erreur chargement données:", error); 
      toast.error("Erreur de chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssociation = async () => {
    try {
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
    } catch (error) {
      console.error("Erreur chargement association:", error);
    }
  };

  const fetchIncomeEntries = async () => {
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/income-entries?status=all&sortBy=receivedDate&sortOrder=DESC`;
      console.log('🔍 Fetching income entries from:', url);

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Income entries received:', result);
        setIncomeEntries(result.data.incomeEntries || []);
      } else {
        setIncomeEntries([]);
      }
    } catch (error) {
      console.error("Erreur chargement entrées:", error);
      setIncomeEntries([]);
    }
  };

  const fetchIncomeTypes = async () => { 
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/income-types`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setIncomeTypes(result.data.incomeTypes || []);
      } else {
        console.error('Erreur chargement types d\'entrées');
        setIncomeTypes([]);
      }
    } catch (error) {
      console.error('Erreur chargement income types:', error);
      setIncomeTypes([]);
    }
  };

  const getIncomeTypeIcon = (type: string) => {
    switch (type) {
      case 'don_prive': return Gift;
      case 'subvention_publique': return Building2;
      case 'vente_evenement': return PartyPopper;
      case 'partenariat_commercial': return HandshakeIcon;
      default: return PiggyBank;
    }
  };

  const getIncomeTypeLabel = (type: string) => {
    const incomeType = incomeTypes.find(t => t.key === type);
    return incomeType?.label || type;
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Virement bancaire';
      case 'cash': return 'Espèces';
      case 'check': return 'Chèque';
      case 'card_payment': return 'Carte bancaire';
      case 'mobile_money': return 'Mobile Money';
      default: return method;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">En attente</Badge>;
      case 'validated':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Validé</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewIncomeData({
        ...newIncomeData,
        justificatifFile: file
      });
    }
  };

  const createIncomeEntry = async () => {
  // Validation frontend
  if (!newIncomeData.incomeType || !newIncomeData.amount || !newIncomeData.title.trim() || !newIncomeData.sourceName.trim() || !newIncomeData.description.trim()) {
    toast.error("Tous les champs obligatoires doivent être remplis");
    return;
  }

  // Validation longueur titre
  if (newIncomeData.title.trim().length < 5) {
    toast.error("Le titre doit contenir au moins 5 caractères");
    return;
  }

  setIsSubmitting(true);
  try {
    const payload = {
      incomeType: newIncomeData.incomeType,
      amount: parseFloat(newIncomeData.amount),
      title: newIncomeData.title.trim(),
      sourceName: newIncomeData.sourceName.trim(),
      sourceType: 'individual',
      description: newIncomeData.description.trim(),
      receivedDate: newIncomeData.receivedDate,
      paymentMethod: newIncomeData.paymentMethod,
      currency: 'EUR',
      incomeSubtype: '',
      fees: 0,
      grossAmount: parseFloat(newIncomeData.amount),
      manualReference: newIncomeData.manualReference || '',
      isAnonymous: false,
      restrictedUse: false,
      publiclyVisible: false,
      thanksRequired: false,
      purpose: null,
      sourceDetails: null,
      bankDetails: null,
      designatedFor: null,
      usageRestrictions: null,
      tags: null
      
    };

    console.log("📤 Payload AVANT envoi:", JSON.stringify(payload, null, 2));

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/income-entries`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log("📥 Réponse complète:", JSON.stringify(result, null, 2));

    if (response.ok) {
      toast.success('Revenu enregistré avec succès');
      setShowNewIncomeModal(false);
      setNewIncomeData({
        incomeType: '',
        amount: '',
        title: '',
        sourceName: '',
        description: '',
        receivedDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        manualReference: '',
        receiptGenerated: false,
        justificatifFile: undefined
      });
      await fetchIncomeEntries();
    } else {
      console.error("❌ Détails de l'erreur:", result);
      // Afficher les détails de validation si disponibles
      if (result.details) {
        console.error("❌ Erreurs de validation:", result.details);
        toast.error(`Validation échouée: ${result.details.map((d: any) => d.msg).join(', ')}`);
      } else {
        toast.error(result.error || "Erreur lors de la création du revenu");
      }
    }
  } catch (error) {
    console.error("💥 Erreur complète:", error);
    toast.error("Erreur de connexion au serveur");
  } finally {
    setIsSubmitting(false);
  }
};

  const deleteIncomeEntry = async (entryId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce revenu ?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/income-entries/${entryId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        toast.success("Revenu supprimé");
        await fetchIncomeEntries();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const createIncomeType = async () => {
  if (!newTypeData.typeName.trim() || !newTypeData.typeLabel.trim()) {
    toast.error("Le nom technique et le libellé sont obligatoires");
    return;
  }

  // Validation du nom technique (sans espaces ni caractères spéciaux)
  if (!/^[a-z0-9_]+$/.test(newTypeData.typeName)) {
    toast.error("Le nom technique ne doit contenir que des lettres minuscules, chiffres et underscores");
    return;
  }

  setIsSubmitting(true);
  try {
    const payload = {
      typeName: newTypeData.typeName.trim(),
      typeLabel: newTypeData.typeLabel.trim(),
      description: newTypeData.description.trim(),
      defaultSourceType: newTypeData.defaultSourceType,
      requiresReceipt: newTypeData.requiresReceipt,
      maxAmount: newTypeData.maxAmount ? parseFloat(newTypeData.maxAmount) : null,
      allowAnonymous: newTypeData.allowAnonymous
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/income-types`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      const result = await response.json();
      toast.success(`Type "${result.data.typeConfig.label}" créé avec succès`);
      setShowTypesModal(false);
      setEditingType(null);
      setNewTypeData({
        typeName: '',
        typeLabel: '',
        description: '',
        defaultSourceType: 'individual',
        requiresReceipt: false,
        validationRequired: false,
        maxAmount: '',
        allowAnonymous: true
      });
      await fetchIncomeTypes(); // Recharger la liste
    } else {
      const error = await response.json();
      toast.error(error.error || "Erreur lors de la création du type");
    }
  } catch (error) {
    console.error("Erreur création type:", error);
    toast.error("Erreur lors de la création du type");
  } finally {
    setIsSubmitting(false);
  }
};

  // Calculs statistiques
  const calculateStats = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisYear = incomeEntries.filter(entry => 
      new Date(entry.receivedDate).getFullYear() === currentYear && entry.status === 'validated'
    );
    
    const thisMonth = thisYear.filter(entry => 
      new Date(entry.receivedDate).getMonth() === currentMonth
    );

    const totalThisYear = thisYear.reduce((sum, entry) => sum + entry.amount, 0);
    const totalThisMonth = thisMonth.reduce((sum, entry) => sum + entry.amount, 0);

    const byType = incomeTypes.map(type => ({
      type: type.key,
      label: type.label,
      count: thisYear.filter(entry => entry.incomeType === type.key).length,
      total: thisYear.filter(entry => entry.incomeType === type.key).reduce((sum, entry) => sum + entry.amount, 0)
    })).filter(item => item.count > 0);

    return {
      totalThisYear,
      totalThisMonth,
      entriesThisYear: thisYear.length,
      entriesThisMonth: thisMonth.length,
      byType
    };
  };

  // Filtrer les entrées
  const filteredEntries = incomeEntries.filter(entry => {
    if (filterType !== 'all' && entry.incomeType !== filterType) return false;
    if (filterStatus !== 'all' && entry.status !== filterStatus) return false;
    
    if (filterPeriod !== 'all') {
      const entryDate = new Date(entry.receivedDate);
      const now = new Date();
      
      switch (filterPeriod) {
        case 'this_month':
          if (entryDate.getMonth() !== now.getMonth() || entryDate.getFullYear() !== now.getFullYear()) return false;
          break;
        case 'this_year':
          if (entryDate.getFullYear() !== now.getFullYear()) return false;
          break;
        case 'last_3_months':
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          if (entryDate < threeMonthsAgo) return false;
          break;
      }
    }
    
    if (searchTerm && 
        !entry.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !entry.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !entry.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !entry.manualReference?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  const stats = calculateStats();

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
    
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/modules/associations/${associationId}/finances`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux finances
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Revenus</h1>
              <p className="text-gray-600">{association?.name}</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowNewIncomeModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau revenu
          </Button>
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('entries')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'entries'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Historique des revenus
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Configuration
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total cette année</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.totalThisYear.toFixed(2)} €
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ce mois</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.totalThisMonth.toFixed(2)} €
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Entrées cette année</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.entriesThisYear}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Moyenne mensuelle</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {stats.entriesThisYear > 0 ? (stats.totalThisYear / Math.max(1, new Date().getMonth() + 1)).toFixed(2) : '0.00'} €
                      </p>
                    </div>
                    <Euro className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Répartition par type */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par type de revenu (cette année)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.byType.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Aucun revenu enregistré cette année</p>
                  ) : (
                    stats.byType.map((item) => {
                      const Icon = getIncomeTypeIcon(item.type);
                      const percentage = stats.totalThisYear > 0 ? (item.total / stats.totalThisYear) * 100 : 0;
                      
                      return (
                        <div key={item.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Icon className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.label}</p>
                              <p className="text-sm text-gray-600">{item.count} entrée(s) - {percentage.toFixed(1)}%</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{item.total.toFixed(2)} €</p>
                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Entries tab */}
        {activeTab === 'entries' && (
          <div className="space-y-6">
            {/* Filtres */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <Select 
                    value={filterType} 
                    onValueChange={setFilterType}
                    defaultValue="all"
                    name="filterType"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {incomeTypes.map(type => (
                        <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={filterStatus} 
                    onValueChange={setFilterStatus}
                    defaultValue="all"
                    name="filterStatus"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="validated">Validé</SelectItem>
                      <SelectItem value="rejected">Refusé</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={filterPeriod} 
                    onValueChange={setFilterPeriod}
                    defaultValue="all"
                    name="filterPeriod"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes périodes</SelectItem>
                      <SelectItem value="this_month">Ce mois</SelectItem>
                      <SelectItem value="last_3_months">3 derniers mois</SelectItem>
                      <SelectItem value="this_year">Cette année</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={() => {
                    setFilterType('all');
                    setFilterStatus('all');
                    setFilterPeriod('all');
                    setSearchTerm('');
                  }}>
                    <Filter className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Liste des revenus */}
            <div className="space-y-4">
              {filteredEntries.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun revenu trouvé</h3>
                    <p className="text-gray-600 mb-4">
                      {incomeEntries.length === 0 
                        ? "Aucun revenu n'a encore été enregistré"
                        : "Aucun revenu ne correspond aux critères de filtrage"
                      }
                    </p>
                    <Button onClick={() => setShowNewIncomeModal(true)} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Enregistrer le premier revenu
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredEntries.map((entry) => {
                  const Icon = getIncomeTypeIcon(entry.incomeType);

                  return (
                    <Card key={entry.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Icon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                                <p className="text-sm text-gray-600">{getIncomeTypeLabel(entry.incomeType)}</p>
                                <p className="text-sm text-gray-500">Source: {entry.sourceName}</p>
                              </div>
                              {getStatusBadge(entry.status)}
                              {entry.receiptGenerated && (
                                <Badge className="bg-blue-100 text-blue-700">Reçu fiscal</Badge>
                              )}
                            </div>

                            <p className="text-gray-700 mb-4">{entry.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Date de réception</p>
                                <p className="font-medium">{new Date(entry.receivedDate).toLocaleDateString('fr-FR')}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Méthode</p>
                                <p className="font-medium">{getPaymentMethodLabel(entry.paymentMethod)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Référence</p>
                                <p className="font-medium">{entry.manualReference || 'Non renseignée'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Enregistré par</p>
                                <p className="font-medium">{entry.registeredByUser.firstName} {entry.registeredByUser.lastName}</p>
                              </div>
                            </div>

                            {entry.validatedByUser && entry.validatedAt && (
                              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-700">
                                  Validé par {entry.validatedByUser.firstName} {entry.validatedByUser.lastName} le {new Date(entry.validatedAt).toLocaleDateString('fr-FR')}
                                  </p>
                              </div>
                            )}

                            {entry.documents && entry.documents.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Documents joints:</p>
                                <div className="flex flex-wrap gap-2">
                                  {entry.documents.map((doc, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(doc.url, '_blank')}
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      {doc.name}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="text-right ml-6">
                            <p className="text-2xl font-bold text-green-600 mb-4">
                              +{entry.amount.toFixed(2)} {entry.currency}
                            </p>

                            <div className="space-y-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  console.log('Modifier revenu', entry.id);
                                }}
                                className="w-full"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteIncomeEntry(entry.id)}
                                className="w-full border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Types de revenus configurés</CardTitle>
              </CardHeader>
              <CardContent>
                {incomeTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun type d'entrée configuré
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Créez vos premiers types d'entrées d'argent personnalisés
                    </p>
                    <Button
                      onClick={() => {
                        setEditingType(null);
                        setShowTypesModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le premier type
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incomeTypes.map((type) => {
                      const Icon = getIncomeTypeIcon(type.key);
                      
                      return (
                        <div key={type.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Icon className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{type.label}</p>
                              <p className="text-sm text-gray-600">{type.description}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                {type.requiresReceipt && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Reçu fiscal</span>
                                )}
                                {type.validationRequired && (
                                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Validation requise</span>
                                )}
                                {type.maxAmount && (
                                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Max: {type.maxAmount}€</span>
                                )}
                                {type.statistics && type.statistics.count > 0 && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    {type.statistics.count} utilisations
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingType(type);
                                setShowTypesModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (confirm(`Supprimer le type "${type.label}" ?`)) {
                                  console.log('Supprimer type', type.key);
                                }
                              }}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {incomeTypes.length > 0 && (
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setEditingType(null);
                        setShowTypesModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer nouveau type
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paramètres généraux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Génération automatique reçus fiscaux</p>
                    <p className="text-sm text-gray-600">Créer automatiquement les reçus pour les dons éligibles</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Notifications revenus importants</p>
                    <p className="text-sm text-gray-600">Alerter le bureau pour les revenus supérieurs à 500€</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Validation bureau pour montants élevés</p>
                    <p className="text-sm text-gray-600">Validation obligatoire du bureau pour revenus supérieurs à 1000€</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal nouveau revenu */}
        {showNewIncomeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Nouveau Revenu</h2>

              {incomeTypes.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Types d'entrées non configurés</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Veuillez d'abord configurer les types d'entrées dans l'onglet Configuration.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => {
                      setShowNewIncomeModal(false);
                      setActiveTab('settings');
                    }}
                  >
                    Aller à la configuration
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="incomeType" required>Type de revenu</Label>
                    <Select 
                      value={newIncomeData.incomeType} 
                      onValueChange={(value) => setNewIncomeData({ ...newIncomeData, incomeType: value })}
                      defaultValue=""
                      name="incomeType"
                    >
                      <SelectTrigger id="incomeType" className="mt-1">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {incomeTypes.map(type => (
                          <SelectItem key={type.key} value={type.key}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount" required>Montant (€)</Label>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newIncomeData.amount || ''}
                        onChange={(e) => setNewIncomeData({
                          ...newIncomeData,
                          amount: parseFloat(e.target.value) || 0
                        })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="receivedDate" required>Date de réception</Label>
                      <input
                        id="receivedDate"
                        type="date"
                        value={newIncomeData.receivedDate}
                        onChange={(e) => setNewIncomeData({ ...newIncomeData, receivedDate: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title" required>Titre/Objet</Label>
                    <input
                      id="title"
                      type="text"
                      value={newIncomeData.title}
                      onChange={(e) => setNewIncomeData({ ...newIncomeData, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                      placeholder="Ex: Don pour construction école, Subvention mairie..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sourceName" required>Source/Donateur</Label>
                    <input
                      id="sourceName"
                      type="text"
                      value={newIncomeData.sourceName}
                      onChange={(e) => setNewIncomeData({ ...newIncomeData, sourceName: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                      placeholder="Ex: Famille Diallo, Mairie 19ème, Entreprise X..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="sourceDetails">Détails complémentaires (optionnel)</Label>
                    <Textarea
                      id="sourceDetails"
                      value={newIncomeData.sourceDetails || ''}
                      onChange={(e) => setNewIncomeData({ ...newIncomeData, sourceDetails: e.target.value })}
                      placeholder="Ex: Contact, adresse, informations supplémentaires..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" required>Description</Label>
                    <Textarea
                      id="description"
                      value={newIncomeData.description}
                      onChange={(e) => setNewIncomeData({ ...newIncomeData, description: e.target.value })}
                      placeholder="Description du revenu, contexte, utilisation prévue..."
                      className="mt-1"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentMethod" required>Méthode de réception</Label>
                      <Select 
                        value={newIncomeData.paymentMethod} 
                        onValueChange={(value) => setNewIncomeData({ ...newIncomeData, paymentMethod: value })}
                        defaultValue="bank_transfer"
                        name="paymentMethod"
                      >
                        <SelectTrigger id="paymentMethod" className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                          <SelectItem value="cash">Espèces</SelectItem>
                          <SelectItem value="check">Chèque</SelectItem>
                          <SelectItem value="card_payment">Carte bancaire</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="manualReference">Référence</Label>
                      <input
                        id="manualReference"
                        type="text"
                        value={newIncomeData.manualReference}
                        onChange={(e) => setNewIncomeData({ ...newIncomeData, manualReference: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                        placeholder="Ex: DON-DIALLO-2024-001, VIR-MAIRIE-001..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="justificatif">Justificatif (optionnel)</Label>
                    <div className="mt-1 flex items-center space-x-3">
                      <input
                        id="justificatif"
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      {newIncomeData.justificatifFile && (
                        <span className="text-sm text-green-600">{newIncomeData.justificatifFile.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG - Max 5MB (reçu, capture virement, etc.)
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="receiptGenerated"
                      type="checkbox"
                      checked={newIncomeData.receiptGenerated}
                      onChange={(e) => setNewIncomeData({ ...newIncomeData, receiptGenerated: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="receiptGenerated">Générer un reçu fiscal</Label>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewIncomeModal(false);
                    setNewIncomeData({
                      incomeType: '',
                      amount: 0,
                      title: '',
                      sourceName: '',
                      sourceDetails: '',
                      description: '',
                      receivedDate: new Date().toISOString().split('T')[0],
                      paymentMethod: 'bank_transfer',
                      manualReference: '',
                      receiptGenerated: false,
                      justificatifFile: undefined
                    });
                  }}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={createIncomeEntry}
                  disabled={isSubmitting || incomeTypes.length === 0 || !newIncomeData.incomeType || !newIncomeData.amount || !newIncomeData.title.trim() || !newIncomeData.sourceName.trim() || !newIncomeData.description.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal configuration type */}
        {showTypesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingType ? 'Modifier le type' : 'Créer un nouveau type'}
              </h2>

              {editingType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Modification désactivée</p>
                      <p className="text-sm text-blue-700 mt-1">
                        La modification des types existants sera disponible prochainement.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="typeName" required>Nom technique (clé unique)</Label>
                  <input
                    id="typeName"
                    type="text"
                    value={newTypeData.typeName}
                    onChange={(e) => setNewTypeData({ ...newTypeData, typeName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                    placeholder="Ex: subvention_mairie"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                    disabled={editingType !== null}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Utilisé en interne, uniquement lettres minuscules, chiffres et underscores
                  </p>
                </div>

                <div>
                  <Label htmlFor="typeLabel" required>Libellé (affiché)</Label>
                  <input
                    id="typeLabel"
                    type="text"
                    value={newTypeData.typeLabel}
                    onChange={(e) => setNewTypeData({ ...newTypeData, typeLabel: e.target.value })}
                    placeholder="Ex: Subvention Mairie"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                    disabled={editingType !== null}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="typeDescription">Description</Label>
                  <Textarea
                    id="typeDescription"
                    value={newTypeData.description}
                    onChange={(e) => setNewTypeData({ ...newTypeData, description: e.target.value })}
                    placeholder="Description détaillée du type d'entrée..."
                    className="mt-1"
                    rows={3}
                    disabled={editingType !== null}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultSourceType">Type de source par défaut</Label>
                    <Select 
                      value={newTypeData.defaultSourceType}
                      onValueChange={(value) => setNewTypeData({ ...newTypeData, defaultSourceType: value })}
                      disabled={editingType !== null}
                      name="defaultSourceType"
                    >
                      <SelectTrigger id="defaultSourceType" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Particulier</SelectItem>
                        <SelectItem value="company">Entreprise</SelectItem>
                        <SelectItem value="government">Organisme public</SelectItem>
                        <SelectItem value="ngo">ONG</SelectItem>
                        <SelectItem value="foundation">Fondation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="maxAmount">Montant maximum (€)</Label>
                    <input
                      id="maxAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newTypeData.maxAmount}
                      onChange={(e) => setNewTypeData({ ...newTypeData, maxAmount: e.target.value })}
                      placeholder="Ex: 50000"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                      disabled={editingType !== null}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      id="requiresReceipt"
                      type="checkbox"
                      checked={newTypeData.requiresReceipt}
                      onChange={(e) => setNewTypeData({ ...newTypeData, requiresReceipt: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      disabled={editingType !== null}
                    />
                    <Label htmlFor="requiresReceipt">Génération reçu fiscal requise</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="validationRequired"
                      type="checkbox"
                      checked={newTypeData.validationRequired}
                      onChange={(e) => setNewTypeData({ ...newTypeData, validationRequired: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      disabled={editingType !== null}
                    />
                    <Label htmlFor="validationRequired">Validation bureau obligatoire</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="allowAnonymous"
                      type="checkbox"
                      checked={newTypeData.allowAnonymous}
                      onChange={(e) => setNewTypeData({ ...newTypeData, allowAnonymous: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      disabled={editingType !== null}
                    />
                    <Label htmlFor="allowAnonymous">Autoriser dons anonymes</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTypesModal(false);
                    setEditingType(null);
                    setNewTypeData({
                      typeName: '',
                      typeLabel: '',
                      description: '',
                      defaultSourceType: 'individual',
                      requiresReceipt: false,
                      validationRequired: false,
                      maxAmount: '',
                      allowAnonymous: true
                    });
                  }}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={createIncomeType}
                  disabled={isSubmitting || editingType !== null || !newTypeData.typeName.trim() || !newTypeData.typeLabel.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {editingType ? 'Mettre à jour' : 'Créer le type'}
                </Button>
              </div>
            </div>
          </div>
        )}

        



      </div>
    </ProtectedRoute>
  );
}