import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from './api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api.post('/auth/login', { email, password })
          set({ 
            user: data.user, 
            token: data.token, 
            isLoading: false,
            error: null 
          })
          return data
        } catch (error) {
          set({ isLoading: false, error: error.message })
          throw error
        }
      },

      register: async (username, email, password, displayName) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api.post('/auth/register', { 
            username, 
            email, 
            password,
            display_name: displayName || username
          })
          set({ 
            user: data.user, 
            token: data.token, 
            isLoading: false,
            error: null 
          })
          return data
        } catch (error) {
          set({ isLoading: false, error: error.message })
          throw error
        }
      },

      fetchUser: async () => {
        const token = get().token
        if (!token) return null
        
        try {
          const user = await api.get('/auth/me')
          set({ user })
          return user
        } catch (error) {
          // Token invalid, clear auth
          set({ user: null, token: null })
          return null
        }
      },

      updateProfile: async (profileData) => {
        const res = await api.put("/auth/profile", profileData)

        set((state) => ({
          user: {
            ...state.user,
            ...res,
          },
        }))

        return res
      },



      logout: () => {
        set({ user: null, token: null, error: null })
        localStorage.removeItem('auth-storage')
      },

      isAuthenticated: () => !!get().token,
      
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

export const useGameStore = create(
  persist(
    (set, get) => ({
      streak: 0,
      xp: 0,
      gems: 100,
      level: 1,

      setStats: (stats) => set(stats),
      addXP: (amount) => {
        const newXP = get().xp + amount
        const newLevel = Math.floor(newXP / 100) + 1
        set({ xp: newXP, level: newLevel })
      },
      addGems: (amount) => set((state) => ({ gems: state.gems + amount })),
      incrementStreak: () => set((state) => ({ streak: state.streak + 1 })),
      resetStreak: () => set({ streak: 0 }),
    }),
    {
      name: 'game-storage',
    }
  )
)

export const useUIStore = create((set) => ({
  toast: null,
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3000)
  },
  hideToast: () => set({ toast: null }),
}))
