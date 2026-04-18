"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { FullScreen, useFullScreenHandle } from "react-full-screen"
import { Maximize2, Minimize2 } from "lucide-react"

import { cn } from "@/utils/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer
} from "@/components/ui/chart"
import { parseChartData, extractDashboardData } from "@/utils/chart-processor"
import { renderChart } from "@/utils/chart-renderer"
import { DashboardRenderer } from "./DashboardRenderer"
import type { ChartEmbedData } from "@/types/chart"

export type { ChartEmbedData, ChartType, ProcessedChartData } from '@/types/chart';

const chartVariants = cva(
  "w-full",
  {
    variants: {
      size: {
        default: "h-[400px]",
        sm: "h-[300px]",
        lg: "h-[500px]",
        xl: "h-[600px]",
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
)

interface ChartRendererProps extends VariantProps<typeof chartVariants> {
  data: ChartEmbedData;
  className?: string;
}

export function ChartRenderer({ data, size, className }: ChartRendererProps) {
  const fshandle = useFullScreenHandle();
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  // Early return if data is not provided
  if (!data) {
    console.error('[ChartRenderer] No data provided to ChartRenderer');
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Chart Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Tidak ada data grafik yang tersedia</div>
        </CardContent>
      </Card>
    );
  }

  // MUST call all hooks unconditionally at the top of the component
  // Check if this is dashboard data
  const dashboardData = React.useMemo(() => extractDashboardData(data), [data]);

  const processedData = React.useMemo(() => {
    try {
      return parseChartData(data);
    } catch (error) {
      console.error('[ChartRenderer] Error processing chart data:', error);
      return null;
    }
  }, [data]);

  // NOW we can do conditional returns after all hooks are called
  if (dashboardData) {
    return <DashboardRenderer data={dashboardData} className={className} />;
  }

  // Handle processing errors
  if (!processedData) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Error Menampilkan Grafik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Gagal memproses data grafik. Harap hubungi pengembang.</div>
        </CardContent>
      </Card>
    );
  }

  // Handle empty dataset
  if (!processedData.data || processedData.data.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            {processedData.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-lg">
              🔍
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">
              Tidak ada data yang cocok
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              Grafik tidak memiliki baris data untuk ditampilkan.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For ranking charts, skip ChartContainer (no Recharts needed, FULLY CUSTOM) and skip fixed height
  if (processedData.chartType === 'ranking') {
    return (
      <FullScreen handle={fshandle} onChange={setIsFullScreen} className="relative">
        <Card className={cn("w-full", className)}>
          {/* Fullscreen button */}
          <button
            onClick={() => isFullScreen ? fshandle.exit() : fshandle.enter()}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">
              {processedData.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="w-full">
              {renderChart(processedData)}
            </div>
          </CardContent>
        </Card>
      </FullScreen>
    );
  }

  return (
    <FullScreen handle={fshandle} onChange={setIsFullScreen} className="relative">
      <Card className={cn("w-full", className)}>
        {/* Fullscreen button */}
        <button
          onClick={() => isFullScreen ? fshandle.exit() : fshandle.enter()}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullScreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>

        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            {processedData.title}
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-muted-foreground px-6 mb-3">
          {/* TODO: show date ranges*/} 
        </p>
        <CardContent className="pb-3">
          <ChartContainer
            config={processedData.config}
            className={cn(chartVariants({ size }))}
          >
            {renderChart(processedData)}
          </ChartContainer>
        </CardContent>
      </Card>
    </FullScreen>
  );
}

export default ChartRenderer;

