"use client"

import React from "react"
import { FullScreen, useFullScreenHandle } from "react-full-screen"
import { Maximize2, Minimize2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartRenderer } from "./ChartRenderer"
import { AIInsights } from "./AIInsights"
import type { DashboardEmbedData, ChartEmbedData } from "@/types/chart"

interface DashboardRendererProps {
  data: DashboardEmbedData;
  className?: string;
}

// Helper function to convert dashboard chart to ChartEmbedData
const convertDashboardChartToEmbedData = (chart: any, dashboardId: string): ChartEmbedData => {
  // New backend format: cols/metadata/rows at root level with visual_config
  if (Array.isArray(chart.cols) && Array.isArray(chart.rows) && chart.visual_config) {
    return {
      id: chart.id || `${dashboardId}-${chart.visual_config?.title}`,
      metadata: chart.metadata || [],
      visual_config: chart.visual_config,
      chart_data: {
        cols: chart.cols,
        rows: chart.rows
      }
    };
  }

  // Fallback: assume already in ChartEmbedData format
  return chart as ChartEmbedData;
};

export function DashboardRenderer({ data, className }: DashboardRendererProps) {
  const fshandle = useFullScreenHandle();
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  if (!data?.chart_data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tidak ada data dashboard yang tersedia</p>
        </CardContent>
      </Card>
    );
  }

  const { chart_data } = data;
  const { dashboard_title, period_text, main_chart, kpi_scorecards, ai_insights, breakdown_chart } = chart_data;

  // Convert charts to ChartEmbedData format
  const mainChartEmbedData = React.useMemo(() => {
    if (!main_chart) return null;
    return convertDashboardChartToEmbedData(main_chart, data.id);
  }, [main_chart, data.id]);

  const breakdownChartEmbedData = React.useMemo(() => {
    if (!breakdown_chart) return null;
    return convertDashboardChartToEmbedData(breakdown_chart, data.id);
  }, [breakdown_chart, data.id]);

  return (
    <FullScreen handle={fshandle} onChange={setIsFullScreen} className="relative">
      <div className={`space-y-6 w-full ${className || ''}`}>
        {/* Fullscreen button */}
        <button
          onClick={() => isFullScreen ? fshandle.exit() : fshandle.enter()}
          className="absolute top-0 right-0 z-10 p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullScreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>

        {/* Dashboard Title */}
        <div className="pb-4">
          <h1 className="text-2xl font-bold text-foreground">{dashboard_title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{period_text}</p>
        </div>


        {/* Main Chart - Delegated to ChartRenderer */}
        {mainChartEmbedData && (
          <ChartRenderer data={mainChartEmbedData} />
        )}

        {/* Breakdown Chart */}
        {breakdownChartEmbedData && (
          <ChartRenderer data={breakdownChartEmbedData} />
        )}

        {/* AI Insights */}
        {ai_insights && ai_insights.length > 0 && (
          <AIInsights insights={ai_insights} />
        )}
      </div>
    </FullScreen>
  );
}
