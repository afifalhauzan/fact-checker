import React from 'react';
import { Input } from '@/components/ui/input';

interface ChartOption {
  id: string;
  title: string;
}

interface TimeRangeOption {
  id: string;
  title: string;
}

interface StepVisualizationProps {
  chartType: string | null;
  timeRange: string | null;
  title: string;
  chartOptions: ChartOption[];
  timeRangeOptions: TimeRangeOption[];
  onChartTypeSelect: (id: string) => void;
  onTimeRangeSelect: (id: string) => void;
  onTitleChange: (value: string) => void;
}

export function StepVisualization({
  chartType,
  timeRange,
  title,
  chartOptions,
  timeRangeOptions,
  onChartTypeSelect,
  onTimeRangeSelect,
  onTitleChange,
}: StepVisualizationProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Jenis Visualisasi
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {chartOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChartTypeSelect(option.id)}
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                chartType === option.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background'
              }`}
            >
              {option.title}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Periode Waktu
        </label>
        <select
          value={timeRange ?? ''}
          onChange={(e) => onTimeRangeSelect(e.target.value)}
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">Pilih periode...</option>
          {timeRangeOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Judul Kustom (Opsional)
        </label>
        {/* Auto-fills once on load. User edits are preserved - won't be overridden by auto-generated title */}
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="event by id per month"
          className="mt-2"
        />
      </div>
    </div>
  );
}
