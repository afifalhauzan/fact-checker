/* THIS IS A CUSTOM UTILITY WRITTEN BY THE METABOT DEVELOPER, NOT PART OF THE AI SDK
  * Chart Data Processor
  * Transforms raw chart data from backend into format suitable for shadcn/ui Chart components
  * Before passing to ChartRenderer, we convert the backend's cols/rows format into an array of objects with column names as keys
  * Handles date formatting, color assignment, and config generation
  * Designed to be flexible for different chart types and data structures
  * So if the backend changes how it sends chart data, we can update this processor without touching the rendering logic
  */

import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { CHART_COLORS } from "./chart-colors"
import type { ChartEmbedData, ProcessedChartData, UnifiedChartData, DashboardEmbedData, DashboardData } from "@/types/chart"
import type { ChartConfig } from "@/components/ui/chart"
import type { MetabotUIMessage } from "@/types/streaming"

// Type for history modal display
export interface HistoryChartItem {
  id: string;
  messageId: string;
  title: string;
  chartType: string;
  columnCount: number;
  timestamp: string;
  chartData: ChartEmbedData | DashboardEmbedData;
}

// Helper function to check if a column is a DateTime type
export const isDateTimeColumn = (column: any) => {
  return column.base_type === 'type/DateTime' || 
         column.name === 'CREATED_AT' ||
         column.display_name?.includes('Date') ||
         column.display_name?.includes('Month');
};

// Helper function to format date values
export const formatDateValue = (value: string | Date, column: any) => {
  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    // For months, show just the month name and year
    if (column.display_name?.includes('Month')) {
      return format(date, 'MMM yyyy', { locale: id });
    }
    // For regular dates, show day/month/year
    return format(date, 'dd/MM/yyyy', { locale: id });
  } catch (error) {
    console.warn('[ChartRenderer] Failed to parse date:', value, error);
    return String(value);
  }
};

// Main chart data processing function
export const processChartData = (data: ChartEmbedData): ProcessedChartData => {
  console.log('[ChartRenderer] Processing chart data:', data);
  
  // Defensive check for undefined data
  if (!data) {
    console.error('[ChartRenderer] Chart data is undefined');
    throw new Error('Chart data is required but was undefined');
  }
  
  // Defensive check for required properties
  if (!data.chart_data) {
    console.error('[ChartRenderer] Missing chart_data property. Available properties:', Object.keys(data));
    console.error('[ChartRenderer] Full data structure:', JSON.stringify(data, null, 2));
    throw new Error('Chart data must have chart_data property');
  }
  
  if (!data.chart_data.cols || !data.chart_data.rows) {
    console.error('[ChartRenderer] Invalid chart_data structure:', data.chart_data);
    throw new Error('Chart data must have cols and rows arrays');
  }
  
  if (!data.visual_config) {
    console.error('[ChartRenderer] Missing visual_config property:', data);
    throw new Error('Chart data must have visual_config property');
  }
  
  const { chart_data, visual_config } = data;
  
  // Convert rows to objects with column names as keys
  const processedData = chart_data.rows.map(row => {
    const obj: Record<string, any> = {};
    chart_data.cols.forEach((column, index) => {
      const rawValue = row[index];
      
      // Format date values if this is a DateTime column
      if (isDateTimeColumn(column) && rawValue) {
        obj[column.name] = formatDateValue(String(rawValue), column);
      } else {
        obj[column.name] = rawValue;
      }
    });
    return obj;
  });

  // Determine axis keys from metadata
  const xAxisKey = chart_data.cols[0]?.name || 'x';
  const yAxisKeys = chart_data.cols.slice(1).map(col => col.name);

  // Build shadcn chart config
  const config: ChartConfig = {};
  chart_data.cols.forEach((col, index) => {
    config[col.name] = {
      label: col.display_name,
      color: CHART_COLORS[index % CHART_COLORS.length]
    };
  });

  return {
    data: processedData,
    config,
    xAxisKey,
    yAxisKeys,
    chartType: visual_config.chart_type,
    title: visual_config.title,
    format: visual_config.format,
    cols: chart_data.cols
  };
};

// Single generic parser - handles ChartEmbedData format
// Backend sends chart data with cols/rows wrapped in chart_data property already
const isUnifiedChartData = (input: unknown): input is UnifiedChartData => {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as Record<string, unknown>;
  return (
    candidate.type === "data-chart" &&
    !!candidate.data &&
    typeof candidate.data === "object"
  );
};

// Type guard for dashboard data
const isDashboardData = (data: any): data is DashboardData => {
  return (
    data &&
    typeof data === "object" &&
    data.type === "dashboard" &&
    !!data.main_chart &&
    !!data.kpi_scorecards &&
    Array.isArray(data.ai_insights)
  );
};

