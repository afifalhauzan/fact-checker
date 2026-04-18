"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ApiKeyLoginFormData } from './auth-schemas'
import { useConversationStore } from './conversation-store'
import { useGraphHistoryStore } from './graph-history-store'

export interface AuthState {
  apiKey: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: ApiKeyLoginFormData) => Promise<string | null>
  logout: () => void
  setLoading: (loading: boolean) => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: ApiKeyLoginFormData) => {
        set({ isLoading: true })
        
        try {
          // Initialize conversation with API key
          const response = await fetch('/api/conversation/init', {
            method: 'POST',
            headers: {
              'X-API-Key': credentials.apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          })

          if (!response.ok) {
            const errorText = await response.text()
            let errorMessage = 'Invalid API Key'
            
            try {
              const errorData = JSON.parse(errorText)
              errorMessage = errorData.error || errorData.detail || errorMessage
            } catch {
              errorMessage = errorText || errorMessage
            }
            
            throw new Error(errorMessage)
          }

          const data = await response.json()
          const conversationId = data.id

          if (!conversationId) {
            throw new Error('Failed to initialize conversation - no conversation_id received')
          }

          const authState = {
            apiKey: credentials.apiKey,
            isAuthenticated: true,
            isLoading: false,
          }

          set(authState)
          
          // Set X-API-Key cookie with no expiration (10 years)
          if (typeof window !== 'undefined') {
            const futureDate = new Date()
            futureDate.setFullYear(futureDate.getFullYear() + 10)
            document.cookie = `X-API-Key=${encodeURIComponent(credentials.apiKey)}; path=/; expires=${futureDate.toUTCString()}; samesite=strict`
          }

          // Store conversation_id for use in redirect
          return conversationId
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({
          apiKey: null,
          isAuthenticated: false,
          isLoading: false,
        })
        
        // Reset all related Zustand stores
        useConversationStore.getState().reset()
        useGraphHistoryStore.getState().clearHistory()
        
        // Clear X-API-Key cookie
        if (typeof window !== 'undefined') {
          document.cookie = 'X-API-Key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict'
        }

        // Clear old auth-storage cookie for backward compatibility
        if (typeof window !== 'undefined') {
          document.cookie = 'auth-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict'
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      initializeAuth: () => {
        const state = get()
        
        // Check if user is already authenticated from Zustand persist
        if (state.apiKey && state.isAuthenticated) {
          return
        }

        // Check X-API-Key cookie
        if (typeof window !== 'undefined') {
          try {
            const cookieValue = document.cookie
              .split('; ')
              .find(row => row.startsWith('X-API-Key='))
              ?.split('=')[1]
            
            if (cookieValue) {
              const apiKey = decodeURIComponent(cookieValue)
              set({
                apiKey,
                isAuthenticated: true,
                isLoading: false,
              })
              return
            }
          } catch (error) {
            console.error('Failed to parse API Key cookie:', error)
          }
        }
        
        set({ isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Helper function to get X-API-Key header
export const getApiKeyHeader = () => {
  const state = useAuthStore.getState()
  if (state.apiKey) {
    return {
      'X-API-Key': state.apiKey,
    }
  }
  return {}
}

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const state = useAuthStore.getState()
  return state.isAuthenticated && !!state.apiKey
}