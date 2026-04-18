import React from 'react';

interface Field {
  id: number;
  name: string;
  display_name?: string;
}

interface StepFieldsSelectionProps {
  selectedMetrics: string[];
  selectedDimensions: string[];
  metrics: Field[];
  dimensions: Field[];
  loading: boolean;
  error: string | null;
  onMetricToggle: (name: string) => void;
  onDimensionToggle: (name: string) => void;
}

export function StepFieldsSelection({
  selectedMetrics,
  selectedDimensions,
  metrics,
  dimensions,
  loading,
  error,
  onMetricToggle,
  onDimensionToggle,
}: StepFieldsSelectionProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Metrics
        </p>
        <div className="space-y-2">
          {metrics.map((field) => (
            <label key={field.id} className="flex items-center gap-2 rounded border border-border p-2 text-sm">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(field.name)}
                onChange={() => onMetricToggle(field.name)}
              />
              <span>{field.display_name || field.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Dimensions
        </p>
        <div className="space-y-2">
          {dimensions.map((field) => (
            <label key={field.id} className="flex items-center gap-2 rounded border border-border p-2 text-sm">
              <input
                type="checkbox"
                checked={selectedDimensions.includes(field.name)}
                onChange={() => onDimensionToggle(field.name)}
              />
              <span>{field.display_name || field.name}</span>
            </label>
          ))}
        </div>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Memuat fields...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
