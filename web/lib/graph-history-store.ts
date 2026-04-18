import { create } from 'zustand';
import type { ChartEmbedData, DashboardEmbedData, ChartItem } from '@/types/chart';

// Only chart items are supported now
export type GraphItem = ChartItem;

// Type guard functions
export function isChartItem(item: GraphItem): item is ChartItem {
  return 'chartData' in item;
}

interface GraphHistoryState {
  // Chart-only state
  currentChart: ChartItem | null;
  chartHistory: ChartItem[];
  isHistoryModalOpen: boolean;

  // Chart actions
  setCurrentChart: (chart: Omit<ChartItem, 'timestamp'>) => void;
  clearCurrentChart: () => void;
  
  // Unified actions
  addToHistory: (item: ChartItem) => void;
  appendHistoryCharts: (items: ChartItem[]) => void;
  removeFromHistory: (itemId: string) => void;
  restoreFromHistory: (itemId: string) => void;
  clearHistory: () => void;
  clearConversationHistory: (conversationId: string) => void;
  setHistoryModalOpen: (isOpen: boolean) => void;
  
  // Getters
  getHistoryForConversation: (conversationId: string) => GraphItem[];
  getCurrentItem: () => GraphItem | null;
}

// Helper function to keep history logic DRY and immutable
const pushToChartHistory = (history: ChartItem[], newChart: ChartItem) => {
  if (history.some((item) => item.id === newChart.id)) return history;
  return [newChart, ...history].slice(0, 20);
};
export const useGraphHistoryStore = create<GraphHistoryState>()((set, get) => ({
      currentChart: null,
      chartHistory: [],
      isHistoryModalOpen: false,

      setCurrentChart: (chart) => set((state) => {
        const newChart = { ...chart, timestamp: Date.now() };
        return {
          currentChart: newChart,
          chartHistory: state.currentChart 
            ? pushToChartHistory(state.chartHistory, state.currentChart)
            : state.chartHistory
        };
      }),

      clearCurrentChart: () => set({ currentChart: null }),

      // Add chart to history
      addToHistory: (item) => set((state) => ({
        chartHistory: pushToChartHistory(state.chartHistory, item)
      })),

      // Append multiple charts from fetched history messages, avoiding duplicates.
      appendHistoryCharts: (items) => set((state) => {
        console.log('[GraphHistoryStore] appendHistoryCharts called with items:', items.map(i => ({ id: i.id, messageId: i.messageId, title: i.title })));
        
        // Create a map of existing charts for easy lookup and updates
        const chartMap = new Map(state.chartHistory.map(c => [c.id, c]));
        
        // Update or add new charts - if a chart with same ID exists, merge the new data
        // This is important for updating messageId when the same chart is encountered again
        const updates = [];
        for (const item of items) {
          if (chartMap.has(item.id)) {
            // Chart already exists - update it with new data (especially messageId)
            const existing = chartMap.get(item.id)!;
            const merged = { ...existing, ...item, messageId: item.messageId || existing.messageId };
            chartMap.set(item.id, merged);
            updates.push('updated (added messageId)');
            console.log('[GraphHistoryStore] Updated existing chart:', { id: item.id, hadMessageId: !!existing.messageId, nowHasMessageId: !!merged.messageId });
          } else {
            // Brand new chart
            chartMap.set(item.id, item);
            updates.push('added new');
          }
        }
        
        console.log('[GraphHistoryStore] Updates performed:', updates);
        const updatedHistory = Array.from(chartMap.values());
        console.log('[GraphHistoryStore] Updated chartHistory now has:', updatedHistory.map(c => ({ id: c.id, messageId: c.messageId, title: c.title })));
        
        return {
          chartHistory: updatedHistory
        }
      }),

      removeFromHistory: (itemId) => set((state) => ({
        chartHistory: state.chartHistory.filter((chart) => chart.id !== itemId)
      })),

      restoreFromHistory: (itemId) => set((state) => {
        console.log('[GraphHistoryStore] restoreFromHistory called for itemId:', itemId);
        console.log('[GraphHistoryStore] Current chartHistory:', state.chartHistory.map(c => ({ id: c.id, messageId: c.messageId, title: c.title })));
        
        const targetChart = state.chartHistory.find((chart) => chart.id === itemId);
        console.log('[GraphHistoryStore] Found targetChart:', targetChart ? { id: targetChart.id, messageId: targetChart.messageId, title: targetChart.title } : 'NOT FOUND');
        
        if (targetChart) {
          const historyWithoutTarget = state.chartHistory.filter((chart) => chart.id !== itemId);
          return {
            currentChart: targetChart,
            chartHistory: state.currentChart 
              ? pushToChartHistory(historyWithoutTarget, state.currentChart)
              : historyWithoutTarget,
            isHistoryModalOpen: false
          };
        }
        return state;
      }),

      clearHistory: () => set({
        chartHistory: [],
        currentChart: null
      }),

      clearConversationHistory: (conversationId) => set((state) => ({
        chartHistory: state.chartHistory.filter(
          (chart) => chart.conversationId !== conversationId
        ),
      })),

      setHistoryModalOpen: (isOpen) => set({ isHistoryModalOpen: isOpen }),

      // Getters
      getHistoryForConversation: (conversationId) => {
        const state = get();
        return state.chartHistory
          .filter((chart) => chart.conversationId === conversationId)
          .sort((a, b) => b.timestamp - a.timestamp);
      },

      getCurrentItem: () => {
        const state = get();
        return state.currentChart;
      },
    }));