// src/components/modules/associations/SectionCard.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Building2,
  Edit,
  X,
  Save,
  Users,
  MapPin,
  Trash2,
  Phone,
  Globe,
  DollarSign
} from 'lucide-react'
import BureauSectionForm from './BureauSectionForm'

interface Section {
  id: number
  name: string
  country: string
  city: string
  currency: string
  language: string
  membersCount: number
  bureauSection?: {
    responsable?: { userId?: number; name?: string; phoneNumber?: string }
    secretaire?: { userId?: number; name?: string; phoneNumber?: string }
    tresorier?: { userId?: number; name?: string; phoneNumber?: string }
  }
  stats?: {
    monthlyRevenue?: number
    bureauComplete?: boolean
  }
}

interface SectionCardProps {
  section: Section
  associationId: number
  token: string | null
  onUpdate: () => void
  showActions?: boolean
}

export default function SectionCard({ 
  section, 
  associationId, 
  token, 
  onUpdate, 
  showActions = true 
}: SectionCardProps) {
  const router = useRouter()
  const [isEditingBureau, setIsEditingBureau] = useState(false)
  const [bureauForm, setBureauForm] = useState(section.bureauSection || {})
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleUpdateBureau = async () => {
    if (!token) return
    
    setIsSaving(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${section.id}/bureau`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ bureauSection: bureauForm })
        }
      )
      
      if (response.ok) {
        setIsEditingBureau(false)
        onUpdate()
      } else {
        const error = await response.json()
        console.error('Erreur mise à jour bureau section:', error)
      }
    } catch (error) {
      console.error('Erreur mise à jour bureau section:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSection = async () => {
    if (!token) return
    
    const confirmMessage = section.membersCount > 0 
      ? `Attention : Cette section contient ${section.membersCount} membre(s). La suppression déplacera ces membres vers la section principale. Continuer ?`
      : `Êtes-vous sûr de vouloir supprimer la section "${section.name}" ?`
    
    if (!confirm(confirmMessage)) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/associations/${associationId}/sections/${section.id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      
      if (response.ok) {
        onUpdate()
      } else {
        const error = await response.json()
        console.error('Erreur suppression section:', error.message)
        alert(`Erreur : ${error.message || 'Impossible de supprimer cette section'}`)
      }
    } catch (error) {
      console.error('Erreur suppression section:', error)
      alert('Erreur de connexion lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const bureauCompleteness = () => {
    const bureau = section.bureauSection
    const roles = ['responsable', 'secretaire', 'tresorier']
    const filledRoles = roles.filter(role => bureau?.[role as keyof typeof bureau]?.name)
    return { filled: filledRoles.length, total: roles.length }
  }

  const completeness = bureauCompleteness()
  const isComplete = completeness.filled === completeness.total

  return (
    <Card className="p-4 hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      {/* Header section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">{section.name}</h3>
            {isComplete ? (
              <Badge className="bg-green-100 text-green-700 text-xs">
                Bureau complet
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                Bureau {completeness.filled}/{completeness.total}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <span>{section.city}, {section.country}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {section.currency}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {section.language.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        
        {showActions && (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleDeleteSection}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">{section.membersCount}</div>
          <div className="text-xs text-gray-600">Membres</div>
        </div>
        {section.stats?.monthlyRevenue && (
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {section.stats.monthlyRevenue}€
            </div>
            <div className="text-xs text-gray-600">Revenus/mois</div>
          </div>
        )}
      </div>

      {/* Bureau section */}
      <div className="border-t pt-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm text-gray-900">Bureau section</h4>
          {showActions && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditingBureau(!isEditingBureau)}
              disabled={isSaving}
            >
              {isEditingBureau ? (
                <X className="h-3 w-3" />
              ) : (
                <Edit className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>

        {isEditingBureau ? (
          <BureauSectionForm 
            bureau={bureauForm}
            setBureau={setBureauForm}
            onSave={handleUpdateBureau}
            onCancel={() => setIsEditingBureau(false)}
            isSaving={isSaving}
          />
        ) : (
          <div className="space-y-3">
            {(['responsable', 'secretaire', 'tresorier'] as const).map(role => {
              const member = section.bureauSection?.[role]
              return (
                <div key={role} className="flex items-start justify-between text-sm">
                  <span className="text-gray-600 capitalize font-medium w-20">
                    {role}:
                  </span>
                  <div className="text-gray-900 text-right flex-1">
                    {member?.name ? (
                      <div>
                        <div className="font-medium">{member.name}</div>
                        {member.phoneNumber && (
                          <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phoneNumber}
                          </div>
                        )}
                      </div>
                    ) : (
                      <em className="text-gray-400">Non assigné</em>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => router.push(`/modules/associations/${associationId}/sections/${section.id}`)}
              className="flex items-center gap-1"
            >
              <Building2 className="h-3 w-3" />
              Gérer
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => router.push(`/modules/associations/${associationId}/sections/${section.id}/members`)}
              className="flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              Membres ({section.membersCount})
            </Button>
          </div>
          
          {/* Action secondaire */}
          <div className="mt-2">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => router.push(`/modules/associations/${associationId}/sections/${section.id}/settings`)}
              className="w-full text-xs text-gray-600 hover:text-gray-800"
            >
              Paramètres section
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}