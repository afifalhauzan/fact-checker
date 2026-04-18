import React from 'react';

interface StepDatabaseSelectionProps {
  databaseId: number | null;
  databases: Array<{ id: number; name: string }>;
  loading: boolean;
  error: string | null;
  onSelect: (value: string) => void;
}

export function StepDatabaseSelection({
  databaseId,
  databases,
  loading,
  error,
  onSelect,
}: StepDatabaseSelectionProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Database
      </label>
      <select
        value={databaseId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        disabled={loading}
      >
        <option value="">Pilih database...</option>
        {databases.map((db) => (
          <option key={db.id} value={db.id}>
            {db.name}
          </option>
        ))}
      </select>
      {loading && <p className="text-sm text-muted-foreground">Memuat database...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
