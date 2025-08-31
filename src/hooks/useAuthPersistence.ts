// ============================================
// src/hooks/useAuthPersistence.ts (si pas encore créé)
// ============================================
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function useAuthPersistence() {
  const { setUser, setToken, user, token } = useAuthStore()

  useEffect(() => {
    // Ne restaurer que si pas déjà chargé
    if (!user && !token) {
      const storedToken = localStorage.getItem('token')
      const storedUserStr = localStorage.getItem('user')
      
      if (storedToken && storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr)
          setToken(storedToken)
          setUser(storedUser)
          console.log('Auth restored from localStorage')
        } catch (error) {
          console.error('Error parsing stored user:', error)
          // Nettoyage si données corrompues
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    }
  }, [setToken, setUser, user, token])

  // Sauvegarder quand user/token change
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
  }, [user, token])
}