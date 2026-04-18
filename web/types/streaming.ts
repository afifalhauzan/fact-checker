/**
 * AI SDK v5 Custom Data Types for Streaming
 * Defines type-safe custom data parts for chart, dashboard, and agentic demo streaming
 */

import type { UIMessage } from 'ai';
import type { ChartEmbedData, DashboardEmbedData } from './chart';

export interface ChartDataPart {
  id: string;
  metadata: Array<{
    id: number | null;
    name: string;
    display_name: string;
    base_type: string;
  }>;
  visual_config: {
    chart_type: "bar" | "line" | "area" | "pie" | "scatter" | "table";
    title: string;
    x_axis?: string;
    y_axis?: string;
    format?: "currency" | "percentage" | "number" | "decimal" | string;
  };
  chart_data: {
    cols: Array<any>;
    rows: Array<Array<string | number>>;
  };
}

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
  | { type: 'data-json'; data: ChartDataPart }
  | { type: 'data-chart'; data: ChartDataPart | string }
  | { type: 'data-dashboard'; data: DashboardEmbedData | string }
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

// Define our custom UIMessage type with chart, dashboard, and agentic demo support
export type MetabotUIMessage = Omit<UIMessage<any, any>, 'parts'> & {
  parts: MetabotUIMessagePart[];
};

// Type guard to check if a message has chart or dashboard data
export function hasChartDataPart(message: MetabotUIMessage): boolean {
  if (!message.parts || !Array.isArray(message.parts)) {
    return false;
  }
  
  return message.parts.some(part => 
    (part.type === 'data-json' || part.type === 'data-chart' || part.type === 'data-dashboard') && 
    part.data
  );
}

// Extract chart or dashboard data from message parts (returns either type)
export function extractChartDataFromMessage(message: MetabotUIMessage): ChartEmbedData | DashboardEmbedData | null {
  if (!message.parts || !Array.isArray(message.parts)) {
    return null;
  }
  
  // Look for either data-chart or data-dashboard parts
  const dataPart = message.parts.find(p => 
    (p.type === 'data-chart' || p.type === 'data-dashboard') && p.data
  );
  
  if (!dataPart) {
    return null;
  }

  try {
    // Type assertion for custom data part
    const customPart = dataPart as any;
    
    if (!customPart.data) {
      console.warn('[STREAMING] Data part exists but data is empty');
      return null;
    }

    console.log('[STREAMING] Found', dataPart.type, 'part:', customPart);
    
    // Parse stringified data with whitespace trim
    const parsedData = typeof customPart.data === 'string' 
      ? JSON.parse((customPart.data as string).trim()) 
      : customPart.data;

    console.log('[STREAMING] Parsed data:', parsedData);
    
    // Validate the parsed data has required structure
    if (!parsedData || typeof parsedData !== 'object') {
      console.warn('[STREAMING] Parsed data is not an object:', parsedData);
      return null;
    }

    // Check for dashboard data (type: "dashboard" at root level)
    const isDashboardType = parsedData.type === 'dashboard';
    
    // Check for internal dashboard structure (chart_data.type === 'dashboard')
    const hasInternalDashboard = 'chart_data' in parsedData &&
                                 parsedData.chart_data &&
                                 parsedData.chart_data.type === 'dashboard';
    
    // Check for chart data (cols and rows - backend sends flat structure now)
    const hasChartData = 'cols' in parsedData && 'rows' in parsedData;
    const hasVisualConfig = 'visual_config' in parsedData;

    // If it's a dashboard (either at root or in chart_data), wrap in DashboardEmbedData structure
    if (isDashboardType || hasInternalDashboard) {
      console.log('[STREAMING] Detected dashboard data, wrapping for DashboardEmbedData');
      
      // If dashboard is at root level, it needs to be wrapped in chart_data
      if (isDashboardType) {
        const dashboardTitle = parsedData.dashboard_title || `Dashboard-${Date.now()}`;
        const sanitizedId = dashboardTitle.replace(/\s+/g, '-').toLowerCase().slice(0, 50);
        
        const wrappedDashboard: DashboardEmbedData = {
          id: `dashboard-${sanitizedId}`,
          metadata: [],
          visual_config: {
            chart_type: 'table',
            title: dashboardTitle
          },
          chart_data: parsedData // parsedData already has type: 'dashboard' and all required fields
        };
        
        console.log('[STREAMING] Wrapped root-level dashboard:', wrappedDashboard);
        return wrappedDashboard;
      }
      
      // If internal dashboard structure (chart_data.type === 'dashboard')
      if (hasInternalDashboard) {
        const dashboardTitle = parsedData.chart_data.dashboard_title || `Dashboard-${Date.now()}`;
        const sanitizedId = dashboardTitle.replace(/\s+/g, '-').toLowerCase().slice(0, 50);
        
        const wrappedDashboard: DashboardEmbedData = {
          id: `dashboard-${sanitizedId}`,
          metadata: parsedData.metadata || [],
          visual_config: {
            chart_type: 'bar',
            title: dashboardTitle
          },
          chart_data: parsedData.chart_data
        };
        
        console.log('[STREAMING] Wrapped internal dashboard:', wrappedDashboard);
        return wrappedDashboard;
      }
    }

    // Handle chart data
    if (!hasChartData || !hasVisualConfig) {
      console.warn('[STREAMING] Chart data missing required fields (cols/rows and visual_config):', {
        hasChartData,
        hasVisualConfig,
        parsedData
      });
      return null;
    }

    // Wrap chart data into ChartEmbedData structure
    const normalizedChart = {
      id: parsedData.id,
      metadata: parsedData.metadata || [],
      visual_config: parsedData.visual_config,
      chart_data: {
        cols: parsedData.cols,
        rows: parsedData.rows
      }
    };

    // Valid chart data - return as ChartEmbedData
    return normalizedChart as ChartEmbedData;
    
  } catch (err) {
    console.warn('[STREAMING] Error extracting data from message:', err);
    return null;
  }
}

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