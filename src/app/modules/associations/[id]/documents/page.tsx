// src/app/modules/associations/[id]/documents/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  File,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  FileText,
  Building,
  CreditCard,
  Users,
  X 
} from "lucide-react";

interface Document {
  id: number;
  type: string;
  title: string;
  fileName: string;
  status: 'pending' | 'validated' | 'rejected';
  createdAt: string;
}

interface DocumentViewerModal {
  isOpen: boolean;
  document: Document | null;
  fileUrl: string | null;
}

interface Association {
  id: number;
  name: string;
  documentsStatus?: {
    statuts?: { uploaded: boolean; validated: boolean; expiresAt?: string };
    receipisse?: { uploaded: boolean; validated: boolean; expiresAt?: string };
    rib?: { uploaded: boolean; validated: boolean; expiresAt?: string };
    pv_creation?: { uploaded: boolean; validated: boolean; expiresAt?: string };
  };
}

// Configuration des types de documents
const DOCUMENT_TYPES = [
  {
    key: 'statuts',
    label: 'Statuts de l\'association',
    description: 'Document officiel définissant les règles de l\'association',
    required: true,
    icon: Building,
    acceptedFormats: 'PDF uniquement'
  },
  {
    key: 'receipisse',
    label: 'Récépissé de déclaration',
    description: 'Récépissé de déclaration en préfecture ou autorité compétente',
    required: true,
    icon: FileText,
    acceptedFormats: 'PDF, JPG, PNG'
  },
  {
    key: 'rib',
    label: 'RIB de l\'association',
    description: 'Relevé d\'identité bancaire au nom de l\'association',
    required: true,
    icon: CreditCard,
    acceptedFormats: 'PDF, JPG, PNG'
  },
  {
    key: 'pv_creation',
    label: 'PV de création',
    description: 'Procès-verbal de l\'assemblée constitutive',
    required: false,
    icon: Users,
    acceptedFormats: 'PDF uniquement'
  }
];

