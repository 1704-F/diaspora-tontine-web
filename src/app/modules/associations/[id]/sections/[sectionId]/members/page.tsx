// src/app/modules/associations/[id]/sections/[sectionId]/members/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { 
  ArrowLeft, 
  Users,
  Search,
  Plus,
  Filter,
  Download,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface Member {
  id: number
  userId: number
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  memberType: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  joinDate: string
  lastActiveDate?: string
  totalContributed: string
  contributionStatus: 'uptodate' | 'late' | 'defaulting'
  roles?: string[]
}

interface Section {
  id: number
  name: string
  country: string
  city: string
  currency: string
}

interface Association {
  id: number
  name: string
  memberTypes: Array<{
    name: string
    cotisationAmount: number
    description: string
  }>
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700'
}

const CONTRIBUTION_COLORS = {
  uptodate: 'bg-green-100 text-green-700',
  late: 'bg-yellow-100 text-yellow-700',
  defaulting: 'bg-red-100 text-red-700'
}

export default function SectionMembersPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  
  const [members, setMembers] = useState<Member[]>([])
  const [section, setSection] = useState<Section | null>(null)
  const [association, setAssociation] = useState<Association | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const associationId = params.id as string
  const sectionId = params.sectionId as string

  useEffect(() => {
    fetchData()
  }, [associationId, sectionId, token])

  const fetchData = async () => {
    if (!associationId || !sectionId || !token) return
    
    setIsLoading(true)
    try {
      const [membersResponse, sectionResponse, associationResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${sectionId}/members`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${sectionId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        )
      ])

      if (membersResponse.ok && sectionResponse.ok && associationResponse.ok) {
        const [membersResult, sectionResult, associationResult] = await Promise.all([
          membersResponse.json(),
          sectionResponse.json(),
          associationResponse.json()
        ])
        
        setMembers(membersResult.data.members || [])
        setSection(sectionResult.data.section)
        setAssociation(associationResult.data.association)
      } else {
        setError('Erreur lors du chargement des données')
      }
    } catch (error) {
      console.error('Erreur chargement membres section:', error)
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransferMember = async (memberId: number, targetSectionId: number) => {
    if (!token) return
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members/${memberId}/transfer`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ targetSectionId })
        }
      )
      
      if (response.ok) {
        fetchData() // Recharger les données
      } else {
        console.error('Erreur transfert membre')
      }
    } catch (error) {
      console.error('Erreur transfert membre:', error)
    }
  }

  const handleUpdateMemberStatus = async (memberId: number, newStatus: string) => {
    if (!token) return
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members/${memberId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      )
      
      if (response.ok) {
        fetchData() // Recharger les données
      } else {
        console.error('Erreur mise à jour statut membre')
      }
    } catch (error) {
      console.error('Erreur mise à jour statut membre:', error)
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    const matchesType = memberTypeFilter === 'all' || member.memberType === memberTypeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'suspended':
        return <UserX className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getContributionIcon = (status: string) => {
    switch (status) {
      case 'uptodate':
        return <CheckCircle className="h-4 w-4" />
      case 'late':
        return <Clock className="h-4 w-4" />
      case 'defaulting':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !section || !association) {
    return (
      <ProtectedRoute requiredModule="associations">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-4">{error || 'Données introuvables'}</h1>
            <Button onClick={() => router.back()}>Retour</Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const statsData = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    pending: members.filter(m => m.status === 'pending').length,
    uptodate: members.filter(m => m.contributionStatus === 'uptodate').length,
    late: members.filter(m => m.contributionStatus === 'late').length
  }

  return (
    <ProtectedRoute requiredModule="associations">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
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
                Membres - {section.name}
              </h1>
              <p className="text-gray-600">
                {association.name} • {section.city}, {section.country}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {/* TODO: Export functionality */}}
            >
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={() => router.push(`/modules/associations/${associationId}/members/invite?sectionId=${sectionId}`)}
            >
              <Plus className="h-4 w-4" />
              Inviter membre
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{statsData.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statsData.active}</div>
              <div className="text-sm text-gray-600">Actifs</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{statsData.pending}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statsData.uptodate}</div>
              <div className="text-sm text-gray-600">À jour</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{statsData.late}</div>
              <div className="text-sm text-gray-600">En retard</div>
            </div>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nom, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="pending">En attente</option>
                  <option value="inactive">Inactifs</option>
                  <option value="suspended">Suspendus</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type membre
                </label>
                <select
                  value={memberTypeFilter}
                  onChange={(e) => setMemberTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tous les types</option>
                  {association.memberTypes.map(type => (
                    <option key={type.name} value={type.name}>
                      {type.name} ({type.cotisationAmount}€)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setMemberTypeFilter('all')
                  }}
                >
                  <Filter className="h-4 w-4" />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des membres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membres ({filteredMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun membre trouvé</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || memberTypeFilter !== 'all' 
                    ? 'Aucun membre ne correspond aux critères de recherche.'
                    : 'Cette section ne contient encore aucun membre.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map(member => (
                  <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </h4>
                            {member.roles && member.roles.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {member.roles[0]}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </span>
                            {member.phoneNumber && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.phoneNumber}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Depuis {new Date(member.joinDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {member.totalContributed}€
                          </div>
                          <div className="text-xs text-gray-600">Contribué</div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <Badge className={STATUS_COLORS[member.status]} variant="secondary">
                            <span className="flex items-center gap-1">
                              {getStatusIcon(member.status)}
                              {member.status}
                            </span>
                          </Badge>
                          <Badge className={CONTRIBUTION_COLORS[member.contributionStatus]} variant="secondary">
                            <span className="flex items-center gap-1">
                              {getContributionIcon(member.contributionStatus)}
                              {member.contributionStatus}
                            </span>
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/modules/associations/${associationId}/members/${member.id}`)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`Êtes-vous sûr de vouloir supprimer ${member.firstName} ${member.lastName} de cette section ?`)) {
                                handleUpdateMemberStatus(member.id, 'suspended')
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
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
      </div>
    </ProtectedRoute>
  )
}
                         