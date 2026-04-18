import { create } from 'zustand';

interface ConversationState {
  conversationId: string | null;
  isInitializing: boolean;
  error: string | null;
  hasMessages: boolean;
  
  // Actions
  setConversationId: (id: string) => void;
  setInitializing: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMessages: (hasMessages: boolean) => void;
  reset: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversationId: null,
  isInitializing: false, // Changed to false - let Chat component handle initialization
  error: null,
  hasMessages: false,
  
  setConversationId: (id: string) => {
    set({ conversationId: id });
    // Update URL when conversation ID changes
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('conversation_id', id);
      window.history.replaceState({}, '', url.toString());
    }
  },
  
  setInitializing: (loading: boolean) => set({ isInitializing: loading }),
  setError: (error: string | null) => set({ error }),
  setHasMessages: (hasMessages: boolean) => set({ hasMessages }),
  
  reset: () => {
    set({ 
      conversationId: null, 
      isInitializing: false, // Don't auto-set to true, let Chat component handle
      error: null,
      hasMessages: false
    });
    // Clear URL parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('conversation_id');
      window.history.replaceState({}, '', url.toString());
    }
  },
}));