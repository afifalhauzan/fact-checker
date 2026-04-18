"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { ApiKeyLoginFormData } from '@/lib/auth-schemas';

interface AuthContextType {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Auth actions
  login: (credentials: ApiKeyLoginFormData) => Promise<string | null>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    isAuthenticated,
    isLoading,
    login: storeLogin,
    logout: storeLogout,
    setLoading,
    initializeAuth,
  } = useAuthStore();

  const [error, setError] = useState<string | null>(null);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials: ApiKeyLoginFormData) => {
    try {
      setError(null);
      setLoading(true);
      const conversationId = await storeLogin(credentials);
      
      // Add small delay to ensure cookie is set before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return conversationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setError(null);
    storeLogout();
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}