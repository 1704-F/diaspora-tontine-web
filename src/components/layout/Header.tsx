'use client'

import { useState } from 'react'
import Image from "next/image";
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Menu, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'

interface HeaderProps {
  user?: {
    firstName: string
    lastName: string
    email: string
    profilePicture?: string
  } | null
  currentModule?: 'associations' | 'tontines' | 'family' | 'commerce'
  onMenuClick?: () => void
   additionalActions?: React.ReactNode
}

export function Header({ user, currentModule, onMenuClick }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const router = useRouter()

  const moduleLabels = {
    associations: { label: 'Associations', icon: '🏛️', color: 'bg-blue-100 text-blue-800' },
    tontines: { label: 'Tontines', icon: '💰', color: 'bg-green-100 text-green-800' },
    family: { label: 'Famille', icon: '👨‍👩‍👧‍👦', color: 'bg-purple-100 text-purple-800' },
    commerce: { label: 'Commerce', icon: '🏪', color: 'bg-orange-100 text-orange-800' }
  }

  const currentModuleInfo = currentModule ? moduleLabels[currentModule] : null

  return (
    <header className="bg-white border-b border-gray-200 h-16 relative z-40">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Button 
            id="mobile-menu-button"
            variant="ghost" 
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <div className="flex items-center space-x-3">
             <div className="flex items-center space-x-3">
                          <div className="flex items-center gap-3">
                            {/* Logo SVG from file */}
                            <Image src="/logo.svg" alt="Logo" width={156} height={156} />
                          </div>
                        </div>
          </div>

          {/* Current module badge */}
          {currentModuleInfo && (
            <Badge variant="secondary" className={currentModuleInfo.color}>
              <span className="mr-1">{currentModuleInfo.icon}</span>
              <span className="hidden sm:inline">{currentModuleInfo.label}</span>
            </Badge>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User menu */}
          {user && (
            <div className="relative">
              <Button
                variant="ghost"
                className="flex items-center space-x-2 p-2"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <Avatar 
                  src={user.profilePicture}
                  alt={`${user.firstName} ${user.lastName}`}
                  size="sm"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-700">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>

              {/* Dropdown menu */}
              {isProfileOpen && (
                <>
                  {/* Overlay */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsProfileOpen(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                    <div className="py-1">
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          router.push('/profile')
                          setIsProfileOpen(false)
                        }}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Mon Profil
                      </button>
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          router.push('/settings')
                          setIsProfileOpen(false)
                        }}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Paramètres
                      </button>
                      <div className="border-t border-gray-100"></div>
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => {
                          localStorage.removeItem('token')
                          localStorage.removeItem('user')
                          router.push('/login')
                          setIsProfileOpen(false)
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}