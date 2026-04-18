/**
 * Iframe Store
 * Manages the state of dashboard/chart data displayed in the iframe viewer
 */

import { create } from 'zustand';
import type { ChartEmbedData } from '@/types/chart';

export interface IframeViewData {
  type: 'json' | 'iframe';
  payload: ChartEmbedData | string;
}

interface IframeState {
  currentView: IframeViewData | null;
  isVisible: boolean;

  // Actions
  setView: (view: IframeViewData) => void;
  setVisible: (visible: boolean) => void;
  reset: () => void;
}

/**
 * Global iframe store for dashboard viewer state
 * Manages what chart/view is currently displayed in the sidebar
 */
export const useIframeStore = create<IframeState>((set) => ({
  currentView: null,
  isVisible: false,

  setView: (view: IframeViewData) => {
    console.log('[IframeStore] Setting view:', view.type);
    set({
      currentView: view,
      isVisible: true,
    });
  },

  setVisible: (visible: boolean) => {
    set({ isVisible: visible });
  },

  reset: () => {
    set({
      currentView: null,
      isVisible: false,
    });
  },
}));
