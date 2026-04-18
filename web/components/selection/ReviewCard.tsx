import React, { useState, useEffect } from 'react';
import { STEP_CONFIGS } from '@/config/selection.config';
import { useSelectionStore } from '@/lib/selection-store';
import { Input } from '@/components/ui/input';

interface ReviewCardProps {
  values: {
    dataContext: string | null;
    timeRange: string | null;
    outputType: string | null;
    visualization: string | null;
  };
}

/**
 * Component for displaying a single review card summary
 */
function ReviewSummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

/**
 * Generate an initial title from selected values
 */
function generateInitialTitle(values: ReviewCardProps['values']): string {
  const stepConfigs = STEP_CONFIGS;
  
  // Get titles from configs
  const dataContextTitle = stepConfigs[1].options.find(o => o.id === values.dataContext)?.title || 'Data';
  const timeRangeTitle = stepConfigs[2].options.find(o => o.id === values.timeRange)?.title || 'Periode';
  
  return `${dataContextTitle} - ${timeRangeTitle}`;
}

export function ReviewCard({ values }: ReviewCardProps) {
  const { title: storedTitle, setTitle } = useSelectionStore();
  const [titleInput, setTitleInput] = useState('');

  // Initialize title on mount or when values change
  useEffect(() => {
    if (storedTitle) {
      setTitleInput(storedTitle);
    } else {
      const initialTitle = generateInitialTitle(values);
      setTitleInput(initialTitle);
    }
  }, [values, storedTitle]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitleInput(newTitle);
    // Auto-save to store
    if (newTitle.trim()) {
      setTitle(newTitle.trim());
    }
  };

  const reviewSteps = [1, 2, 3, 4] as const;
  const valueKeys = ['dataContext', 'timeRange', 'outputType', 'visualization'] as const;

  return (
    <div className="space-y-6">
      {/* Title Form */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Nama Dashboard (Opsional)
          </label>
          <Input
            type="text"
            value={titleInput}
            onChange={handleTitleChange}
            placeholder="Masukkan nama untuk konfigurasi ini"
            className="mt-2"
          />
        </div>
      </div>

      {/* Review Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {reviewSteps.map((stepNumber, idx) => {
          const stepConfig = STEP_CONFIGS[stepNumber];
          const selectedValueId = values[valueKeys[idx]];

          // Find the option title from config by matching the selected id
          const selectedOption = stepConfig.options.find(
            (option) => option.id === selectedValueId
          );

          const displayValue = selectedOption?.title || 'Belum dipilih';

          return (
            <ReviewSummaryCard
              key={stepNumber}
              title={stepConfig.title}
              value={displayValue}
            />
          );
        })}
      </div>
    </div>
  );
}