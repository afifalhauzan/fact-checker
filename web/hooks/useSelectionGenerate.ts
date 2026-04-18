/**
 * Selection Generate Hook
 * Handles dashboard generation via API
 */

import { useCallback, useState } from 'react';
import { useSelectionStore } from '@/lib/selection-store';
import { useIframeStore } from '@/lib/iframe-store';
import { useBuilderStore } from '@/lib/builder-store';

interface GeneratePayload {
  database_id: number;
  table_name: string;
  metrics: string[];
  dimensions: string[];
  chart_type: string;
  time_granularity?: string;
  custom_title?: string;
}

interface GenerateResponse {
  status: string;
  iframe_url?: string;
  message?: string;
  type?: 'json' | 'iframe';
  data?: unknown;
}

function normalizeIframeUrl(rawUrl: string): string {
  const backendPublicUrl = process.env.BACKEND_URL;
  if (!backendPublicUrl) {
    return rawUrl;
  }

  try {
    const iframeUrl = new URL(rawUrl);
    const backendUrl = new URL(backendPublicUrl);

    // Keep iframe port/path/query, only replace host/protocol from backend URL.
    iframeUrl.protocol = backendUrl.protocol;
    iframeUrl.hostname = backendUrl.hostname;

    return iframeUrl.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Hook for generating dashboard via API
 */
export function useSelectionGenerate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectionStore = useSelectionStore();
  const { setView } = useIframeStore();
  const { completeFlow } = useBuilderStore();

  /**
   * Generate dashboard from current selection
   */
  const generateDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build payload from store
      const payload: GeneratePayload = {
        database_id: selectionStore.databaseId || 0,
        table_name: selectionStore.selectedTable?.name || '',
        metrics: selectionStore.selectedMetrics,
        dimensions: selectionStore.selectedDimensions,
        chart_type: selectionStore.chartType || 'bar',
        ...(selectionStore.timeRange ? { time_granularity: selectionStore.timeRange } : {}),
        ...(selectionStore.title ? { custom_title: selectionStore.title } : {}),
      };

      console.log('[useSelectionGenerate] Generating dashboard with payload:', payload);

      // Validate payload
      if (!payload.database_id || !payload.table_name) {
        throw new Error('Database and table must be selected');
      }

      if (payload.metrics.length === 0) {
        throw new Error('At least one metric must be selected');
      }

      // Send request
      const response = await fetch('/api/selection/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `Failed to generate dashboard: ${response.statusText}`
        );
      }

      const result = (await response.json()) as GenerateResponse;

      console.log('[useSelectionGenerate] Dashboard generated:', result);

      if (result.status && result.status.toLowerCase() !== 'success') {
        throw new Error(result.message || `Generate failed with status: ${result.status}`);
      }

      if (result.iframe_url) {
        const iframeUrl = normalizeIframeUrl(result.iframe_url);
        setView({
          type: 'iframe',
          payload: iframeUrl,
        });
      } else if (result.type && result.data) {
        // Backward-compatible fallback for older response contract.
        setView({
          type: result.type,
          payload: result.data as any,
        });
      } else {
        throw new Error(result.message || 'Generate succeeded but iframe_url is missing');
      }

      // Mark flow as complete
      completeFlow();

      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useSelectionGenerate] Error generating dashboard:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  }, [
    selectionStore.databaseId,
    selectionStore.selectedTable,
    selectionStore.selectedMetrics,
    selectionStore.selectedDimensions,
    selectionStore.chartType,
    selectionStore.timeRange,
    selectionStore.title,
    setView,
    completeFlow,
  ]);

  return {
    generateDashboard,
    loading,
    error,
  };
}
