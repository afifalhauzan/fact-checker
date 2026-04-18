import { useState, useCallback } from 'react'
import { parseHistoryToMessages } from '@/lib/chat-parser'
import type { MetabotUIMessage } from '@/types/streaming'
import type { ChartEmbedData } from '@/types/chart'

interface UseChatHistoryState {
  messages: MetabotUIMessage[]
  isLoading: boolean
  error: string | null
}

interface FetchHistoryParams {
  conversationId: string
}

interface FetchHistoryResult {
  messages: MetabotUIMessage[]
}

/**
 * Custom hook to fetch and parse chat history from the backend.
 * Loads full chat history in a single request.
 * Messages are the single source of truth; charts are derived.
 */
export function useChatHistory() {
  const [state, setState] = useState<UseChatHistoryState>({
    messages: [],
    isLoading: false,
    error: null,
  })

  /**
   * Fetch full chat history for a conversation.
   * 
   * @param params - { conversationId }
   * @returns { messages }
   */
  const fetchHistory = useCallback(async (params: FetchHistoryParams | string): Promise<FetchHistoryResult> => {
    // Support legacy string parameter (conversationId only)
    const { conversationId } = typeof params === 'string'
      ? { conversationId: params }
      : params

    // Clear state if no conversationId
    if (!conversationId) {
      setState({
        messages: [],
        isLoading: false,
        error: null,
      })
      return { messages: [] }
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    try {
      const url = new URL(`/api/chat/session/${conversationId}/messages`, window.location.origin)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch chat history: ${response.statusText}`)
      }

      const data = await response.json()

      // Parse the raw backend response to frontend message format
      const parsedMessages = parseHistoryToMessages(data)

      setState({
        messages: parsedMessages,
        isLoading: false,
        error: null,
      })

      return {
        messages: parsedMessages,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('[ChatHistory] Fetch error:', errorMessage)

      const result = { messages: [] }
      
      setState({
        messages: [],
        isLoading: false,
        error: errorMessage,
      })

      return result
    }
  }, [])

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    fetchHistory,
  }
}
