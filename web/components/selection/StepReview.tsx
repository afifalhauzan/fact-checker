import React from 'react';

interface Database {
  id: number;
  name: string;
}

interface Table {
  id: number;
  display_name?: string;
  name: string;
}

interface StepReviewProps {
  selectedDatabase: Database | null;
  selectedTable: Table | null;
  selectedMetrics: string[];
  selectedDimensions: string[];
  chartType: string | null;
  timeRange: string | null;
  title: string;
  generateError: string | null;
}

export function StepReview({
  selectedDatabase,
  selectedTable,
  selectedMetrics,
  selectedDimensions,
  chartType,
  timeRange,
  title,
  generateError,
}: StepReviewProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-border p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Database</p>
        <p className="mt-2 text-sm font-semibold">{selectedDatabase?.name || '-'}</p>
      </div>
      <div className="rounded-lg border border-border p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tabel</p>
        <p className="mt-2 text-sm font-semibold">{selectedTable?.name || '-'}</p>
      </div>
      <div className="rounded-lg border border-border p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Metrics</p>
        <p className="mt-2 text-sm font-semibold">{selectedMetrics.join(', ') || '-'}</p>
      </div>
      <div className="rounded-lg border border-border p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Dimensi</p>
        <p className="mt-2 text-sm font-semibold">{selectedDimensions.join(', ') || '-'}</p>
      </div>
      <div className="rounded-lg border border-border p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tipe Grafik</p>
        <p className="mt-2 text-sm font-semibold">{chartType || '-'}</p>
      </div>
      <div className="rounded-lg border border-border p-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Jangka Waktu</p>
        <p className="mt-2 text-sm font-semibold">{timeRange || '-'}</p>
      </div>
      <div className="rounded-lg border border-border p-4 md:col-span-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Judul Kustom</p>
        <p className="mt-2 text-sm font-semibold">{title || '-'}</p>
      </div>
      {generateError && <p className="text-sm text-destructive md:col-span-2">{generateError}</p>}
    </div>
  );
}
