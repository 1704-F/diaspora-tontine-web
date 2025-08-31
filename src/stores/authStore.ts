// ============================================
// 1. STORE AUTHENTIFICATION (src/stores/authStore.ts)
// ============================================
import { create } from 'zustand'

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  profilePicture?: string
  role: 'member' | 'association_admin' | 'platform_admin'
  enabledModules: {
    associations: { enabled: boolean; plan: string }
    tontines: { enabled: boolean; plan: string }
    family: { enabled: boolean; plan: string }
    commerce: { enabled: boolean; plan: string }
  }
  associations?: Array<{
    id: number
    name: string
    role: string
    status: string
  }>
  tontines?: Array<{
    id: number
    name: string
    role: 'organizer' | 'participant'
    status: string
  }>
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  selectedModule: 'associations' | 'tontines' | 'family' | 'commerce' | null
  
  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
  setSelectedModule: (module: 'associations' | 'tontines' | 'family' | 'commerce') => void
  login: (credentials: { phoneNumber: string; otpCode: string; module?: string }) => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  selectedModule: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setSelectedModule: (module) => set({ selectedModule: module }),
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, selectedModule: null })
  },

  login: async (credentials) => {
  set({ isLoading: true })
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
    
    const data = await response.json()
    
    if (data.success) {
      const { user, token } = data.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      const selected =
  credentials.module && ['associations', 'tontines', 'family', 'commerce'].includes(credentials.module)
    ? (credentials.module as 'associations' | 'tontines' | 'family' | 'commerce')
    : null

set({ user, token, selectedModule: selected })

      return true
    }
    
    return false
  } catch (error) {
    console.error('Login error:', error)
    return false
  } finally {
    set({ isLoading: false })
  }
}

}))