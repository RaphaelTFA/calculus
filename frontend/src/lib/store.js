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

      login: async (email, password, remember = false) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api.post('/auth/login', { email, password, remember })
          set({ 
            user: data.user || null, 
            token: data.token || null, 
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
        try {
          const user = await api.get('/auth/me')
          set({ user })
          return user
        } catch (error) {
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

      changePassword: async (oldPassword, newPassword) => {
          // Nếu trong auth.py router có prefix là "/auth" 
          // và trong main.py include router đó với prefix "/api/v1"
          // Thì đường dẫn này là ĐÚNG.
          const res = await api.put('/auth/change-password', {
              old_password: oldPassword,
              new_password: newPassword
          })
          return res
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (e) {
          // ignore network errors
        }
        set({ user: null, token: null, error: null })
        localStorage.removeItem('auth-storage')
      },

      isAuthenticated: () => !!get().user || !!get().token,
      
      clearError: () => set({ error: null }),

      // Update user stats (XP, streak) after step completion
      updateUserStats: (stats) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            xp: stats.total_xp ?? state.user.xp,
            current_streak: stats.streak?.current_streak ?? state.user.current_streak,
            longest_streak: stats.streak?.longest_streak ?? state.user.longest_streak,
          } : null
        }))
      },
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
