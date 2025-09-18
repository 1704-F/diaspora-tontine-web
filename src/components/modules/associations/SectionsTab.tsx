// src/components/modules/associations/SectionsTab.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Building2,
  Plus,
  Edit,
  X,
  Save,
  Users,
  MapPin,
  Globe,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface Section {
  id: number;
  name: string;
  country: string;
  city: string;
  currency: string;
  language: string;
  membersCount: number;
  bureauSection?: {
    responsable?: { userId?: number; name?: string; phoneNumber?: string };
    secretaire?: { userId?: number; name?: string; phoneNumber?: string };
    tresorier?: { userId?: number; name?: string; phoneNumber?: string };
  };
}

interface Association {
  id: number;
  name: string;
  isMultiSection: boolean;
  features: {
    maxSections: number;
  };
}

interface SectionsTabProps {
  association: Association;
  token: string | null;
}

export default function SectionsTab({ association, token }: SectionsTabProps) {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (association.isMultiSection) {
      fetchSections();
    } else {
      setIsLoading(false);
    }
  }, [association.id]);

  const fetchSections = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${association.id}/sections`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const result = await response.json();
        // ✅ TRANSFORMATION DES DONNÉES
        const transformedSections = result.data.sections.map(
          (section: any) => ({
            ...section,
            bureauSection: {
              responsable: section.bureauSection?.responsable
                ? {
                    userId: section.bureauSection.responsable.userId,
                    name: `${section.bureauSection.responsable.firstName} ${section.bureauSection.responsable.lastName}`,
                    phoneNumber: section.bureauSection.responsable.phoneNumber,
                  }
                : undefined,
              secretaire: section.bureauSection?.secretaire
                ? {
                    userId: section.bureauSection.secretaire.userId,
                    name: `${section.bureauSection.secretaire.firstName} ${section.bureauSection.secretaire.lastName}`,
                    phoneNumber: section.bureauSection.secretaire.phoneNumber,
                  }
                : undefined,
              tresorier: section.bureauSection?.tresorier
                ? {
                    userId: section.bureauSection.tresorier.userId,
                    name: `${section.bureauSection.tresorier.firstName} ${section.bureauSection.tresorier.lastName}`,
                    phoneNumber: section.bureauSection.tresorier.phoneNumber,
                  }
                : undefined,
            },
          })
        );
        setSections(transformedSections);
      } else {
        setError("Erreur lors du chargement des sections");
      }
    } catch (error) {
      console.error("Erreur chargement sections:", error);
      setError("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateToMultiSection = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${association.id}/migrate-to-multi-section`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Recharger la page pour rafraîchir les données
        window.location.reload();
      } else {
        setError("Erreur lors de la migration");
      }
    } catch (error) {
      console.error("Erreur migration:", error);
      setError("Erreur de connexion");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!association.isMultiSection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Structure association
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 bg-blue-50 rounded-lg">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Association simple
            </h3>
            <p className="text-blue-700 text-sm mb-4">
              Cette association n'utilise pas de sections géographiques. Vous
              pouvez évoluer vers une structure multi-sections à tout moment.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm text-yellow-800 font-medium">
                    Migration vers multi-sections
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Cette action créera automatiquement une première section
                    avec vos membres actuels. L'opération est irréversible.
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={handleMigrateToMultiSection}
            >
              <Globe className="h-4 w-4 mr-2" />
              Migrer vers multi-sections
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestion des sections ({sections.length}/
                {association.features.maxSections})
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Organisez vos membres par zones géographiques
              </p>
            </div>
            {sections.length < association.features.maxSections && (
              <Button
                onClick={() =>
                  router.push(
                    `/modules/associations/${association.id}/sections/create`
                  )
                }
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Créer une section
              </Button>
            )}
          </div>
        </CardHeader>

        {error && (
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Liste des sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            associationId={association.id}
            token={token}
            onUpdate={fetchSections}
          />
        ))}

        {sections.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <Building2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">Aucune section créée</h3>
            <p className="text-sm mb-4">
              Créez votre première section géographique pour organiser vos
              membres
            </p>
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  `/modules/associations/${association.id}/sections/create`
                )
              }
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Créer la première section
            </Button>
          </div>
        )}
      </div>

      {/* Limitations et informations */}
      {sections.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {sections.length}
                </div>
                <div className="text-sm text-gray-600">Sections actives</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {sections.reduce(
                    (total, section) => total + section.membersCount,
                    0
                  )}
                </div>
                <div className="text-sm text-gray-600">Total membres</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {sections.filter((s) => s.bureauSection?.responsable).length}
                </div>
                <div className="text-sm text-gray-600">Bureaux configurés</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Composant SectionCard séparé
interface SectionCardProps {
  section: Section;
  associationId: number;
  token: string | null;
  onUpdate: () => void;
}

function SectionCard({
  section,
  associationId,
  token,
  onUpdate,
}: SectionCardProps) {
  const router = useRouter();
  const [isEditingBureau, setIsEditingBureau] = useState(false);
  const [bureauForm, setBureauForm] = useState(section.bureauSection || {});
  const [isDeleting, setIsDeleting] = useState(false);

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
      } else {
        console.error("Erreur mise à jour bureau section");
      }
    } catch (error) {
      console.error("Erreur mise à jour bureau section:", error);
    }
  };

  const handleDeleteSection = async () => {
    if (
      !token ||
      !confirm(
        `Êtes-vous sûr de vouloir supprimer la section "${section.name}" ?`
      )
    )
      return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${section.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        onUpdate();
      } else {
        console.error("Erreur suppression section");
      }
    } catch (error) {
      console.error("Erreur suppression section:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const bureauCompleteness = () => {
    const bureau = section.bureauSection;
    const roles = ["responsable", "secretaire", "tresorier"];
    const filledRoles = roles.filter(
      (role) => bureau?.[role as keyof typeof bureau]?.name
    );
    return { filled: filledRoles.length, total: roles.length };
  };

  const completeness = bureauCompleteness();

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {/* Header section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900">{section.name}</h3>
            {completeness.filled === completeness.total ? (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 text-xs"
              >
                Complet
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-700 text-xs"
              >
                {completeness.filled}/{completeness.total}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {section.city}, {section.country}
            </span>
            <span>{section.currency}</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {section.membersCount} membres
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleDeleteSection}
          disabled={isDeleting}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Bureau section */}
      <div className="border-t pt-4 mb-4">
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
            associationId={associationId}
            sectionId={section.id} // ✅ Passer l'ID de section
            token={token}
          />
        ) : (
          <div className="space-y-2">
            {(["responsable", "secretaire", "tresorier"] as const).map(
              (role) => {
                const member = section.bureauSection?.[role];
                return (
                  <div
                    key={role}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 capitalize">{role}:</span>
                    <span className="text-gray-900 text-right">
                      {member?.name ? (
                        <div>
                          <div>{member.name}</div>
                          {member.phoneNumber && (
                            <div className="text-xs text-gray-500">
                              {member.phoneNumber}
                            </div>
                          )}
                        </div>
                      ) : (
                        <em className="text-gray-400">Non assigné</em>
                      )}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              router.push(
                `/modules/associations/${associationId}/sections/${section.id}`
              )
            }
          >
            <Building2 className="h-3 w-3 mr-1" />
            Gérer
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              router.push(
                `/modules/associations/${associationId}/sections/${section.id}/members`
              )
            }
          >
            <Users className="h-3 w-3 mr-1" />
            Membres
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Composant formulaire bureau section
interface BureauSectionFormProps {
  bureau: {
    responsable?: { userId?: number; name?: string; phoneNumber?: string };
    secretaire?: { userId?: number; name?: string; phoneNumber?: string };
    tresorier?: { userId?: number; name?: string; phoneNumber?: string };
  };
  setBureau: (updater: (prev: any) => any) => void;
  onSave: () => void;
  onCancel: () => void;
  associationId: number;
  sectionId: number; // ✅ Ajouter sectionId
  token: string | null;
}

function BureauSectionForm({ bureau, setBureau, onSave, onCancel, associationId, sectionId, token }: BureauSectionFormProps) {
  const [members, setMembers] = useState<Array<{id: number, name: string, phoneNumber: string}>>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    if (!token) return
    
    try {
      // ✅ Utiliser sectionId du paramètre
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${sectionId}/members`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      if (response.ok) {
        const result = await response.json()
        const membersList = result.data.members.map((member: any) => ({
          id: member.id,
          name: `${member.user.firstName} ${member.user.lastName}`,
          phoneNumber: member.user.phoneNumber
        }))
        setMembers(membersList)
      }
    } catch (error) {
      console.error('Erreur chargement membres section:', error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleMemberSelect = (role: string, memberId: string) => {
    const selectedMember = members.find((m) => m.id.toString() === memberId);
    setBureau((prev: any) => ({
      ...prev,
      [role]: selectedMember
        ? {
            userId: selectedMember.id,
            name: selectedMember.name,
            phoneNumber: selectedMember.phoneNumber,
          }
        : undefined,
    }));
  };

  if (isLoadingMembers) {
    return (
      <div className="text-sm text-gray-500">Chargement des membres...</div>
    );
  }

  return (
    <div className="space-y-3">
      {(["responsable", "secretaire", "tresorier"] as const).map((role) => (
        <div key={role}>
          <label className="block text-xs font-medium text-gray-700 mb-1 capitalize">
            {role} section
          </label>
          <select
            value={bureau[role]?.userId || ""}
            onChange={(e) => handleMemberSelect(role, e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner un membre</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.phoneNumber})
              </option>
            ))}
          </select>
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
