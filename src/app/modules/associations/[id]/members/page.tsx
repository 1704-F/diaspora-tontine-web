// src/app/modules/associations/[id]/members/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { 
  ArrowLeft, 
  Users, 
  Plus,
  Search,
  Filter,
  UserPlus,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Euro,
  Phone,
  Calendar,
  Download,
  Upload
} from 'lucide-react'

interface Member {
  id: number
  user: {
    id: number
    firstName: string
    lastName: string
    phoneNumber: string
    profilePicture?: string
  }
  memberType: string
  status: 'active' | 'pending' | 'suspended' | 'inactive'
  joinDate: string
  sectionId?: number
  section?: {
    id: number
    name: string
  }
  totalContributed: string
  contributionStatus: 'uptodate' | 'late' | 'very_late'
  lastContributionDate?: string
  roles: string[]
  ancienneteTotal: number
}

interface Association {
  id: number
  name: string
  isMultiSection: boolean
  memberTypes: Array<{
    name: string
    cotisationAmount: number
    description: string
  }>
}

interface MemberFilters {
  search: string
  status: string
  memberType: string
  section: string
  contributionStatus: string
}

export default function MembersPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const [association, setAssociation] = useState<Association | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [filters, setFilters] = useState<MemberFilters>({
    search: '',
    status: 'all',
    memberType: 'all',
    section: 'all',
    contributionStatus: 'all'
  })

  const associationId = params.id as string

  const statusOptions = [
    { key: 'all', label: 'Tous les statuts' },
    { key: 'active', label: 'Actifs' },
    { key: 'pending', label: 'En attente' },
    { key: 'suspended', label: 'Suspendus' },
    { key: 'inactive', label: 'Inactifs' }
  ]

  const contributionStatusOptions = [
    { key: 'all', label: 'Tous les états' },
    { key: 'uptodate', label: 'À jour' },
    { key: 'late', label: 'En retard' },
    { key: 'very_late', label: 'Très en retard' }
  ]

  useEffect(() => {
    const fetchData = async () => {
      if (!associationId || !token) return
      
      try {
        // Charger l'association
        const assocResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        
        if (assocResponse.ok) {
          const assocResult = await assocResponse.json()
          setAssociation(assocResult.data.association)
        }

        // Charger les membres
        const membersResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
        
        if (membersResponse.ok) {
          const membersResult = await membersResponse.json()
          setMembers(membersResult.data.members)
        }
      } catch (error) {
        console.error('Erreur chargement données:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [associationId, token])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Actif' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'En attente' },
      suspended: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Suspendu' },
      inactive: { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: 'Inactif' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null
    
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getContributionStatusBadge = (status: string) => {
    const statusConfig = {
      uptodate: { color: 'bg-green-100 text-green-700', label: 'À jour' },
      late: { color: 'bg-orange-100 text-orange-700', label: 'En retard' },
      very_late: { color: 'bg-red-100 text-red-700', label: 'Très en retard' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null
    
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const filteredMembers = members.filter(member => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const fullName = `${member.user.firstName} ${member.user.lastName}`.toLowerCase()
      if (!fullName.includes(searchLower) && 
          !member.user.phoneNumber.includes(filters.search)) {
        return false
      }
    }
    
    if (filters.status !== 'all' && member.status !== filters.status) return false
    if (filters.memberType !== 'all' && member.memberType !== filters.memberType) return false
    if (filters.contributionStatus !== 'all' && member.contributionStatus !== filters.contributionStatus) return false
    
    return true
  })

  const handleInviteMember = () => {
    setShowInviteModal(true)
  }

  const handleImportMembers = () => {
    setShowImportModal(true)
  }

  const handleViewMember = (memberId: number) => {
    router.push(`/modules/associations/${associationId}/members/${memberId}`)
  }

  const handleEditMember = (memberId: number) => {
    router.push(`/modules/associations/${associationId}/members/${memberId}/edit`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Chargement des membres...</p>
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
      <div className="flex items-center justify-between">
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
              Membres - {association.name}
            </h1>
            <p className="text-gray-600">
              {filteredMembers.length} membre{filteredMembers.length > 1 ? 's' : ''} 
              {filters.search || filters.status !== 'all' || filters.memberType !== 'all' ? 
                ` (${members.length} total)` : ''
              }
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleImportMembers}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importer
          </Button>
          <Button
            onClick={handleInviteMember}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Inviter un membre
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou téléphone..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.memberType}
              onChange={(e) => setFilters(prev => ({ ...prev, memberType: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les types</option>
              {association.memberTypes.map(type => (
                <option key={type.name} value={type.name}>
                  {type.name.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={filters.contributionStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, contributionStatus: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {contributionStatusOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {members.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Membres actifs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {members.filter(m => m.contributionStatus === 'uptodate').length}
            </div>
            <div className="text-sm text-gray-600">À jour cotisations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {members.filter(m => m.contributionStatus === 'late').length}
            </div>
            <div className="text-sm text-gray-600">En retard</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {members.reduce((sum, m) => sum + parseFloat(m.totalContributed), 0).toFixed(0)}€
            </div>
            <div className="text-sm text-gray-600">Total cotisé</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des membres
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Aucun membre trouvé</p>
              {filters.search || filters.status !== 'all' ? (
                <p className="text-sm">Essayez de modifier vos filtres</p>
              ) : (
                <p className="text-sm">Commencez par inviter des membres</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map(member => (
                <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {member.user.firstName} {member.user.lastName}
                          </h4>
                          {member.roles.includes('president') && (
                            <Badge className="bg-amber-100 text-amber-700">Président</Badge>
                          )}
                          {member.roles.includes('tresorier') && (
                            <Badge className="bg-green-100 text-green-700">Trésorier</Badge>
                          )}
                          {member.roles.includes('secretaire') && (
                            <Badge className="bg-blue-100 text-blue-700">Secrétaire</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.user.phoneNumber}
                          </span>
                          <span className="capitalize">
                            {member.memberType.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(member.joinDate).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            {member.totalContributed}€
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusBadge(member.status)}
                      {getContributionStatusBadge(member.contributionStatus)}
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewMember(member.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditMember(member.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      {showInviteModal && (
        <InviteMemberModal
          associationId={associationId}
          memberTypes={association.memberTypes}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false)
            // Recharger les membres
            window.location.reload()
          }}
        />
      )}

      {showImportModal && (
        <ImportMembersModal
          associationId={associationId}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

// Composants modales à implémenter
function InviteMemberModal({ 
  associationId, 
  memberTypes, 
  onClose, 
  onSuccess 
}: {
  associationId: string
  memberTypes: any[]
  onClose: () => void
  onSuccess: () => void
}) {
  // TODO: Implémenter modal d'invitation
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Inviter un membre</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Modal d'invitation à implémenter</p>
          <Button onClick={onClose} className="mt-4">Fermer</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ImportMembersModal({ 
  associationId, 
  onClose, 
  onSuccess 
}: {
  associationId: string
  onClose: () => void
  onSuccess: () => void
}) {
  // TODO: Implémenter modal d'import
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Importer des membres</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Modal d'import CSV à implémenter</p>
          <Button onClick={onClose} className="mt-4">Fermer</Button>
        </CardContent>
      </Card>
    </div>
  )
}