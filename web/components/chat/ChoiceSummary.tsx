"use client";

import { Check } from 'lucide-react';

interface ChoiceSummaryProps {
  selection: string;
}

export function ChoiceSummary({ selection }: ChoiceSummaryProps) {
  return (
    <div className="mt-3 inline-flex w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
        <Check className="h-3 w-3" />
      </span>
      <span className="truncate w-full">
        Anda memilih: <span className="font-medium text-foreground">{selection}</span>
      </span>
    </div>
  );
}