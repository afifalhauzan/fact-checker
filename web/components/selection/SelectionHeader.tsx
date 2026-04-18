import React from 'react';
import { STEP_CONFIGS } from '@/config/selection.config';

interface SelectionHeaderProps {
  step: number;
}

export function SelectionHeader({ step }: SelectionHeaderProps) {
  const currentConfig = STEP_CONFIGS[step];

  if (!currentConfig) {
    return null;
  }

  return (
    <div className="mb-8">
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground">
        {step}. {currentConfig.title}
      </h1>
      <p className="max-w-lg leading-relaxed text-muted-foreground">
        {currentConfig.subtitle}
      </p>
    </div>
  );
}
