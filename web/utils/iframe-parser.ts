/**
 * Message Content Utilities for AI SDK v5
 * Simplified for extracting text content from UI messages
 */

/**
 * Extracts text content from a UI message object
 * Handles various message formats from AI SDK
 */
export function extractMessageContent(message: any): string {
  // Check for parts array first (AI SDK v5 format)
  if (Array.isArray(message.parts)) {
    return message.parts
      .map((part: any) => {
        if (part.type === 'text') {
          return part.text;
        }

        if (part.type === 'choice-summary') {
          return part.data?.selection ? `Anda memilih: ${part.data.selection}` : '';
        }

        return '';
      })
      .join('');
  }
  
  // Check for content array (AI SDK v4 format)
  if (Array.isArray(message.content)) {
    return message.content
      .filter((part: any) => part.type === "text")
      .map((part: any) => part.text)
      .join("");
  }
  
  // Check for direct string content
  if (typeof message.content === "string") {
    return message.content;
  }
  
  // Check for text property
  if (message.text) {
    return message.text;
  }

  return "";
}

