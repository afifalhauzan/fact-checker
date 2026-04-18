/**
 * Mock Stream to Message Converter
 * Converts mock SSE events to MetabotUIMessage format
 */

import { StreamEvent } from '@/types/mock-stream';
import { MetabotUIMessage } from '@/types/streaming';

/**
 * THIS IS A CUSTOM FUNCTION WRITTEN BY THE METABOT DEVELOPER, NOT PART OF THE AI SDK
 * Convert a sequence of mock stream events to a complete message
 * Accumulates events and builds the final message structure
 */
export function eventsToMessage(events: StreamEvent[]): MetabotUIMessage | null {
  if (!events.length) return null;

  // Find start event for messageId
  const startEvent = events.find(e => e.type === 'start');
  const messageId = startEvent?.type === 'start' ? startEvent.messageId : `msg-${Date.now()}`;

  const parts: any[] = [];
  let textContent = '';

  // Process all events
  for (const event of events) {
    if (event.type === 'text-delta') {
      textContent += event.delta;
    } else if (event.type === 'data-chart') {
      // If we have accumulated text, add it first
      if (textContent && !parts.some(p => p.type === 'text')) {
        parts.push({ type: 'text', text: textContent });
        textContent = '';
      }
      // Add chart data (already stringified)
      parts.push({
        type: 'data-chart',
        data: event.data,
      });
    } else if (event.type === 'data') {
      // If we have accumulated text, add it first
      if (textContent && !parts.some(p => p.type === 'text')) {
        parts.push({ type: 'text', text: textContent });
        textContent = '';
      }

      // Add data part based on kind
      if (event.data.kind === 'chart') {
        parts.push({
          type: 'data-chart',
          data: JSON.stringify(event.data.payload),
        });
      } else if (event.data.kind === 'insight') {
        parts.push({
          type: 'data-insight',
          data: event.data.payload,
        });
      } else if (event.data.kind === 'top5') {
        parts.push({
          type: 'data-top5',
          data: event.data.payload,
        });
      }
    }
  }

  // Add any remaining text
  if (textContent) {
    parts.push({ type: 'text', text: textContent });
  }

  // Build the message
  const message: MetabotUIMessage = {
    id: messageId,
    role: 'assistant',
    parts: parts.length > 0 ? parts : [{ type: 'text', text: '' }],
  };

  return message;
}
