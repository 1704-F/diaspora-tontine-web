'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useRouter, usePathname, useParams } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useState, useEffect } from 'react'
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
  Calendar,
  TrendingUp,
  CheckCircle,
  Banknote,
  BarChart3,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Clock
} from 'lucide-react'

interface SidebarProps {
  currentModule: 'associations' | 'tontines' | 'family' | 'commerce'
  isOpen?: boolean
  onClose?: () => void
}

interface NavigationItem {
  label: string
  href: string
  icon: any
  active: boolean
  description?: string
  badge?: number | string
  disabled?: boolean
  roles?: string[]
  submenu?: NavigationItem[]
}

export function Sidebar({ currentModule, isOpen = true, onClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const { user } = useAuthStore()
  
  // État pour gérer l'ouverture des sous-menus
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['finances'])
  
  // Récupérer l'ID de l'association courante depuis l'URL
  const currentAssociationId = params?.id as string

  // État pour les notifications (à remplacer par de vraies données API)
  const [notifications, setNotifications] = useState({
    pendingValidations: 0,
    pendingPayments: 0,
    newMembers: 0
  })

  // Simuler le chargement des notifications
  useEffect(() => {
    if (currentAssociationId) {
      // TODO: Remplacer par de vrais appels API
      setNotifications({
        pendingValidations: 3, // Exemple
        pendingPayments: 2,    // Exemple
        newMembers: 1          // Exemple
      })
    }
  }, [currentAssociationId])

  // Vérifier si l'utilisateur a certains rôles
  const hasRole = (roles: string[]) => {
    if (!user?.roles || !roles) return true
    return roles.some(role => user.roles.includes(role))
  }

  // Gérer l'expansion des sous-menus
  const toggleSubmenu = (menuKey: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuKey) 
        ? prev.filter(key => key !== menuKey)
        : [...prev, menuKey]
    )
  }

  // Navigation items selon le module actif
  const getNavigationItems = (): NavigationItem[] => {
    switch(currentModule) {
      case 'associations':
        // Si on est dans une association spécifique, afficher le menu détaillé
        if (currentAssociationId && pathname.includes(`/modules/associations/${currentAssociationId}`)) {
          return [
            { 
              label: 'Vue d\'ensemble', 
              href: `/modules/associations/${currentAssociationId}`, 
              icon: Home,
              active: pathname === `/modules/associations/${currentAssociationId}`,
              description: 'Tableau de bord'
            },
            { 
              label: 'Membres', 
              href: `/modules/associations/${currentAssociationId}/members`, 
              icon: Users,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/members`),
              description: 'Gestion des membres',
              badge: notifications.newMembers > 0 ? notifications.newMembers : undefined
            },
            { 
              label: 'Cotisations', 
              href: `/modules/associations/${currentAssociationId}/cotisations`, 
              icon: CreditCard,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/cotisations`),
              description: 'Paiements mensuels'
            },
            { 
              label: 'Finances', 
              href: `/modules/associations/${currentAssociationId}/finances`, 
              icon: Wallet,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/finances`),
              description: 'Gestion financière',
              badge: (notifications.pendingValidations + notifications.pendingPayments) > 0 ? 
                     (notifications.pendingValidations + notifications.pendingPayments) : undefined,
              submenu: [
                {
                  label: 'Tableau de bord',
                  href: `/modules/associations/${currentAssociationId}/finances`,
                  icon: BarChart3,
                  active: pathname === `/modules/associations/${currentAssociationId}/finances`,
                  description: 'Vue d\'ensemble'
                },
                {
                  label: 'Validation demandes',
                  href: `/modules/associations/${currentAssociationId}/finances/validations`,
                  icon: CheckCircle,
                  active: pathname.includes('/validations'),
                  description: 'Approuver les dépenses',
                  roles: ['president', 'tresorier', 'secretaire'],
                  badge: notifications.pendingValidations > 0 ? notifications.pendingValidations : undefined
                },
                {
                  label: 'Paiements',
                  href: `/modules/associations/${currentAssociationId}/finances/payments`,
                  icon: Banknote,
                  active: pathname.includes('/payments'),
                  description: 'Confirmer les paiements',
                  roles: ['tresorier'],
                  badge: notifications.pendingPayments > 0 ? notifications.pendingPayments : undefined
                },
                {
                  label: 'Revenus',
                  href: `/modules/associations/${currentAssociationId}/finances/income`,
                  icon: TrendingUp,
                  active: pathname.includes('/income'),
                  description: 'Dons et subventions',
                  roles: ['president', 'tresorier', 'secretaire']
                },
                {
                  label: 'Prêts',
                  href: `/modules/associations/${currentAssociationId}/finances/loans`,
                  icon: Clock,
                  active: pathname.includes('/loans'),
                  description: 'Suivi remboursements',
                  roles: ['president', 'tresorier', 'secretaire'],
                }
              ]
            },
            { 
              label: 'Sections', 
              href: `/modules/associations/${currentAssociationId}/sections`, 
              icon: MapPin,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/sections`),
              description: 'Sections géographiques'
            },
            { 
              label: 'Documents', 
              href: `/modules/associations/${currentAssociationId}/documents`, 
              icon: FileText,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/documents`),
              description: 'Attestations et rapports'
            },
            { 
              label: 'Paramètres', 
              href: `/modules/associations/${currentAssociationId}/settings`, 
              icon: Settings,
              active: pathname.includes(`/modules/associations/${currentAssociationId}/settings`),
              description: 'Configuration'
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

  // Filtrer les items selon les rôles
  const filterByRole = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter(item => {
      if (item.roles && !hasRole(item.roles)) {
        return false
      }
      if (item.submenu) {
        item.submenu = filterByRole(item.submenu)
      }
      return true
    })
  }

  const navigationItems = filterByRole(getNavigationItems())

  // Composant pour rendre un item de navigation
  const NavigationItemComponent = ({ item, isSubmenu = false }: { item: NavigationItem, isSubmenu?: boolean }) => {
    const Icon = item.icon
    const isDisabled = item.disabled || item.href === '#'
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isExpanded = expandedMenus.includes(item.label.toLowerCase())
    
    return (
      <div>
        <Button
          variant={item.active ? "default" : "ghost"}
          className={cn(
            "w-full justify-start h-auto p-3 text-sm",
            isSubmenu && "ml-4 pl-6",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={isDisabled}
          onClick={() => {
            if (hasSubmenu) {
              toggleSubmenu(item.label.toLowerCase())
            } else if (!isDisabled && item.href !== '#') {
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
          
          {/* Badge */}
          {item.badge && (
            <Badge 
              variant={typeof item.badge === 'number' && item.badge > 0 ? "destructive" : "secondary"} 
              className="ml-auto text-xs"
            >
              {item.badge}
            </Badge>
          )}
          
          {/* Indicateur "Bientôt" */}
          {isDisabled && (
            <Badge variant="secondary" className="ml-auto text-xs bg-gray-200 text-gray-500">
              Bientôt
            </Badge>
          )}
          
          {/* Chevron pour sous-menu */}
          {hasSubmenu && (
            <div className="ml-2">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          )}
        </Button>

        {/* Sous-menu */}
        {hasSubmenu && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.submenu!.map((subItem) => (
              <NavigationItemComponent 
                key={subItem.label} 
                item={subItem} 
                isSubmenu={true} 
              />
            ))}
          </div>
        )}
      </div>
    )
  }

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
            {navigationItems.map((item) => (
              <NavigationItemComponent key={item.label} item={item} />
            ))}
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
                    router.push(`/modules/associations/${currentAssociationId}/finances/create`)
                    onClose?.()
                  }}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Nouvelle demande
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => {
                    router.push(`/modules/associations/${currentAssociationId}/finances/income`)
                    onClose?.()
                  }}
                >
                  <TrendingUp className="h-3 w-3 mr-2" />
                  Ajouter revenu
                </Button>

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

          {/* Notifications summary */}
          {currentAssociationId && (notifications.pendingValidations > 0 || notifications.pendingPayments > 0) && (
            <div className="p-4 border-t border-gray-200 bg-yellow-50">
              <div className="flex items-center text-xs text-yellow-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span className="font-medium">
                  {notifications.pendingValidations + notifications.pendingPayments} action(s) requise(s)
                </span>
              </div>
              <div className="text-xs text-yellow-700 mt-1">
                {notifications.pendingValidations > 0 && `${notifications.pendingValidations} validation(s)`}
                {notifications.pendingValidations > 0 && notifications.pendingPayments > 0 && " • "}
                {notifications.pendingPayments > 0 && `${notifications.pendingPayments} paiement(s)`}
              </div>
            </div>
          )}

          {/* Footer info */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <div className="font-medium">DiasporaTontine v1.0</div>
              <div className="capitalize">Module: {currentModule}</div>
              {user?.roles && (
                <div className="text-xs mt-1">
                  Rôle: {user.roles.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}