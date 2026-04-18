// Auth utilities for API Key authentication

export interface AuthState {
  apiKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Auth constants
export const AUTH_ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/chat",
} as const;

export const PUBLIC_ROUTES = [
  AUTH_ROUTES.LOGIN,
] as const;

