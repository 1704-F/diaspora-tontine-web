// src/app/modules/associations/[id]/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { 
  ArrowLeft, 
  Settings,
  Users, 
  Euro,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Shield,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react'

interface Association {
  id: number
  name: string
  memberTypes: Array<{
    name: string
    cotisationAmount: number
    permissions: string[]
    description: string
  }>
  accessRights: {
    finances: string
    membersList: string
    statistics: string
    calendar: string
    expenses: string
  }
  cotisationSettings: {
    dueDay: number
    gracePeriodDays: number
    lateFeesEnabled: boolean
    lateFeesAmount: number
    inactivityThresholdMonths: number
  }
  centralBoard?: {
    [key: string]: {
      userId: number
      name: string
      role: string
      phoneNumber?: string
    }
  }
  isMultiSection?: boolean
}

interface MemberType {
  name: string
  cotisationAmount: number
  permissions: string[]
  description: string
}

export default function AssociationSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const [association, setAssociation] = useState<Association | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingMemberType, setEditingMemberType] = useState<number | null>(null)
  const [newMemberType, setNewMemberType] = useState<MemberType>({
    name: '',
    cotisationAmount: 0,
    description: '',
    permissions: ['view_profile']
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'access' | 'cotisations' | 'bureau'>('members')
  const [showAddCustomRole, setShowAddCustomRole] = useState(false)
  const [customRoles, setCustomRoles] = useState<Array<{
    name: string
    description: string
    permissions: string[]
  }>>([])

  const associationId = params.id as string

  const permissionOptions = [
    { key: 'view_profile', label: 'Voir les profils' },
    { key: 'participate_events', label: 'Participer aux événements' },
    { key: 'vote', label: 'Droit de vote' },
    { key: 'create_events', label: 'Créer des événements' },
    { key: 'invite_members', label: 'Inviter des membres' }
  ]

  const accessOptions = [
    { key: 'all_members', label: 'Tous les membres' },
    { key: 'central_board_only', label: 'Bureau central uniquement' },
    { key: 'bureau_and_sections', label: 'Bureau central + sections' },
    { key: 'disabled', label: 'Aucun accès' }
  ]

  useEffect(() => {
    const fetchAssociation = async () => {
      if (!associationId || !token) return
      
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )
        
        if (response.ok) {
          const result = await response.json()
          setAssociation(result.data.association)
        }
      } catch (error) {
        console.error('Erreur chargement association:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAssociation()
  }, [associationId, token])

  const handleAddMemberType = async () => {
    if (!newMemberType.name || !newMemberType.description) return

    try {
      const updatedMemberTypes = [...(association?.memberTypes || []), newMemberType]
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ memberTypes: updatedMemberTypes })
        }
      )

      if (response.ok) {
        setAssociation(prev => prev ? {
          ...prev,
          memberTypes: updatedMemberTypes
        } : null)
        setNewMemberType({
          name: '',
          cotisationAmount: 0,
          description: '',
          permissions: ['view_profile']
        })
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Erreur ajout type membre:', error)
    }
  }

  const handleUpdateMemberType = async (index: number, updatedType: MemberType) => {
    try {
      const updatedMemberTypes = association?.memberTypes?.map((type, i) => 
        i === index ? updatedType : type
      ) || []
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ memberTypes: updatedMemberTypes })
        }
      )

      if (response.ok) {
        setAssociation(prev => prev ? {
          ...prev,
          memberTypes: updatedMemberTypes
        } : null)
        setEditingMemberType(null)
      }
    } catch (error) {
      console.error('Erreur modification type membre:', error)
    }
  }

  const handleDeleteMemberType = async (index: number) => {
    try {
      const updatedMemberTypes = association?.memberTypes?.filter((_, i) => i !== index) || []
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ memberTypes: updatedMemberTypes })
        }
      )

      if (response.ok) {
        setAssociation(prev => prev ? {
          ...prev,
          memberTypes: updatedMemberTypes
        } : null)
      }
    } catch (error) {
      console.error('Erreur suppression type membre:', error)
    }
  }

  const handleUpdateAccessRights = async (field: string, value: string) => {
    try {
      const updatedAccessRights = {
        ...association?.accessRights,
        [field]: value
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ accessRights: updatedAccessRights })
        }
      )

      if (response.ok) {
        setAssociation(prev => prev ? {
          ...prev,
          accessRights: updatedAccessRights
        } : null)
      }
    } catch (error) {
      console.error('Erreur modification droits accès:', error)
    }
  }

  const handleUpdateCotisationSettings = async (field: string, value: any) => {
    try {
      const updatedCotisationSettings = {
        ...association?.cotisationSettings,
        [field]: value
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/configuration`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ cotisationSettings: updatedCotisationSettings })
        }
      )

      if (response.ok) {
        setAssociation(prev => prev ? {
          ...prev,
          cotisationSettings: updatedCotisationSettings
        } : null)
      }
    } catch (error) {
      console.error('Erreur modification paramètres cotisations:', error)
    }
  }

  const handleEditBureauMember = (role: string, member: any) => {
    // TODO: Implémenter la modification des membres du bureau
    console.log('Modifier membre bureau:', role, member)
  }

  const handleDeleteCustomRole = (index: number) => {
    setCustomRoles(prev => prev.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement des paramètres...</p>
        </div>
      </div>
    )
  }

  if (!association) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Association introuvable</h2>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    )
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
            Paramètres - {association.name}
          </h1>
          <p className="text-gray-600">
            Configuration avancée de votre association
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'members', label: 'Types de membres', icon: Users },
            { key: 'access', label: 'Droits d\'accès', icon: Shield },
            { key: 'cotisations', label: 'Cotisations', icon: Euro },
            { key: 'bureau', label: 'Bureau', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'members' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Types de membres
              </CardTitle>
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un type
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formulaire d'ajout */}
            {showAddForm && (
              <Card className="p-4 border-dashed border-2 border-gray-300">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Nom du type"
                      value={newMemberType.name}
                      onChange={(e) => setNewMemberType(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder="Cotisation (€)"
                      value={newMemberType.cotisationAmount}
                      onChange={(e) => setNewMemberType(prev => ({
                        ...prev,
                        cotisationAmount: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <Textarea
                    placeholder="Description du type de membre"
                    value={newMemberType.description}
                    onChange={(e) => setNewMemberType(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {permissionOptions.map(option => (
                        <label key={option.key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newMemberType.permissions.includes(option.key)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewMemberType(prev => ({
                                  ...prev,
                                  permissions: [...prev.permissions, option.key]
                                }))
                              } else {
                                setNewMemberType(prev => ({
                                  ...prev,
                                  permissions: prev.permissions.filter(p => p !== option.key)
                                }))
                              }
                            }}
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddMemberType}>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Liste des types existants */}
            <div className="space-y-3">
              {association.memberTypes.map((type, index) => (
                <Card key={index} className="p-4">
                  {editingMemberType === index ? (
                    <EditMemberTypeForm
                      memberType={type}
                      onSave={(updatedType) => handleUpdateMemberType(index, updatedType)}
                      onCancel={() => setEditingMemberType(null)}
                      permissionOptions={permissionOptions}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <h4 className="font-medium capitalize">
                            {type.name.replace('_', ' ')}
                          </h4>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {type.cotisationAmount}€/mois
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {type.permissions.map(perm => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {permissionOptions.find(p => p.key === perm)?.label || perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMemberType(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteMemberType(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'access' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Droits d'accès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { key: 'finances', label: 'Finances de l\'association', icon: Euro },
              { key: 'membersList', label: 'Liste des membres', icon: Users },
              { key: 'statistics', label: 'Statistiques', icon: Eye },
              { key: 'calendar', label: 'Calendrier des événements', icon: Calendar },
              { key: 'expenses', label: 'Dépenses détaillées', icon: EyeOff }
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <select
                    value={association.accessRights[item.key as keyof typeof association.accessRights]}
                    onChange={(e) => handleUpdateAccessRights(item.key, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {accessOptions.map(option => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {activeTab === 'cotisations' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Paramètres des cotisations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jour d'échéance mensuelle
                  </label>
                  <select
                    value={association.cotisationSettings.dueDay}
                    onChange={(e) => handleUpdateCotisationSettings('dueDay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>
                        {day} de chaque mois
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Délai de grâce (jours)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="30"
                    value={association.cotisationSettings.gracePeriodDays}
                    onChange={(e) => handleUpdateCotisationSettings('gracePeriodDays', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nombre de jours après l'échéance avant considération en retard
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seuil d'inactivité (mois)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={association.cotisationSettings.inactivityThresholdMonths}
                    onChange={(e) => handleUpdateCotisationSettings('inactivityThresholdMonths', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nombre de mois sans cotiser avant passage en statut inactif
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={association.cotisationSettings.lateFeesEnabled}
                      onChange={(e) => handleUpdateCotisationSettings('lateFeesEnabled', e.target.checked)}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Activer les frais de retard
                    </span>
                  </label>
                </div>

                {association.cotisationSettings.lateFeesEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant des frais de retard (€)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={association.cotisationSettings.lateFeesAmount}
                      onChange={(e) => handleUpdateCotisationSettings('lateFeesAmount', parseFloat(e.target.value))}
                    />
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Mode de paiement</h4>
                  <p className="text-sm text-blue-700">
                    Carte bancaire prioritaire pour des paiements instantanés. 
                    Les virements bancaires restent possibles mais avec délais de traitement.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Aperçu des règles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {association.cotisationSettings.dueDay}
                  </div>
                  <div className="text-sm text-gray-600">Jour d'échéance</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {association.cotisationSettings.gracePeriodDays}
                  </div>
                  <div className="text-sm text-gray-600">Jours de grâce</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {association.cotisationSettings.inactivityThresholdMonths}
                  </div>
                  <div className="text-sm text-gray-600">Mois avant inactivité</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'bureau' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Gestion du bureau
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bureau Central Actuel */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bureau central actuel</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {association.centralBoard && Object.entries(association.centralBoard).map(([role, member]) => (
                  <Card key={role} className="p-4">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {member.role}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{member.name}</p>
                      {member.phoneNumber && (
                        <p className="text-xs text-gray-500">{member.phoneNumber}</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3"
                        onClick={() => handleEditBureauMember(role, member)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Rôles Personnalisés */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Rôles personnalisés</h3>
                <Button
                  onClick={() => setShowAddCustomRole(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un rôle
                </Button>
              </div>
              
              <div className="space-y-3">
                {customRoles.map((role, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{role.name}</h4>
                        <p className="text-sm text-gray-600">{role.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {role.permissions.map(perm => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDeleteCustomRole(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {customRoles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Aucun rôle personnalisé configuré</p>
                    <p className="text-sm">Ajoutez des rôles comme "Commissaire aux comptes" ou "Chargé communication"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow de succession */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mandats et transitions</h3>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Gestion des mandats</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Fonctionnalité à venir : Configuration des durées de mandat, 
                      élections automatiques, et workflow de passation de pouvoirs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Composant pour éditer un type de membre
function EditMemberTypeForm({ 
  memberType, 
  onSave, 
  onCancel, 
  permissionOptions 
}: {
  memberType: MemberType
  onSave: (type: MemberType) => void
  onCancel: () => void
  permissionOptions: Array<{ key: string; label: string }>
}) {
  const [editedType, setEditedType] = useState(memberType)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Nom du type"
          value={editedType.name}
          onChange={(e) => setEditedType(prev => ({
            ...prev,
            name: e.target.value
          }))}
        />
        <Input
          type="number"
          placeholder="Cotisation (€)"
          value={editedType.cotisationAmount}
          onChange={(e) => setEditedType(prev => ({
            ...prev,
            cotisationAmount: parseFloat(e.target.value) || 0
          }))}
        />
      </div>
      <Textarea
        placeholder="Description"
        value={editedType.description}
        onChange={(e) => setEditedType(prev => ({
          ...prev,
          description: e.target.value
        }))}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Permissions
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {permissionOptions.map(option => (
            <label key={option.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editedType.permissions.includes(option.key)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setEditedType(prev => ({
                      ...prev,
                      permissions: [...prev.permissions, option.key]
                    }))
                  } else {
                    setEditedType(prev => ({
                      ...prev,
                      permissions: prev.permissions.filter(p => p !== option.key)
                    }))
                  }
                }}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(editedType)}>
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
      </div>
    </div>
  )
}