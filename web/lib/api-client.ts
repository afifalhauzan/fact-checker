import { useAuthStore } from './auth-store'

interface FetchOptions extends RequestInit {
  body?: string | FormData | null
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || '') {
    this.baseURL = baseURL
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    if (typeof window === 'undefined') return headers

    try {
      // Check for API-key authentication (new system)
      const apiKeyCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('X-API-Key='))
        ?.split('=')[1]
      
      if (apiKeyCookie) {
        headers['X-API-Key'] = decodeURIComponent(apiKeyCookie)
        return headers
      }

      // Fall back to legacy auth-storage (Google OAuth)
      const authStorageCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-storage='))
        ?.split('=')[1]
      
      if (authStorageCookie) {
        try {
          const authData = JSON.parse(decodeURIComponent(authStorageCookie))
          if (authData.accessToken && authData.tokenType) {
            headers['Authorization'] = `${authData.tokenType} ${authData.accessToken}`
            return headers
          }
        } catch (error) {
          console.error('Failed to parse auth storage cookie:', error)
        }
      }
    } catch (error) {
      console.error('Failed to read auth headers:', error)
    }

    return headers
  }

  private async requestInterceptor(options: FetchOptions): Promise<FetchOptions> {
    // Add auth headers (either X-API-Key or Authorization)
    const authHeaders = this.getAuthHeaders()
    
    const headers = new Headers(options.headers || {})
    
    // Add auth headers
    Object.entries(authHeaders).forEach(([key, value]) => {
      headers.set(key, value)
    })

    // Ensure Content-Type is set for JSON requests
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    return {
      ...options,
      headers,
    }
  }

  private async responseInterceptor(response: Response): Promise<Response> {
    // Handle 401 Unauthorized and 403 Forbidden
    if (response.status === 401 || response.status === 403) {
      // Trigger logout
      useAuthStore.getState().logout()
      
      // Redirect to login if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }

    return response
  }

  async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    // Perform request interceptor
    const interceptedOptions = await this.requestInterceptor(options)

    // Build full URL
    const url = this.baseURL ? `${this.baseURL}${endpoint}` : endpoint

    try {
      const response = await fetch(url, interceptedOptions)

      // Perform response interceptor
      await this.responseInterceptor(response)

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}`
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.detail || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data: T = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unknown error occurred')
    }
  }

  async get<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, body?: Record<string, any>, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async put<T>(endpoint: string, body?: Record<string, any>, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async patch<T>(endpoint: string, body?: Record<string, any>, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient()
