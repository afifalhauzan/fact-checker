/**
 * Chart Data Types for JSON-based chart rendering
 * Native React charts using shadcn/ui components
 */

import type { ChartConfig } from "@/components/ui/chart";

export interface ChartColumn {
  name: string;
  display_name: string;
  base_type: string;
  database_type?: string;
  semantic_type?: string;
  effective_type?: string;
  unit?: string;
  source?: string;
  description?: string;
  fingerprint?: {
    global?: {
      "distinct-count"?: number;
      "nil%"?: number;
    };
    type?: {
      [key: string]: {
        earliest?: string;
        latest?: string;
      };
    };
  };
  // Additional metabase-specific fields
  [key: string]: any;
}

export interface ChartMetadata {
  id: number | null;
  name: string;
  display_name: string;
  base_type: string;
}

export interface VisualConfig {
  chart_type: "bar" | "line" | "area" | "pie" | "scatter" | "table" | "ranking" | string; // Allow custom chart types
  title: string;
  x_axis?: string;
  y_axis?: string;
  format?: "currency" | "percentage" | "number" | "decimal" | string;
}

export interface ChartData {
  cols: ChartColumn[];
  rows: Array<Array<string | number>>;
}

export interface ChartEmbedData {
  id: string;
  metadata: ChartMetadata[];
  visual_config: VisualConfig;
  chart_data?: ChartData; // compatibility with older format where chart_data is nested, but can also be top-level for easier access
  cols?: ChartColumn[]; // Optional top-level cols for easier access
  rows?: Array<Array<string | number>>; // Optional top-level rows for easier access
}

export interface UnifiedChartData {
  type: "data-chart";
  data: ChartEmbedData;
}

export interface ChartItem {
  id: string;
  messageId?: string; // ID of the message that generated this chart
  chartData: ChartEmbedData | DashboardEmbedData;
  title: string;
  conversationId: string;
  timestamp: number;
}

export type ChartType = VisualConfig["chart_type"];

// Processed chart data for recharts consumption
export interface ProcessedChartData {
  data: Array<Record<string, any>>;
  config: ChartConfig;
  xAxisKey: string;
  yAxisKeys: string[];
  chartType: ChartType;
  title: string;
  format: VisualConfig["format"];
  cols?: ChartColumn[];
}

// Dashboard types
export interface KPIScorecard {
  title: string;
  value: string | number;
  trend_status: "positive" | "negative" | "neutral";
  trend_percentage: string | number;
}

export interface DashboardChartData {
  data: Array<Record<string, any>>;
  title: string;
  chart_type: ChartType;
}

export interface DashboardData {
  type: "dashboard";
  rows: Array<Record<string, any>>;
  cols: ChartColumn[];
  dashboard_title: string;
  period_text: string;
  main_chart: DashboardChartData;
  kpi_scorecards: KPIScorecard[];
  ai_insights: string[];
  breakdown_chart: DashboardChartData;
}

export interface DashboardEmbedData {
  id: string;
  metadata: ChartMetadata[];
  visual_config: VisualConfig;
  chart_data: DashboardData;
}