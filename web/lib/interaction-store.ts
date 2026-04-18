import { create } from 'zustand';

interface InteractionState {
  // Scroll-to-context state
  targetMessageId: string | null;
  scrollTrigger: number; // Timestamp/counter to force effect re-runs
  
  // Actions
  triggerScrollToMessage: (messageId: string) => void;
  clearTargetMessage: () => void;
}

/**
 * Global interaction store for bi-directional context linking
 * Manages scroll-to-context and highlight effects between Modal, Dashboard, and Chat
 */
export const useInteractionStore = create<InteractionState>((set) => ({
  targetMessageId: null,
  scrollTrigger: 0,

  /**
   * Trigger scroll to specific message
   * Updates both targetMessageId and scrollTrigger to ensure effect fires
   * even if user clicks the same chart multiple times
   */
  triggerScrollToMessage: (messageId: string) => {
    console.log('[InteractionStore] triggerScrollToMessage called:', { messageId, timestamp: Date.now() });
    set({
      targetMessageId: messageId,
      scrollTrigger: Date.now(), // Use timestamp as trigger
    });
  },

  /**
   * Clear target message after animation completes
   * Prevents accidental re-triggers during normal chat refreshes
   */
  clearTargetMessage: () => {
    set({
      targetMessageId: null,
    });
  },
}));
