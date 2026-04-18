"use client"

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'

export const useAuth = () => {
  const {
    apiKey,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setLoading,
    initializeAuth,
  } = useAuthStore()

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return {
    apiKey,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setLoading,
  }
}