// Type guard for dashboard embed data
export const isDashboardEmbedData = (input: unknown): input is DashboardEmbedData => {
  if (!input || typeof input !== "object") {
    return false;
  }

  const candidate = input as Record<string, unknown>;
  return (candidate as any).chart_data && isDashboardData((candidate as any).chart_data);
};

// Extract dashboard embed data from input
export const extractDashboardData = (input: unknown): DashboardEmbedData | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as Record<string, unknown>;
  
  // Check if it has dashboard structure
  if ((candidate as any).chart_data && isDashboardData((candidate as any).chart_data)) {
    return candidate as unknown as DashboardEmbedData;
  }

  return null;
};

export const parseChartData = (
  input: UnifiedChartData | ChartEmbedData
): ProcessedChartData => {
  let normalized: ChartEmbedData = isUnifiedChartData(input)
    ? (input as any).data
    : (input as ChartEmbedData);

  // Handle case where chart data has cols/rows at root level (new backend format for dashboards)
  // Convert to standard ChartEmbedData structure
  if ((normalized as any).cols && (normalized as any).rows && !(normalized as any).chart_data) {
    normalized = {
      id: (normalized as any).id,
      metadata: (normalized as any).metadata || [],
      visual_config: (normalized as any).visual_config || {
        chart_type: 'bar',
        title: 'Chart'
      },
      chart_data: {
        cols: (normalized as any).cols,
        rows: (normalized as any).rows
      }
    };
  }

  return processChartData(normalized);
};

/**
 * Extract chart items from parsed messages for history modal display
 * Finds all messages with chart data parts and converts them to HistoryChartItem format
 * @param messages - Array of MetabotUIMessage from parsing backend history
 * @returns Array of HistoryChartItem ready for display in modal
 */
export const extractHistoryChartItems = (messages: MetabotUIMessage[]): HistoryChartItem[] => {
  const items: HistoryChartItem[] = [];

  for (const msg of messages) {
    if (!msg.parts || !Array.isArray(msg.parts)) continue;

    const chartPart = msg.parts.find((part: any) => part.type === 'data-chart');
    if (!chartPart) continue;

    try {
      const customPart = chartPart as any;
      const chartData: ChartEmbedData =
        typeof customPart.data === 'string'
          ? JSON.parse(customPart.data)
          : customPart.data;

      if (!chartData?.id || !chartData?.visual_config) {
        continue;
      }

      const title = chartData.visual_config?.title || 'Untitled Chart';
      const chartType = chartData.visual_config?.chart_type || 'unknown';
      const columnCount = Array.isArray(chartData.chart_data?.cols)
        ? chartData.chart_data.cols.length
        : 0;

      items.push({
        id: chartData.id,
        messageId: msg.id,
        title,
        chartType,
        columnCount,
        timestamp: new Date().toISOString(),
        chartData,
      });
    } catch (err) {
      console.warn('[ChartProcessor] Error extracting chart from message:', err);
      continue;
    }
  }

  return items;
};

/**
 * Extract charts ONLY from newly fetched messages for pagination
 * Used when loading older messages to append charts to graph history store
 * Avoids re-parsing entire message history
 * @param newMessages - Only the newly fetched messages (from pagination)
 * @returns Charts ready to append to graph history store
 */
export const extractChartsFromNewMessages = (
  newMessages: MetabotUIMessage[]
): Array<{ id: string; chartData: ChartEmbedData; title: string; messageId: string }> => {
  const charts: Array<{ id: string; chartData: ChartEmbedData; title: string; messageId: string }> = []

  for (const msg of newMessages) {
    if (!msg.parts || !Array.isArray(msg.parts)) continue

    const chartPart = msg.parts.find((part: any) => part.type === 'data-chart')
    if (!chartPart) continue

    try {
      const customPart = chartPart as any
      const chartData: ChartEmbedData =
        typeof customPart.data === 'string'
          ? JSON.parse(customPart.data)
          : customPart.data

      if (!chartData?.id || !chartData?.visual_config) {
        continue
      }

      const isDashboard = (chartData.chart_data as any)?.type === 'dashboard'
      const title = isDashboard
        ? (chartData.chart_data as any)?.dashboard_title || chartData.visual_config.title || 'Dashboard'
        : chartData.visual_config.title || 'Untitled Chart'

      charts.push({
        id: chartData.id,
        chartData,
        title,
        messageId: msg.id,
      })

      console.log('[ChartProcessor] Found', isDashboard ? 'dashboard' : 'chart', 'in paginated message:', {
        chartId: chartData.id,
        title,
        isDashboard,
      })
    } catch (err) {
      console.warn('[ChartProcessor] Error parsing chart from paginated message:', err)
      continue
    }
  }

  return charts
}
