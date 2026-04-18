/* THIS IS A CUSTOM UTILITY WRITTEN BY THE METABOT DEVELOPER, NOT PART OF THE AI SDK
  * Chart Renderer
  * Renders chart data using Recharts library
  * Supports bar, line, area, pie, scatter, ranking (CUSTOM), and table visualizations
  * Uses shadcn/ui components for tooltips and tables
  * Designed to be flexible and handle different chart types based on the provided config
  * If we want to add support for new chart types OR change the rendering logic, we can update the ChartRenderer without touching processing, streaming, or historical logic
  */

'use client'

import * as React from "react"
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Scatter,
  ScatterChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import {
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { formatNumber } from "./formatters"
import type { ProcessedChartData } from "@/types/chart"
import { CHART_COLORS } from "./chart-colors"

export const renderChart = (processedData: ProcessedChartData): React.ReactElement => {
  const { data, config, xAxisKey, yAxisKeys, chartType, format } = processedData;

  const commonProps = {
    data,
    margin: { top: 20, right: 30, left: 20, bottom: 5 }
  };

  switch (chartType) {
    case 'bar':
      return (
        <BarChart {...commonProps}>
          <CartesianGrid vertical={false} />
          <XAxis 
            dataKey={xAxisKey} 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatNumber(value, format)}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
          />
          {yAxisKeys.map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={config[key]?.color || CHART_COLORS[index % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      );

    case 'line':
      return (
        <LineChart {...commonProps}>
          <CartesianGrid vertical={false} />
          <XAxis 
            dataKey={xAxisKey} 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatNumber(value, format)}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
          />
          {yAxisKeys.map((key, index) => (
            <Line 
              key={key} 
              type="monotone" 
              dataKey={key} 
              stroke={config[key]?.color || CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      );

    case 'area':
      return (
        <AreaChart {...commonProps}>
          <CartesianGrid vertical={false} />
          <XAxis 
            dataKey={xAxisKey} 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatNumber(value, format)}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
          />
          {yAxisKeys.map((key, index) => (
            <Area 
              key={key} 
              type="monotone" 
              dataKey={key} 
              stroke={config[key]?.color || CHART_COLORS[index % CHART_COLORS.length]}
              fill={config[key]?.color || CHART_COLORS[index % CHART_COLORS.length]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      );

    case 'pie':
      // For pie charts, use the first numeric column
      const pieData = data.map((item, index) => ({
        name: String(item[xAxisKey]),
        value: Number(item[yAxisKeys[0]]),
        fill: CHART_COLORS[index % CHART_COLORS.length]
      }));

      return (
        <div className="flex flex-col gap-4">
          <div className="w-full h-[300px] flex items-center justify-center">
            <PieChart width={300} height={300}>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </div>
          
          {/* Legend grid with color blocks and values */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {pieData.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
                <div 
                  className="h-3 w-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: entry.fill }}
                  title={entry.name}
                />
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="text-xs font-medium truncate text-foreground">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{formatNumber(entry.value, format)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'scatter':
      return (
        <ScatterChart {...commonProps}>
          <CartesianGrid vertical={false} />
          <XAxis 
            dataKey={xAxisKey} 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatNumber(value, format)}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatNumber(value, format)}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
          />
          {yAxisKeys.map((key, index) => (
            <Scatter 
              key={key} 
              name={String(config[key]?.label || key)}
              dataKey={key} 
              fill={config[key]?.color || CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </ScatterChart>
      );

    case 'ranking':
      // Ranking/leaderboard visualization
      return renderRankingChart(data, xAxisKey, yAxisKeys, format);

    case 'table':
      return (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {processedData.cols?.map((col) => (
                  <TableHead key={col.name} className="font-semibold">
                    {col.display_name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {processedData.cols?.map((col) => {
                    const value = row[col.name];
                    const formatted = value == null ? '—' : String(value);
                    
                    return (
                      <TableCell key={`${rowIndex}-${col.name}`}>
                        {formatted}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );

    default:
      return <div className="text-muted-foreground">Unsupported chart type: {chartType}</div>;
  }
};

// Ranking chart renderer (leaderboard visualization)
const renderRankingChart = (
  data: Array<Record<string, any>>,
  labelKey: string,
  valueKeys: string[],
  format?: string
): React.ReactElement => {
  // Use the last value key (typically the aggregated metric like sum, count, average)
  const valueKey = valueKeys[valueKeys.length - 1];
  
  const rankingRows = data
    .map((item) => {
      const rawValue = item[valueKey];
      const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue ?? 0);
      return {
        label: String(item[labelKey] ?? "-"),
        value: Number.isFinite(numericValue) ? numericValue : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  const maxValue = rankingRows[0]?.value ?? 0;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(Math.round(value * 100) / 100);
  };

  return (
    <div className="w-full space-y-3">
      {rankingRows.map((row, index) => {
        const widthPercent = maxValue > 0 ? Math.max((row.value / maxValue) * 100, 4) : 4;

        return (
          <div key={`${row.label}-${index}`} className="rounded-lg border border-border/60 bg-background p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground">
                  {index + 1}
                </span>
                <span className="truncate text-sm font-medium text-foreground">{row.label}</span>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">{formatValue(row.value)}</span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-accent/60">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {widthPercent.toFixed(2)}% dari maksimum
            </div>
          </div>
        );
      })}
    </div>
  );
};
