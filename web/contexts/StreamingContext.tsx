"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import toast from "react-hot-toast";
import { useConversationStore } from "@/lib/conversation-store";
import { useAuthStore } from "@/lib/auth-store";
import { extractMessageContent } from "@/utils/iframe-parser";
import { useChatHistory } from "@/hooks/use-chat-history";
import { type MetabotUIMessage } from "@/types/streaming";

interface StreamingContextType {
  // Chat state
  messages: MetabotUIMessage[];
  sendMessage: (message: any, options?: { action_type?: string; action_payload?: any }) => void;
  status: string;
  stop: () => void;
  isLoading: boolean;
  isAuthReady: boolean;
  handleRefresh: () => void;
  renderMessageContent: (message: MetabotUIMessage) => string;
  chatId: string;
  handleInteractiveChoice: (stepId: string, selection: string) => void;
}

const StreamingContext = createContext<StreamingContextType | undefined>(undefined);

interface StreamingProviderProps {
  children: React.ReactNode;
  chatId: string;
}

export function StreamingProvider({ children, chatId }: StreamingProviderProps) {
  const { conversationId } = useConversationStore();
  const { isAuthenticated } = useAuthStore();

  // Chat history fetching
  const { fetchHistory } = useChatHistory();

  // Track which conversation ID we've already fetched history for (prevent double-fetch)
  const fetchedConversationRef = useRef<string | null>(null);

  // Synchronous guard to prevent React Strict Mode double-invocation from fetching twice
  const hasInitiallyFetchedRef = useRef(false);

  // Local loading state to start immediately when message is sent
  const [isUserSending, setIsUserSending] = useState(false);

  // Get conversationId from URL if available (for page refreshes/shared URLs)
  const urlConversationId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('conversation_id')
    : null;

  const effectiveConversationId = urlConversationId || conversationId;

  // Prioritize URL over store to prevent race conditions
  const activeConversationId = effectiveConversationId;

  // Only initialize useChat when user is authenticated
  const shouldInitializeChat = isAuthenticated;

  const {
    messages: rawMessages,
    setMessages,
    sendMessage: originalSendMessage,
    status,
    stop,
  } = useChat<any>({
    id: activeConversationId || chatId, // Use conversation ID as the chat ID
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
    onError: (error: Error) => {
      console.error('Chat error:', error);
      setIsUserSending(false); // Reset loading on error
      if (error.message.includes("Too many requests")) {
        toast.error(
          "You are sending too many messages. Please try again later."
        );
      }
    },
    onFinish: (message) => {
      console.log('Chat finished:', message);
      setIsUserSending(false); // Reset loading when finished
    }
  });

  const messages = rawMessages as MetabotUIMessage[];

  // Fetch chat history when conversationId becomes available
  // Only fetch once per conversation ID to prevent redundant API calls
  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    // Synchronous guard: prevent Strict Mode double-invocation from fetching twice
    if (hasInitiallyFetchedRef.current) {
      console.log('[StreamingContext] Initial fetch already in progress or completed, skipping');
      return;
    }

    // Mark as started immediately (synchronous) to block concurrent fetches
    hasInitiallyFetchedRef.current = true;

    // Also check if we've already fetched for this conversation
    if (fetchedConversationRef.current === activeConversationId) {
      console.log('[StreamingContext] History already fetched for conversation:', activeConversationId);
      return;
    }

    console.log('[StreamingContext] Fetching initial chat history for conversation:', activeConversationId);

    fetchHistory({ conversationId: activeConversationId }).then((result) => {
      if (result.messages && result.messages.length > 0) {
        console.log('[StreamingContext] Loaded', result.messages.length, 'initial historical messages');

        // Set the fetched messages as initial state
        setMessages(result.messages);

      } else {
        console.log('[StreamingContext] No initial historical messages found');
      }

      // Mark this conversation as fetched
      fetchedConversationRef.current = activeConversationId;
    });
  }, [activeConversationId, fetchHistory, setMessages]);

  // Wrapped sendMessage to control immediate loading and check auth
  const sendMessage = useCallback((message: any, options?: { action_type?: string; action_payload?: any }) => {
    if (!isAuthenticated) {
      toast.error('Anda harus login untuk mengirim pesan');
      return;
    }

    setIsUserSending(true);
    console.log('SendMessage called with:', message, 'options:', options);

    const messageObject = typeof message === 'string'
      ? { text: message }
      : message;

    const requestOptions: any = {
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (options?.action_type) {
      requestOptions.body = {
        action_type: options.action_type,
        action_payload: options.action_payload,
      };
    }

    originalSendMessage(messageObject, requestOptions);
  }, [originalSendMessage, isAuthenticated]);

  const handleInteractiveChoice = useCallback((stepId: string, selection: string) => {
    console.log('[StreamingContext] Interactive choice is not used in simplified mode:', { stepId, selection });
  }, []);

  const handleRefresh = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  const renderMessageContent = useCallback((message: MetabotUIMessage) => {
    const content = extractMessageContent(message);
    return content || JSON.stringify(message);
  }, []);

  // Combined loading state - true if user just sent message OR AI is responding
  const isLoading = isUserSending || status === "submitted" || status === "streaming";

  const value: StreamingContextType = {
    messages,
    sendMessage,
    status,
    stop,
    isLoading,
    isAuthReady: shouldInitializeChat,
    handleRefresh,
    renderMessageContent,
    chatId,
    handleInteractiveChoice,
  };

  return (
    <StreamingContext.Provider value={value}>
      {children}
    </StreamingContext.Provider>
  );
}

export function useStreaming() {
  const context = useContext(StreamingContext);
  if (context === undefined) {
    throw new Error('useStreaming must be used within a StreamingProvider');
  }
  return context;
}