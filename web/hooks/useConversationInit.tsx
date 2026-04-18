"use client";

import { useState, useRef } from 'react';

interface ConversationInitResponse {
  id: string;
  [key: string]: any;
}

interface UseConversationInitReturn {
  initializeConversation: () => Promise<string | null>;
  isInitializing: boolean;
  error: string | null;
}

// Global request deduplication using a timestamp
let lastInitRequestTime = 0;
const INIT_DEBOUNCE_MS = 500; // Prevent duplicate requests within 500ms

export function useConversationInit(): UseConversationInitReturn {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initInProgressRef = useRef(false);

  const initializeConversation = async (): Promise<string | null> => {
    // Guard 1: Prevent concurrent initialization requests
    if (initInProgressRef.current || isInitializing) {
      console.warn('⚠️ [useConversationInit] Initialization already in progress, skipping duplicate request');
      return null;
    }

    // Guard 2: Debounce - prevent rapid duplicate requests
    const now = Date.now();
    if (now - lastInitRequestTime < INIT_DEBOUNCE_MS) {
      console.warn('⚠️ [useConversationInit] Request made too soon, debouncing for', INIT_DEBOUNCE_MS, 'ms');
      return null;
    }

    initInProgressRef.current = true;
    lastInitRequestTime = now;
    setIsInitializing(true);
    setError(null);
    
    try {
      console.log('🚀 [useConversationInit] Starting conversation initialization...');
      const response = await fetch('/api/conversation/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initialize conversation: ${response.status}`);
      }
      console.log('✅ [useConversationInit] Response status:', response.status);

      const data: ConversationInitResponse = await response.json();
      console.log('📄 [useConversationInit] Response data:', data);
      console.log('🆔 [useConversationInit] Conversation ID:', data.id);
      return data.id;
    } catch (err) {
      console.error('💥 [useConversationInit] Error during initialization:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize conversation';
      console.error('📝 [useConversationInit] Error message:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      console.log('🏁 [useConversationInit] Initialization finished');
      setIsInitializing(false);
      initInProgressRef.current = false;
    }
  };

  return {
    initializeConversation,
    isInitializing,
    error,
  };
}