// src/hooks/useAuthPersistence.ts
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function useAuthPersistence() {
  const { setUser, setToken, user, token, loadUserProfile } = useAuthStore() 

  useEffect(() => {
    // 1. Restaurer depuis localStorage si pas déjà chargé
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

  // 2. Charger le profil complet depuis l'API après restauration
  useEffect(() => {
    const loadProfile = async () => {
      if (token && user && !user.associations) {
        // On a un token et un user de base, mais pas les associations/tontines
        console.log('Loading complete user profile from API...')
        const success = await loadUserProfile()
        if (success) {
          console.log('User profile loaded successfully')
        }
      }
    }

    loadProfile()
  }, [token, user, loadUserProfile])
}