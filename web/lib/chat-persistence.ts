import type { MetabotUIMessage } from '@/types/streaming'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const SESSION_SAVED_EVENT = 'telaahkarier:session-saved'

/**
 * Convert a UI message into the row shape the backend stores.
 * Inline (base64) attachments are not uploaded yet, so they are replaced by a text note.
 */
function toStoredMessage(message: MetabotUIMessage) {
  const parts: any[] = []

  for (const part of (message.parts || []) as any[]) {
    const isInlineFile = part?.type === 'file' && typeof part.url === 'string' && part.url.startsWith('data:')

    if (isInlineFile) {
      parts.push({ type: 'text', text: `[Lampiran: ${part.filename || part.mediaType || 'file'}]` })
    } else {
      parts.push(part)
    }
  }

  const content = parts
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
    .trim()

  return {
    id: message.id,
    role: message.role,
    content,
    meta_data: { parts },
  }
}

/**
 * Save the latest exchange (last user message and everything after it) to the backend.
 * Guests get a 401 here, which is expected: their chats are not stored.
 */
export async function persistLatestExchange(conversationId: string, messages: MetabotUIMessage[]): Promise<void> {
  if (!UUID_PATTERN.test(conversationId)) return

  let start = messages.length - 1
  while (start > 0 && messages[start].role !== 'user') start -= 1

  const exchange = messages
    .slice(Math.max(start, 0))
    .filter((message) => message.role === 'user' || message.role === 'assistant')

  if (exchange.length === 0) return

  // The chat route names a session on its first exchange (data-session-title); the backend stores it.
  const titlePart = exchange
    .flatMap((message) => (message.parts || []) as any[])
    .find((part) => part?.type === 'data-session-title' && typeof part.data?.title === 'string')

  try {
    const response = await fetch(`/api/chat/session/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: exchange.map(toStoredMessage), title: titlePart?.data.title }),
    })
    if (response.ok) {
      // Lets the session history pick up a new or updated session without polling.
      window.dispatchEvent(new CustomEvent(SESSION_SAVED_EVENT, { detail: conversationId }))
    }
  } catch (error) {
    console.error('[ChatPersistence] Failed to save messages:', error)
  }
}
