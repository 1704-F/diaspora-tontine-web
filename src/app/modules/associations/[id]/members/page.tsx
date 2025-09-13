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
  Search,
  UserPlus,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Euro,
  Phone,
  Calendar,
  MapPin,
  Mail,
  Upload,
  Filter,
  X
} from 'lucide-react'

interface Member {
  id: number
  userId: number
  user: {
    id: number
    firstName: string
    lastName: string
    phoneNumber: string
    email?: string
  }
  memberType: string
  status: 'active' | 'pending' | 'suspended' | 'inactive'
  joinDate: string
  sectionId?: number
  section?: {
    id: number
    name: string
    country: string
    city: string
  }
  roles: string[]
  cotisationAmount: number
  totalContributed: string
  contributionStatus: 'uptodate' | 'late' | 'very_late'
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
  contributionStatus: string
}

export default function MembersPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuthStore()
  const [association, setAssociation] = useState<Association | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MemberFilters>({
    search: '',
    status: 'all',
    memberType: 'all',
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
    fetchData()
  }, [associationId, token])

  const fetchData = async () => {
    if (!associationId || !token) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Charger l'association
      const assocResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      if (assocResponse.ok) {
        const assocResult = await assocResponse.json()
        setAssociation(assocResult.data.association)
      } else {
        throw new Error('Erreur chargement association')
      }

      // Charger les membres
      const membersResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      if (membersResponse.ok) {
        const membersResult = await membersResponse.json()
        console.log('Données membres reçues:', membersResult.data.members)
        setMembers(membersResult.data.members || [])
      } else {
        throw new Error('Erreur chargement membres')
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setIsLoading(false)
    }
  }

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

  const getRoleBadges = (roles: string[]) => {
    const roleConfig = {
      'admin_association': { color: 'bg-purple-100 text-purple-700', label: 'Admin' },
      'president': { color: 'bg-amber-100 text-amber-700', label: 'Président' },
      'tresorier': { color: 'bg-green-100 text-green-700', label: 'Trésorier' },
      'secretaire': { color: 'bg-blue-100 text-blue-700', label: 'Secrétaire' },
      'responsable_section': { color: 'bg-indigo-100 text-indigo-700', label: 'Resp. Section' },
      'secretaire_section': { color: 'bg-cyan-100 text-cyan-700', label: 'Sec. Section' },
      'tresorier_section': { color: 'bg-teal-100 text-teal-700', label: 'Tré. Section' }
    }
    
    return roles.map(role => {
      const config = roleConfig[role as keyof typeof roleConfig]
      if (!config) return null
      
      return (
        <Badge key={role} className={config.color}>
          {config.label}
        </Badge>
      )
    }).filter(Boolean)
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

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      memberType: 'all',
      contributionStatus: 'all'
    })
  }

  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.memberType !== 'all' || filters.contributionStatus !== 'all'

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

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
        <Button onClick={() => fetchData()}>Réessayer</Button>
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
              {hasActiveFilters ? ` (${members.length} total)` : ''}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {/* TODO: Import */}}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importer
          </Button>

          <Button
            onClick={() => router.push(`/modules/associations/${associationId}/members/add`)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Ajouter un membre
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
                  {type.name} ({type.cotisationAmount}€/mois)
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

            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Effacer filtres
              </Button>
            )}
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
              {members.reduce((sum, m) => sum + parseFloat(m.totalContributed || '0'), 0).toFixed(0)}€
            </div>
            <div className="text-sm text-gray-600">Total cotisé</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des membres - Format tableau */}
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
              {members.length === 0 ? (
                <>
                  <p>Aucun membre dans cette association</p>
                  <p className="text-sm">Commencez par ajouter des membres</p>
                </>
              ) : (
                <>
                  <p>Aucun membre trouvé</p>
                  <p className="text-sm">Essayez de modifier vos filtres</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-700">Membre</th>
                    <th className="text-left p-3 font-medium text-gray-700">Contact</th>
                    <th className="text-left p-3 font-medium text-gray-700">Type</th>
                    <th className="text-left p-3 font-medium text-gray-700">Section</th>
                    <th className="text-left p-3 font-medium text-gray-700">Statut</th>
                    <th className="text-left p-3 font-medium text-gray-700">Cotisations</th>
                    <th className="text-left p-3 font-medium text-gray-700">Rôles</th>
                    <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="border-b hover:bg-gray-50 transition-colors">
                      {/* Membre */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {(member.user.firstName || 'U').charAt(0)}{(member.user.lastName || 'U').charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {member.user.firstName} {member.user.lastName}
                            </div>
                            <div className="text-sm text-gray-600">
                              Membre depuis {new Date(member.joinDate).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {member.user.phoneNumber}
                          </div>
                          {member.user.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {member.user.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-gray-900">{member.memberType}</div>
                          <div className="text-sm text-gray-600">{member.cotisationAmount}€/mois</div>
                        </div>
                      </td>

                      {/* Section */}
                      <td className="p-3">
                        {member.section ? (
                          <div>
                            <div className="font-medium text-gray-900">{member.section.name}</div>
                            <div className="text-sm text-gray-600">{member.section.city}, {member.section.country}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="p-3">
                        <div className="space-y-1">
                          {getStatusBadge(member.status)}
                          {getContributionStatusBadge(member.contributionStatus)}
                        </div>
                      </td>

                      {/* Cotisations */}
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-gray-900">{member.totalContributed}€</div>
                          <div className="text-sm text-gray-600">Total cotisé</div>
                        </div>
                      </td>

                      {/* Rôles */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {member.roles.length > 0 ? (
                            getRoleBadges(member.roles)
                          ) : (
                            <span className="text-gray-400 text-sm">Aucun</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/modules/associations/${associationId}/members/${member.id}`)}
                            title="Voir le profil"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/modules/associations/${associationId}/members/${member.id}/edit`)}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}