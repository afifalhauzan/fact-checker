import React from 'react';

interface Table {
  id: number;
  display_name?: string;
  name: string;
}

interface StepTableSelectionProps {
  selectedTableId: number | null;
  tables: Table[];
  databaseId: number | null;
  loading: boolean;
  error: string | null;
  onSelect: (value: string) => void;
}

export function StepTableSelection({
  selectedTableId,
  tables,
  databaseId,
  loading,
  error,
  onSelect,
}: StepTableSelectionProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Tabel
      </label>
      <select
        value={selectedTableId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        disabled={!databaseId || loading}
      >
        <option value="">Pilih tabel...</option>
        {tables.map((table) => (
          <option key={table.id} value={table.id}>
            {table.display_name || table.name}
          </option>
        ))}
      </select>
      {loading && <p className="text-sm text-muted-foreground">Memuat tabel...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
