/**
 * AI SDK v5 Custom Data Types for Streaming
 * Defines type-safe custom data parts for analysis and agentic demo streaming
 */

import type { UIMessage } from 'ai';
import type {
  AnalysisResult,
  Claim,
  Reference,
  Reasoning,
  Risk,
  Source,
} from '@/langchain/agents/analyzer/schema';

export interface InteractiveStepPart {
  stepId: string;
  question: string;
  options: string[];
}

export interface ChoiceSummaryPart {
  stepId: string;
  selection: string;
}

export type MetabotUIMessagePart =
  | { type: 'text'; text: string }
  | { type: 'data-analysis'; data: AnalysisResult | string }
  | { type: 'data-summary'; data: string }
  | { type: 'data-claims'; data: Claim[] }
  | { type: 'data-risks'; data: Risk[] }
  | { type: 'data-explanation'; data: string }
  | { type: 'data-references'; data: Reference[] }
  | { type: 'data-suggested-questions'; data: string[] }
  | { type: 'data-sources'; data: Source[] }
  | { type: 'data-reasoning'; data: Reasoning[] }
  | {
      type: 'data-notification';
      data: {
        message: string;
        level: 'info' | 'warning' | 'error' | 'success';
      };
    }
  | {
      type: 'interactive-step';
      data: InteractiveStepPart;
    }
  | {
      type: 'choice-summary';
      data: ChoiceSummaryPart;
    };

// Define our custom UIMessage type for analysis and interactive parts
export type MetabotUIMessage = Omit<UIMessage<any, any>, 'parts'> & {
  parts: MetabotUIMessagePart[];
};

// Type guard for notification parts
export function hasNotificationPart(message: MetabotUIMessage): boolean {
  if (!message.parts || !Array.isArray(message.parts)) {
    return false;
  }
  
  return message.parts.some(part => 
    part.type === 'data-notification' && 
    part.data && 
    typeof part.data === 'object' &&
    'message' in part.data
  );
}

// Extract notification from message parts
export function extractNotificationFromMessage(message: MetabotUIMessage): { message: string; level: string } | null {
  if (!message.parts || !Array.isArray(message.parts)) {
    return null;
  }
  
  for (const part of message.parts) {
    if (part.type === 'data-notification' && part.data) {
      return part.data as { message: string; level: string };
    }
  }
  
  return null;
}

export function hasInteractiveStepPart(message: MetabotUIMessage): boolean {
  if (!message.parts || !Array.isArray(message.parts)) {
    return false;
  }

  return message.parts.some(part => part.type === 'interactive-step');
}

export function getChoiceSummaryForStep(message: MetabotUIMessage, stepId: string): string | null {
  if (!message.parts || !Array.isArray(message.parts)) {
    return null;
  }

  const choicePart = message.parts.find(part => part.type === 'choice-summary' && part.data.stepId === stepId);
  return choicePart?.type === 'choice-summary' ? choicePart.data.selection : null;
}
