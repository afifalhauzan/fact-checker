"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useGraphHistoryStore, isChartItem } from "@/lib/graph-history-store";
import { useInteractionStore } from "@/lib/interaction-store";
import { useConversationStore } from "@/lib/conversation-store";
import { useChatHistory } from "@/hooks/use-chat-history";
import { extractChartsFromHistoryMessages, type HistoryChartItem } from "@/utils/chart-processor";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { History, RotateCcw, Trash2 } from "lucide-react";
import { Riple } from "react-loading-indicators";

export function GraphHistoryModal() {
  const [hasMounted, setHasMounted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { conversationId } = useConversationStore();
  const { messages, fetchHistory } = useChatHistory();
  const {
    isHistoryModalOpen,
    setHistoryModalOpen,
    restoreFromHistory,
    removeFromHistory,
    appendHistoryCharts,
  } = useGraphHistoryStore();
  
  // Subscribe directly to chartHistory from store
  const chartHistory = useGraphHistoryStore((state) => {
    // console.log('[GraphHistoryModal] chartHistory selector called, current state has', state.chartHistory.length, 'charts:', state.chartHistory.map(c => ({ id: c.id, messageId: c.messageId, title: c.title })));
    return state.chartHistory;
  });

  // Get interaction store for scroll-to-context
  const { triggerScrollToMessage } = useInteractionStore();

  // Prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // When modal opens: fetch full history once.
  useEffect(() => {
    if (!hasMounted || !conversationId || !isHistoryModalOpen) {
      return;
    }

    const loadAllHistory = async () => {
      setIsLoading(true);
      try {
        // Fetch complete chat history from backend
        await fetchHistory(conversationId);
        console.log('[GraphHistoryModal] Complete history fetched');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllHistory();
  }, [hasMounted, conversationId, isHistoryModalOpen, fetchHistory]);

  // Extract & append all charts from fetched messages to store
  // This runs whenever messages change (after fetchHistory)
  useEffect(() => {
    if (!messages.length || !conversationId) return;

    const chartsFromMessages = extractChartsFromHistoryMessages(messages);
    if (chartsFromMessages.length > 0) {
      console.log('[GraphHistoryModal] Extracted charts:', chartsFromMessages.map(c => ({ id: c.id, messageId: c.messageId, title: c.title })));
      
      appendHistoryCharts(
        chartsFromMessages.map(chart => ({
          id: chart.id,
          chartData: chart.chartData,
          title: chart.title,
          conversationId,
          messageId: chart.messageId, // Preserve messageId for scroll-to-context
          timestamp: Date.now(),
        }))
      );
      console.log('[GraphHistoryModal] Added', chartsFromMessages.length, 'charts to store');
    }
  }, [messages, conversationId, appendHistoryCharts]);

  // Read directly from chartHistory state - automatically re-renders when store updates
  const historyItems = useMemo(() => {
    if (!conversationId) return [];
    
    const items = chartHistory
      .filter(chart => chart.conversationId === conversationId)
      .map((chart): HistoryChartItem => ({
        id: chart.id,
        messageId: chart.messageId || '',
        title: chart.title || 'Chart',
        chartType: 'chart',
        timestamp: new Date(chart.timestamp).toISOString(),
        columnCount: 0,
        chartData: chart.chartData, // Preserve full chart data
      }))
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
    
    console.log('[GraphHistoryModal] History items ready for display:', items.map(i => ({ id: i.id, messageId: i.messageId, title: i.title })));
    return items;
  }, [conversationId, chartHistory]);

  const handleDelete = (messageId: string) => {
    setDeleteTarget(messageId);
  };
  // yeah this should use messageId as the identifier for deletion, not chart id, because we want to remove the chart from history based on the message that generated it. 
  // The restoreFromHistory function will handle restoring the correct chart based on the messageId when the user clicks "Kembalikan". So we need to use messageId as the identifier for both deleting and restoring charts in the history modal.

  const confirmDelete = () => {
    if (deleteTarget) {
      removeFromHistory(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleSelectChart = (item: HistoryChartItem) => {
    // Update the active chart
    restoreFromHistory(item.id);

    // Trigger scroll to the message that generated this chart
    if (item.messageId) {
      triggerScrollToMessage(item.messageId);
    }

    // Close modal immediately for seamless navigation
    setHistoryModalOpen(false);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (!hasMounted || !conversationId) {
    return null;
  }

  if (!isHistoryModalOpen) return null;

  return (
    <>
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Riwayat Grafik"
        description={`${historyItems.length} grafik${historyItems.length !== 1 ? 's' : ''} dalam percakapan ini`}
      >
        <div className="flex flex-col justify-center items-center h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Riple color="#3c6bd6" size="small" text="" textColor="" />
              </div>
              <p className="text-md text-muted-foreground">Memuat riwayat...</p>
            </div>
          ) : historyItems.length === 0 ? ( 
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <History className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">Belum Ada Riwayat</h3>
              <p className="text-sm text-muted-foreground">
                Buat grafik di percakapan ini untuk melihatnya di sini.
              </p>
            </div>
          ) : (
            <div className="h-full justify-start items-start space-y-3">
              {historyItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-1 rounded bg-accent/50 text-accent-foreground font-medium uppercase">
                        {item.chartType}
                      </span>
                      <h4 className="font-medium text-foreground group-hover:text-accent-foreground transition-colors">
                        {item.title || `Graph ${index + 1}`}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(item.timestamp)} • {item.columnCount} kolom
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleSelectChart(item)}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      title="Restore this graph"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Kembalikan
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      title="Hapus dari riwayat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus Grafik dari Riwayat"
        description="Apakah Anda yakin ingin menghapus grafik ini dari riwayat? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive={true}
      />
    </>
  );
}