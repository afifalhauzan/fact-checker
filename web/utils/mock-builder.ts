/**
 * Mock Dashboard Builder
 * Generates ChartEmbedData from selection configuration
 */

import type { ChartEmbedData } from '@/types/chart';

export interface SelectionConfig {
  dataContext: string | null;
  timeRange: string | null;
  outputType: string | null;
  visualization: string | null;
  title?: string;
}

/**
 * Maps selection config to mock chart data structure
 * Follows the ChartEmbedData format from mock-stream.ts
 */
export function generateMockDashboard(config: SelectionConfig): ChartEmbedData {
  const {
    dataContext = 'sales',
    timeRange = 'last-30-days',
    outputType = 'chart',
    visualization = 'bar',
    title: customTitle,
  } = config;

  // Map dataContext to friendly title
  const dataContextLabel: Record<string, string> = {
    sales: 'Penjualan',
    marketing: 'Pemasaran',
    hr: 'Sumber Daya Manusia',
  };

  // Map timeRange to label
  const timeRangeLabel: Record<string, string> = {
    'last-7-days': '7 hari terakhir',
    'last-30-days': '30 hari terakhir',
    'this-year': 'Tahun ini',
  };

  // Map visualization to chart_type
  const chartTypeMap: Record<string, 'bar' | 'line' | 'pie' | 'area'> = {
    bar: 'bar',
    line: 'line',
    pie: 'pie',
  };

  // Use custom title if provided, otherwise generate from config
  const title = customTitle || `${dataContextLabel[dataContext] || 'Data'} - ${timeRangeLabel[timeRange] || 'Periode'}`;
  const chartType = chartTypeMap[visualization] || 'bar';

  // Generate mock data based on chart type
  const mockData = generateMockData(chartType, dataContext as string);

  return {
    id: `mock-chart-${Date.now()}`,
    metadata: [
      {
        id: 1,
        name: 'category',
        display_name: 'Kategori',
        base_type: 'type/Text',
      },
      {
        id: 2,
        name: 'value',
        display_name: 'Nilai',
        base_type: 'type/Integer',
      },
    ],
    visual_config: {
      chart_type: chartType,
      title: title,
      x_axis: 'Kategori',
      y_axis: 'Nilai',
      format: 'number',
    },
    cols: [
      {
        name: 'category',
        display_name: 'Kategori',
        base_type: 'type/Text',
      },
      {
        name: 'value',
        display_name: 'Nilai',
        base_type: 'type/Integer',
      },
    ],
    rows: mockData,
  };
}

/**
 * Generate mock data rows based on chart type and context
 */
function generateMockData(
  chartType: 'bar' | 'line' | 'pie' | 'area',
  dataContext: string
): Array<Array<string | number>> {
  const baselineMap: Record<string, number> = {
    sales: 85,
    marketing: 65,
    hr: 45,
  };

  const baseline = baselineMap[dataContext] || 70;

  if (chartType === 'pie') {
    // Pie chart - categories with percentages
    return [
      ['Kategori A', Math.round(baseline * 1.2)],
      ['Kategori B', Math.round(baseline * 0.9)],
      ['Kategori C', Math.round(baseline * 1.1)],
      ['Kategori D', Math.round(baseline * 0.8)],
    ];
  }

  // Bar, Line, Area - months with values
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month, idx) => [
    month,
    baseline + Math.round((Math.random() - 0.5) * 40 + idx * 5),
  ]);
}
