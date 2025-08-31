'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  CreditCard, 
  PieChart, 
  Settings,
  Building2,
  Wallet,
  UserPlus,
  Plus
} from 'lucide-react'

interface SidebarProps {
  currentModule: 'associations' | 'tontines' | 'family' | 'commerce'
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ currentModule, isOpen = true, onClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Navigation items selon le module actif
  const getNavigationItems = () => {
    switch(currentModule) {
      case 'associations':
        return [
          { 
            label: 'Tableau de bord', 
            href: '/modules/associations', 
            icon: Home,
            active: pathname === '/modules/associations'
          },
          { 
            label: 'Mes Associations', 
            href: '/modules/associations/list', 
            icon: Building2,
            active: pathname.includes('/modules/associations/list')
          },
          { 
            label: 'Créer Association', 
            href: '/modules/associations/create', 
            icon: Plus,
            active: pathname.includes('/modules/associations/create')
          },
          { 
            label: 'Membres', 
            href: '/modules/associations/members', 
            icon: Users,
            active: pathname.includes('/members'),
            badge: '12'
          },
          { 
            label: 'Cotisations', 
            href: '/modules/associations/cotisations', 
            icon: CreditCard,
            active: pathname.includes('/cotisations')
          },
          { 
            label: 'Finances', 
            href: '/modules/associations/finances', 
            icon: PieChart,
            active: pathname.includes('/finances')
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
            href: '/modules/tontines/list', 
            icon: Wallet,
            active: pathname.includes('/modules/tontines/list')
          },
          { 
            label: 'Créer Tontine', 
            href: '/modules/tontines/create', 
            icon: Plus,
            active: pathname.includes('/modules/tontines/create')
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

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              
              return (
                <Button
                  key={item.href}
                  variant={item.active ? "default" : "ghost"}
                  className="w-full justify-start h-10 text-sm"
                  onClick={() => {
                    router.push(item.href)
                    onClose?.()
                  }}
                >
                  <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </nav>

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