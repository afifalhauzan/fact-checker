/**
 * Builder Preview Hook
 * Generates mock dashboard from selection and updates iframe store
 */

import { useCallback } from 'react';
import { useSelectionStore } from '@/lib/selection-store';
import { useIframeStore } from '@/lib/iframe-store';
import { useBuilderStore } from '@/lib/builder-store';
import { generateMockDashboard } from '@/utils/mock-builder';

export function useBuilderPreview() {
  const { dataContext, timeRange, outputType, visualization, title } = useSelectionStore();
  const { setView } = useIframeStore();
  const { completeFlow } = useBuilderStore();

  /**
   * Generate mock dashboard from current selection state
   * and push to iframe store for rendering
   */
  const generatePreview = useCallback(() => {
    console.log('[useBuilderPreview] Generating preview with config:', {
      dataContext,
      timeRange,
      outputType,
      visualization,
      title,
    });

    // Generate mock chart data
    const mockChart = generateMockDashboard({
      dataContext,
      timeRange,
      outputType,
      visualization,
      title,
    });

    // Push to iframe store
    setView({
      type: 'json',
      payload: mockChart,
    });

    // Mark flow as complete and switch to dashboard view
    completeFlow();

    console.log('[useBuilderPreview] Preview generated and stored');
  }, [dataContext, timeRange, outputType, visualization, title, setView, completeFlow]);

  return {
    generatePreview,
  };
}
