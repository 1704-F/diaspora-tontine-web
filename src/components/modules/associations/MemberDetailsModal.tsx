// src/components/modules/associations/MemberDetailsModal.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'
import { 
  X, 
  User, 
  MapPin, 
  Shield, 
  Calendar,
  Phone,
  Mail,
  Crown,
  UserCheck,
  DollarSign,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react'

interface MemberDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: number
  associationId: string
}

interface MemberData {
  id: number
  userId: number
  user: {
    id: number
    firstName: string
    lastName: string
    phoneNumber: string
    email: string
  }
  memberType: string
  status: string
  joinDate: string
  sectionId: number | null
  section: {
    id: number
    name: string
    country: string
    city: string
  } | null
  roles: string[]
  cotisationAmount: string
  totalContributed: string
  contributionStatus: string
  ancienneteTotal: number
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  isOpen,
  onClose,
  memberId,
  associationId
}) => {
  const { token } = useAuthStore()
  const [member, setMember] = useState<MemberData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      fetchMemberData()
    }
  }, [isOpen, memberId])

  const fetchMemberData = async () => {
    if (!token) return

    try {
      setIsLoading(true)
      setError('')

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/members/${memberId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )

      if (response.ok) {
        const result = await response.json()
        setMember(result.data.member)
      } else {
        setError('Impossible de charger les détails du membre')
      }

    } catch (error) {
      console.error('Erreur chargement membre:', error)
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Actif', className: 'bg-green-100 text-green-800' },
      suspended: { label: 'Suspendu', className: 'bg-yellow-100 text-yellow-800' },
      inactive: { label: 'Inactif', className: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getContributionBadge = (status: string) => {
    const statusConfig = {
      uptodate: { label: 'À jour', className: 'bg-green-100 text-green-800' },
      late: { label: 'En retard', className: 'bg-yellow-100 text-yellow-800' },
      very_late: { label: 'Très en retard', className: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.uptodate
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getRoleIcon = (role: string) => {
    const roleIcons = {
      president: Crown,
      secretaire: UserCheck,
      tresorier: DollarSign,
      admin_association: Shield
    }
    
    return roleIcons[role as keyof typeof roleIcons] || User
  }

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      president: 'Président',
      secretaire: 'Secrétaire',
      tresorier: 'Trésorier',
      admin_association: 'Administrateur'
    }
    
    return roleLabels[role as keyof typeof roleLabels] || role
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Détails du membre
              </h2>
              {member && (
                <p className="text-sm text-gray-600">
                  {member.user.firstName} {member.user.lastName}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : member ? (
            <div className="space-y-6">

              {/* Informations personnelles */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nom complet</p>
                      <p className="font-medium">{member.user.firstName} {member.user.lastName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium">{member.user.phoneNumber}</p>
                    </div>
                  </div>

                  {member.user.email && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{member.user.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Membre depuis</p>
                      <p className="font-medium">
                        {new Date(member.joinDate).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut et type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Statut</p>
                    {getStatusBadge(member.status)}
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-2">Type de membre</p>
                  <p className="font-medium">{member.memberType}</p>
                  <p className="text-xs text-gray-400">{member.cotisationAmount}€/mois</p>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Cotisations</p>
                    {getContributionBadge(member.contributionStatus)}
                  </div>
                </div>
              </div>

              {/* Section géographique */}
              {member.section && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Section géographique
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-700 border-blue-300">
                      {member.section.name}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {member.section.city}, {member.section.country}
                    </span>
                  </div>
                </div>
              )}

              {/* Rôles */}
              {member.roles.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Rôles dans l'association
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {member.roles.map((role) => {
                      const Icon = getRoleIcon(role)
                      return (
                        <div key={role} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border">
                          <Icon className="h-3 w-3 text-orange-600" />
                          <span className="text-sm font-medium">{getRoleLabel(role)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Statistiques financières */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total cotisé</p>
                      <p className="text-lg font-semibold text-green-700">{member.totalContributed}€</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ancienneté</p>
                      <p className="text-lg font-semibold text-purple-700">
                        {member.ancienneteTotal} mois
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Actions</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Historique cotisations
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Contacter
                  </Button>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Membre introuvable</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>

      </div>
    </div>
  )
}