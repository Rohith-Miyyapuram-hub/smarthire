import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Zustand store with persist middleware — saves auth state to localStorage
// so the user stays logged in even after refreshing the page.
const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,       // { _id, name, email, role, avatar }
      token: null,      // JWT access token string
      isAuthenticated: false,

      // Called after successful login or register
      login: (user, token) => set({
        user,
        token,
        isAuthenticated: true,
      }),

      // Called on logout or when a 401 is received
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false,
      }),

      // Update user fields (e.g. after profile edit)
      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates },
      })),

      // Convenience getter
      getRole: () => get().user?.role || null,
    }),
    {
      name: 'smarthire-auth', // the key used in localStorage
    }
  )
)

export default useAuthStore
