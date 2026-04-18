"use client";

import { useState, useEffect } from 'react';

interface ServerHealthResponse {
  isOnline: boolean;
  status: string;
  message: string | null;
  error: string | null;
}

interface UseBackendHealthReturn {
  isOnline: boolean;
  status: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useBackendHealth(): UseBackendHealthReturn {
  const [isOnline, setIsOnline] = useState(true); // Assume online until checked
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const checkBackendHealth = async () => {
    try {
      // Only show loading state if offline or initial load
      if (!isOnline || isInitialLoad) {
        setIsLoading(true);
      }
      
      // Clear error when retrying from offline state
      if (!isOnline) {
        setError(null);
      }

      // Call server-side health check API
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        const data: ServerHealthResponse = await response.json();
        setIsOnline(data.isOnline);
        setStatus(data.status);
        if (data.error) {
          setError(data.error);
        } else {
          // Clear error on successful connection
          setError(null);
        }
      } else {
        setIsOnline(false);
        setStatus('Offline');
        setError(`Server responded with ${response.status}`);
      }
    } catch (err) {
      setIsOnline(false);
      setStatus('Offline');
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    // Check health on mount
    checkBackendHealth();

    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    isOnline,
    status,
    isLoading,
    error,
  };
}