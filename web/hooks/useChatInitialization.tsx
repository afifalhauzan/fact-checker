import React from "react";
import { useConversationStore } from "@/lib/conversation-store";
import { useAuthStore } from "@/lib/auth-store";
import { useConversationInit } from "@/hooks/useConversationInit";

interface UseChatInitializationReturn {
  conversationId: string | null;
  isInitializing: boolean;
  error: string | null;
  handleCreateNewSession: () => Promise<void>;
}

export function useChatInitialization(): UseChatInitializationReturn {
  const {
    conversationId,
    isInitializing,
    error,
    setConversationId,
    setInitializing,
    setError,
    reset
  } = useConversationStore();

  const { isAuthenticated } = useAuthStore();
  const { initializeConversation } = useConversationInit();

  // Use a ref to track if we've already synced URL conversation_id to store
  const urlSyncedRef = React.useRef(false);
  // Use a ref to track if init is in progress locally
  const isInitInProgressRef = React.useRef(false);

  // Handle conversation initialization with guards
  const handleInitializeConversation = React.useCallback(async () => {
    // Guard against concurrent initialization
    if (isInitInProgressRef.current || isInitializing) {
      console.log('⏳ [useChatInitialization] Initialization already in progress, skipping');
      return;
    }

    isInitInProgressRef.current = true;
    setInitializing(true);
    setError(null);

    try {
      const newConversationId = await initializeConversation();
      if (newConversationId) {
        setConversationId(newConversationId);
        console.log('✅ [useChatInitialization] Conversation created:', newConversationId);
      } else {
        setError('Failed to initialize conversation');
      }
    } finally {
      isInitInProgressRef.current = false;
      setInitializing(false);
    }
  }, [initializeConversation, isInitializing, setInitializing, setError, setConversationId]);

  // Handle creating new session
  const handleCreateNewSession = React.useCallback(async () => {
    reset();
    urlSyncedRef.current = false; // Reset sync flag for new session
    await handleInitializeConversation();
  }, [reset, handleInitializeConversation]);

  // Initialize conversation on mount - only when authenticated
  React.useEffect(() => {
    // Don't initialize if not authenticated
    if (!isAuthenticated) {
      return;
    }

    // Check if conversationId already exists in URL (page refresh/shared link)
    const urlParams = new URLSearchParams(window.location.search);
    const urlConversationId = urlParams.get('conversation_id');

    // If URL has conversation_id and store doesn't have it yet, sync it (one-time only)
    if (urlConversationId && !conversationId && !urlSyncedRef.current) {
      console.log('🔄 [useChatInitialization] Syncing URL conversation_id to store:', urlConversationId);
      setConversationId(urlConversationId);
      setInitializing(false);
      setError(null);
      urlSyncedRef.current = true; // Mark as synced to prevent re-sync
      return;
    }

    // If store already has conversation_id (from URL sync or previous init), don't init again
    if (conversationId) {
      console.log('⏭️ [useChatInitialization] Conversation already exists in store:', conversationId);
      urlSyncedRef.current = true;
      return;
    }

    // If already initializing, don't start another init
    if (isInitializing || isInitInProgressRef.current) {
      console.log('⏳ [useChatInitialization] Initialization already in progress');
      return;
    }

    // Only initialize if we have an authenticated user AND no conversation yet
    console.log('🆕 [useChatInitialization] No conversation ID found, initializing new conversation');
    handleInitializeConversation();
  }, [isAuthenticated, conversationId, isInitializing, setConversationId, setInitializing, setError, handleInitializeConversation]);

  return {
    conversationId,
    isInitializing,
    error,
    handleCreateNewSession
  };
}
