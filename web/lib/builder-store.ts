/**
 * Builder State Store
 * Manages builder UI state including view mode and flow completion
 */

import { create } from 'zustand';

export type ViewMode = 'dashboard' | 'selection';

interface BuilderState {
  viewMode: ViewMode;
  isFlowComplete: boolean;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  completeFlow: () => void;
  resetFlow: () => void;
}

/**
 * Global builder store for managing view mode and flow state
 * Enables automatic navigation from selection → dashboard after completion
 */
export const useBuilderStore = create<BuilderState>((set) => ({
  viewMode: 'dashboard',
  isFlowComplete: false,

  setViewMode: (mode: ViewMode) => {
    console.log('[BuilderStore] Setting view mode to:', mode);
    set({ viewMode: mode });
  },

  completeFlow: () => {
    console.log('[BuilderStore] Flow completed, switching to dashboard');
    set({
      isFlowComplete: true,
      viewMode: 'dashboard',
    });
  },

  resetFlow: () => {
    set({ isFlowComplete: false });
  },
}));
