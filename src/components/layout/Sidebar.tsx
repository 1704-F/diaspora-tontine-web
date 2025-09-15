'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useRouter, usePathname, useParams } from 'next/navigation'
import { 
  Home, 
  Users, 
  CreditCard, 
  PieChart, 
  Settings,
  Building2,
  Wallet,
  UserPlus,
  Plus,
  MapPin,
  FileText,
  Calendar
} from 'lucide-react'

interface SidebarProps {
  currentModule: 'associations' | 'tontines' | 'family' | 'commerce'
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ currentModule, isOpen = true, onClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  
  // Récupérer l'ID de l'association courante depuis l'URL
  const currentAssociationId = params?.id as string

  // Navigation items selon le module actif
  const getNavigationItems = () => {
    switch(currentModule) {
      case 'associations':
        // Si on est dans une association spécifique, afficher le menu détaillé
        if (currentAssociationId && pathname.includes(`/modules/associations/${currentAssociationId}`)) {
          return [
            { 
              label: 'Vue d\'ensemble', 
              href: `/modules/associations/${currentAssociationId}`, 
              icon: Home,
              active: pathname === `/modules/associations/${currentAssociationId}`
            },
            { 
              label: 'Membres', 
              href: `/modules/associations/${currentAssociationId}/members`, 
              icon: Users,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/members`),
              description: 'Gestion des membres'
            },
            { 
              label: 'Cotisations', 
              href: `/modules/associations/${currentAssociationId}/cotisations`, 
              icon: CreditCard,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/cotisations`),
              description: 'Dashboard et paiements'
            },
            { 
              label: 'Sections', 
              href: `/modules/associations/${currentAssociationId}/sections`, 
              icon: MapPin,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/sections`),
              description: 'Sections géographiques'
            },
            { 
              label: 'Événements', 
              href: `/modules/associations/${currentAssociationId}/events`, 
              icon: Calendar,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/events`),
              disabled: true,
              description: 'Calendrier et événements'
            },
            { 
              label: 'Documents', 
              href: `/modules/associations/${currentAssociationId}/documents`, 
              icon: FileText,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/documents`),
              disabled: true,
              description: 'Attestations et rapports'
            },
            { 
              label: 'Finances', 
              href: `/modules/associations/${currentAssociationId}/finances`, 
              icon: PieChart,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/finances`),
              disabled: true,
              description: 'Vue globale financière'
            },
            { 
              label: 'Paramètres', 
              href: `/modules/associations/${currentAssociationId}/settings`, 
              icon: Settings,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/settings`),
              description: 'Configuration association'
            }
          ]
        }
        
        // Menu général des associations (liste)
        return [
          { 
            label: 'Mes Associations', 
            href: '/modules/associations', 
            icon: Building2,
            active: pathname === '/modules/associations',
            description: 'Toutes mes associations'
          },
          { 
            label: 'Créer Association', 
            href: '/modules/associations/create', 
            icon: Plus,
            active: pathname === '/modules/associations/create',
            description: 'Nouvelle association'
          },
          { 
            label: 'Invitations', 
            href: '/modules/associations/invitations', 
            icon: UserPlus,
            active: pathname === '/modules/associations/invitations',
            disabled: true,
            description: 'Invitations reçues'
          }
        ]

      case 'tontines':
        return [
          { 
            label: 'Tableau de bord', 
            href: '/modules/tontines', 
            icon: Home,
            active: pathname === '/modules/tontines'
          },
          { 
            label: 'Mes Tontines', 
            href: '/modules/tontines', 
            icon: Wallet,
            active: pathname === '/modules/tontines'
          },
          { 
            label: 'Créer Tontine', 
            href: '#', 
            icon: Plus,
            active: false,
            disabled: true
          }
        ]

      default:
        return []
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        id="mobile-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full pt-16 lg:pt-0">
          {/* Module switcher */}
          <div className="p-4 border-b border-gray-200">
            <Button
              variant="outline"
              className="w-full justify-start text-sm"
              onClick={() => {
                router.push('/dashboard')
                onClose?.()
              }}
            >
              <span className="mr-2">🔄</span>
              Changer de module
            </Button>
          </div>

          {/* Association context - Si on est dans une association spécifique */}
          {currentAssociationId && pathname.includes(`/modules/associations/${currentAssociationId}`) && (
            <div className="p-4 border-b border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
                Association actuelle
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm p-2 h-auto"
                onClick={() => {
                  router.push('/modules/associations')
                  onClose?.()
                }}
              >
                <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-medium truncate">Association #{currentAssociationId}</div>
                  <div className="text-xs text-gray-500">Cliquer pour changer</div>
                </div>
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isDisabled = item.disabled || item.href === '#'
              
              return (
                <Button
                  key={item.label}
                  variant={item.active ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto p-3 text-sm",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled && item.href !== '#') {
                      router.push(item.href)
                      onClose?.()
                    }
                  }}
                >
                  <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {isDisabled && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-gray-200 text-gray-500">
                      Bientôt
                    </Badge>
                  )}
                </Button>
              )
            })}
          </nav>

          {/* Quick actions - Si on est dans une association */}
          {currentAssociationId && pathname.includes(`/modules/associations/${currentAssociationId}`) && (
            <div className="p-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
                Actions rapides
              </div>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    router.push(`/modules/associations/${currentAssociationId}/members/add`)
                    onClose?.()
                  }}
                >
                  <UserPlus className="h-3 w-3 mr-2" />
                  Ajouter membre
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    router.push(`/modules/associations/${currentAssociationId}/cotisations`)
                    onClose?.()
                  }}
                >
                  <CreditCard className="h-3 w-3 mr-2" />
                  Voir cotisations
                </Button>
              </div>
            </div>
          )}

          {/* Footer info */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div className="font-medium">DiasporaTontine v1.0</div>
              <div className="capitalize">Module: {currentModule}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}