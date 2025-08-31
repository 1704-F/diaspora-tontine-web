// ============================================
// src/components/layout/MainLayout.tsx
// ============================================
'use client'

import { useState, useEffect } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { useAuthPersistence } from '@/hooks/useAuthPersistence'

interface MainLayoutProps {
  children: React.ReactNode
  currentModule: 'associations' | 'tontines' | 'family' | 'commerce'
}

export function MainLayout({ children, currentModule }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuthStore()
  
  // Restaurer auth depuis localStorage
  useAuthPersistence()

  // Fermer sidebar sur changement de route (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [currentModule])

  // Fermer sidebar sur clic extérieur (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar')
      const menuButton = document.getElementById('mobile-menu-button')
      
      if (sidebarOpen && 
          sidebar && 
          !sidebar.contains(event.target as Node) &&
          menuButton && 
          !menuButton.contains(event.target as Node)) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header fixe */}
      <Header 
        user={user}
        currentModule={currentModule}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          currentModule={currentModule}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto lg:ml-0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}