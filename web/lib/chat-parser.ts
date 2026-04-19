import type { MetabotUIMessage } from '@/types/streaming'

/**
 * Backend chat history message schema
 */
interface BackendHistoryMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  meta_data?: Record<string, any> | null
  created_at: string
}

/**
 * Backend chat history response schema
 */
interface BackendHistoryResponse {
  data: BackendHistoryMessage[]
}

/**
 * THIS IS A CUSTOM FUNCTION WRITTEN BY THE METABOT DEVELOPER, NOT PART OF THE AI SDK
 * Parse backend chat history response to frontend UI message format.
 * [SERVER-SIDE SOURCE OF TRUTH]
 *
 * Transforms backend messages to Vercel AI SDK MetabotUIMessage format with parts array.
 * History parsing is text-only, and structured custom data is handled during live streaming.
 * 
 * @param rawData - Raw response from GET /api/chat/session/{conversation_id}/messages
 *   Can be either:
 *   - Array of BackendHistoryMessage (legacy format)
 *   - BackendHistoryResponse with { data } (current format)
 * @returns Array of frontend-compatible MetabotUIMessage objects with text parts
 */
export function parseHistoryToMessages(rawData: unknown): MetabotUIMessage[] {
  // Handle both wrapped response format and raw array format
  let messagesArray: BackendHistoryMessage[] = []
  
  if (!rawData) {
    console.warn('[ChatParser] Received null/undefined data')
    return []
  }

  // Check if response has data wrapper (new format)
  if (typeof rawData === 'object' && !Array.isArray(rawData) && 'data' in rawData) {
    const response = rawData as BackendHistoryResponse
    if (Array.isArray(response.data)) {
      messagesArray = response.data
    } else {
      console.warn('[ChatParser] Invalid response format - data is not an array:', rawData)
      return []
    }
  } 
  // Otherwise treat as direct array (legacy format)
  else if (Array.isArray(rawData)) {
    messagesArray = rawData
  } 
  // Invalid format
  else {
    console.warn('[ChatParser] Expected array or wrapped response, received:', typeof rawData)
    return []
  }

  return messagesArray
    .map((item): MetabotUIMessage | null => {
      try {
        const message = item as BackendHistoryMessage

        // Validate required fields
        if (!message.id || !message.role) {
          console.warn('[ChatParser] Skipping invalid message:', message)
          return null
        }

        // Build text parts for Vercel AI SDK history messages.
        const parts: any[] = []
        
        if (message.content) {
          parts.push({ type: 'text', text: message.content })
        }

        // Ensure at least one text part
        if (parts.length === 0) {
          parts.push({ type: 'text', text: '' })
        }

        // Transform to frontend MetabotUIMessage format
        const uiMessage: MetabotUIMessage = {
          id: message.id,
          role: message.role, // 'user' or 'assistant'
          parts,
        }

        return uiMessage
      } catch (err) {
        console.error('[ChatParser] Error parsing message:', err, item)
        return null
      }
    })
    .filter((msg): msg is MetabotUIMessage => msg !== null)
}
