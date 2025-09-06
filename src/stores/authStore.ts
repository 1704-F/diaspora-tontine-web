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
  loadUserProfile: () => Promise<boolean>  // ← Ajouter cette ligne
  
  // Helpers
  getUserModuleState: (module: string) => 'new' | 'active'
  getLastSelectedModule: () => string | null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  selectedModule: null,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  
  setSelectedModule: (module) => {
    set({ selectedModule: module })
    // Persistance automatique
    localStorage.setItem('lastSelectedModule', module)
  },
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('lastSelectedModule')
    set({ user: null, token: null, selectedModule: null })
  },

  // Helper pour déterminer l'état d'un utilisateur dans un module
  getUserModuleState: (module: string) => {
    const { user } = get()
    if (!user) return 'new'
    
    switch (module) {
      case 'associations':
        return user.associations && user.associations.length > 0 ? 'active' : 'new'
      case 'tontines':
        return user.tontines && user.tontines.length > 0 ? 'active' : 'new'
      default:
        return 'new'
    }
  },

  // Charger le profil complet avec associations/tontines
  loadUserProfile: async () => {
    const { token } = get()
    if (!token) return false

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erreur chargement profil')
      }

      const data = await response.json()
      
      if (data.success && data.data.user) {
        set({ user: data.data.user })
        localStorage.setItem('user', JSON.stringify(data.data.user))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Erreur loadUserProfile:', error)
      return false
    }
  },

  // Helper pour récupérer le dernier module utilisé
  getLastSelectedModule: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastSelectedModule')
    }
    return null
  },

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: credentials.phoneNumber,
          otp: credentials.otpCode
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const { user, tokens, nextStep } = data
        
        // Vérifier si l'utilisateur doit configurer son PIN
        if (nextStep === 'setup_pin') {
          console.log('Utilisateur doit configurer son PIN')
          return false
        }

        if (!tokens) {
          console.log('Pas de tokens reçus')
          return false
        }
        
        const token = tokens.accessToken
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        // Ne pas auto-sélectionner un module, laisser l'utilisateur choisir
        set({ user, token, selectedModule: null })

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

// Hook personnalisé pour la persistence auth
export const useAuthPersistence = () => {
  const { setUser, setToken, user, token } = useAuthStore()

  if (typeof window !== 'undefined') {
    // Restaurer au démarrage si pas déjà chargé
    if (!user && !token) {
      const storedToken = localStorage.getItem('token')
      const storedUserStr = localStorage.getItem('user')
      
      if (storedToken && storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr)
          setToken(storedToken)
          setUser(storedUser)
        } catch (error) {
          console.error('Error parsing stored user:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    }
  }
}