export default function AssociationDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [association, setAssociation] = useState<Association | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [documentViewer, setDocumentViewer] = useState<DocumentViewerModal>({
    isOpen: false,
    document: null,
    fileUrl: null
  });

  const associationId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      if (!associationId || !token) return;

      try {
        // Charger l'association
        const associationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (associationResponse.ok) {
          const result = await associationResponse.json();
          setAssociation(result.data.association);
        }

        // Charger les documents
        const documentsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/documents`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (documentsResponse.ok) {
          const result = await documentsResponse.json();
          setDocuments(result.data.documents);
        }
      } catch (error) {
        console.error("Erreur chargement documents:", error);
        toast.error("Erreur de chargement");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [associationId, token]);

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!file) return;

    setIsUploading(documentType);

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('type', documentType);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/documents`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        // Recharger les données
        const associationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (associationResponse.ok) {
          const result = await associationResponse.json();
          setAssociation(result.data.association);
        }

        const documentsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/documents`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (documentsResponse.ok) {
          const result = await documentsResponse.json();
          setDocuments(result.data.documents);
        }

        toast.success("Document uploadé avec succès", {
          description: `Le document ${DOCUMENT_TYPES.find(t => t.key === documentType)?.label} est en cours de validation`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Erreur upload:", error);
      toast.error("Erreur lors de l'upload", {
        description: "Le document n'a pas pu être téléchargé",
      });
    } finally {
      setIsUploading(null);
    }
  };

  const getDocumentStatus = (documentKey: string) => {
    const docStatus = association?.documentsStatus?.[documentKey as keyof typeof association.documentsStatus];
    const document = documents.find(d => d.type.includes(documentKey) || 
      (documentKey === 'statuts' && d.type === 'association_statuts') ||
      (documentKey === 'receipisse' && d.type === 'association_receipt') ||
      (documentKey === 'rib' && d.type === 'iban_proof') ||
      (documentKey === 'pv_creation' && d.type === 'meeting_minutes')
    );

    if (!docStatus || !docStatus.uploaded) {
      return { status: 'missing', label: 'En attente', color: 'bg-gray-100 text-gray-600', document: null };
    }

    if (document) {
      switch (document.status) {
        case 'validated':
          return { status: 'validated', label: 'Validé', color: 'bg-green-100 text-green-700', document };
        case 'rejected':
          return { status: 'rejected', label: 'Rejeté', color: 'bg-red-100 text-red-700', document };
        case 'pending':
        default:
          return { status: 'pending', label: 'En validation', color: 'bg-yellow-100 text-yellow-700', document };
      }
    }

    return { status: 'pending', label: 'En validation', color: 'bg-yellow-100 text-yellow-700', document: null };
  };

  // ✅ FONCTIONS DE TÉLÉCHARGEMENT ET VISUALISATION
  const handleDownloadDocument = async (documentId: number, fileName: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/documents/${documentId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // Télécharger le fichier
        const link = document.createElement('a');
        link.href = result.data.downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Téléchargement initié", {
          description: `${fileName} est en cours de téléchargement`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      toast.error("Erreur de téléchargement", {
        description: "Le document n'a pas pu être téléchargé",
      });
    }
  };

 const handleViewDocument = async (documentId: number, fileName: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/documents/${documentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.ok) {
      const result = await response.json();
      const document = documents.find(d => d.id === documentId);
      
      // ✅ UTILISER L'URL DE L'API (sans /api/v1)
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
      const fileUrl = `${backendUrl}/${result.data.downloadUrl}?token=${token}`;
      
      setDocumentViewer({
        isOpen: true,
        document: document || null,
        fileUrl: fileUrl
      });
    }
  } catch (error) {
    console.error("Erreur visualisation:", error);
    toast.error("Erreur de visualisation");
  }
};

  const handleCloseViewer = () => {
    setDocumentViewer({
      isOpen: false,
      document: null,
      fileUrl: null
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement des documents...</p>
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
            Documents - {association.name}
          </h1>
          <p className="text-gray-600">
            Gestion des documents légaux et administratifs
          </p>
        </div>
      </div>

      {/* Documents légaux KYB */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents légaux de l'association
          </CardTitle>
          <p className="text-sm text-gray-600">
            Documents requis pour la validation de votre association
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {DOCUMENT_TYPES.map((docType) => {
            const Icon = docType.icon;
            const status = getDocumentStatus(docType.key);
            
            return (
              <Card key={docType.key} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="h-6 w-6 text-gray-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-gray-900">
                          {docType.label}
                        </h3>
                        {docType.required && (
                          <Badge variant="secondary" className="text-xs">
                            Obligatoire
                          </Badge>
                        )}
                        <Badge className={status.color}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {docType.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        Formats acceptés: {docType.acceptedFormats}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    
                    {status.status === 'missing' ? (
                      <div>
                        <input
                          type="file"
                          id={`upload-${docType.key}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(docType.key, file);
                            }
                          }}
                          disabled={isUploading === docType.key}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById(`upload-${docType.key}`) as HTMLInputElement;
                            input?.click();
                          }}
                          disabled={isUploading === docType.key}
                          className="flex items-center gap-2"
                        >
                          {isUploading === docType.key ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Upload...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Uploader
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => status.document && handleViewDocument(status.document.id, status.document.fileName)}
                          disabled={!status.document}
                          title="Voir le document"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => status.document && handleDownloadDocument(status.document.id, status.document.fileName)}
                          disabled={!status.document}
                          title="Télécharger le document"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Section attestations générées (à venir) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Attestations générées automatiquement
          </CardTitle>
          <p className="text-sm text-gray-600">
            Documents générés automatiquement par l'application
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Fonctionnalité à venir</p>
            <p className="text-sm mt-1">
              Attestations de cotisations, certificats de membre, preuves de paiement
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal de visualisation des documents */}
      {documentViewer.isOpen && documentViewer.document && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-gray-500" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {documentViewer.document.fileName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {DOCUMENT_TYPES.find(t => 
                      documentViewer.document?.type.includes(t.key) ||
                      (t.key === 'statuts' && documentViewer.document?.type === 'association_statuts') ||
                      (t.key === 'receipisse' && documentViewer.document?.type === 'association_receipt') ||
                      (t.key === 'rib' && documentViewer.document?.type === 'iban_proof') ||
                      (t.key === 'pv_creation' && documentViewer.document?.type === 'meeting_minutes')
                    )?.label || 'Document'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => documentViewer.document && handleDownloadDocument(documentViewer.document.id, documentViewer.document.fileName)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCloseViewer}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Contenu Modal */}
            <div className="flex-1 p-4">
              {documentViewer.fileUrl ? (
                <div className="w-full h-full">
                  {documentViewer.document.fileName.toLowerCase().endsWith('.pdf') ? (
    <iframe
  src={`${documentViewer.fileUrl}#toolbar=0`}
  className="w-full h-full border-0 rounded"
  title={documentViewer.document.fileName}
/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                      <img
                        src={documentViewer.fileUrl}
                        alt={documentViewer.document.fileName}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          console.error('Erreur chargement image:', e);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="text-center text-gray-500">
                              <File class="h-16 w-16 mx-auto mb-4 opacity-20" />
                              <p>Impossible d'afficher ce fichier</p>
                              <p class="text-sm">Utilisez le bouton télécharger pour l'ouvrir</p>
                            </div>
                          `;
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                  <div className="text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Chargement du document...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}