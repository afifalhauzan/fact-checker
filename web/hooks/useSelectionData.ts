/**
 * Selection Data Hook
 * Handles auto-fetch of databases, tables, and fields from backend
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSelectionStore } from '@/lib/selection-store';

export interface Database {
  id: number;
  name: string;
  description: string;
  is_saved_questions: boolean;
}

export interface Table {
  id: number;
  db_id: number;
  name: string;
  display_name: string;
  schema_name: string;
}

export interface Field {
  id: number;
  table_id: number;
  name: string;
  display_name: string;
  base_type: string;
  semantic_type: string | null;
  is_metric: boolean;
}

interface UseSelectionDataState {
  databases: Database[];
  tables: Table[];
  fields: Field[];
  metrics: Field[];
  dimensions: Field[];
  loading: {
    databases: boolean;
    tables: boolean;
    fields: boolean;
  };
  error: {
    databases: string | null;
    tables: string | null;
    fields: string | null;
  };
}

function getApiKeyFromCookie(): string {
  if (typeof document === 'undefined') return '';

  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('X-API-Key='));

  if (!cookie) return '';
  return decodeURIComponent(cookie.split('=')[1] || '');
}

function getSelectionRequestOptions(): RequestInit {
  const apiKey = getApiKeyFromCookie();
  const headers: HeadersInit = {};

  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  return {
    credentials: 'include',
    headers,
  };
}

/**
 * Hook for fetching selection data (databases, tables, fields)
 */
export function useSelectionData() {
  const { databaseId, selectedTable } = useSelectionStore();

  const [state, setState] = useState<UseSelectionDataState>({
    databases: [],
    tables: [],
    fields: [],
    metrics: [],
    dimensions: [],
    loading: {
      databases: true,
      tables: false,
      fields: false,
    },
    error: {
      databases: null,
      tables: null,
      fields: null,
    },
  });

  const lastAutoFetchedTablesForDbRef = useRef<number | null>(null);
  const lastAutoFetchedFieldsForTableRef = useRef<number | null>(null);

  /**
   * Fetch databases on mount
   */
  useEffect(() => {
    if (state.databases.length > 0) {
      return;
    }

    const fetchDatabases = async () => {
      setState((prev) => ({
        ...prev,
        loading: { ...prev.loading, databases: true },
        error: { ...prev.error, databases: null },
      }));

      try {
        const response = await fetch('/api/selection/databases', getSelectionRequestOptions());

        if (!response.ok) {
          throw new Error(`Failed to fetch databases: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Filter out saved questions
        const filteredDatabases = result.data.filter(
          (db: Database) => !db.is_saved_questions
        );

        setState((prev) => ({
          ...prev,
          databases: filteredDatabases,
          loading: { ...prev.loading, databases: false },
        }));

        console.log('[useSelectionData] Databases fetched:', filteredDatabases.length);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useSelectionData] Error fetching databases:', errorMessage);

        setState((prev) => ({
          ...prev,
          loading: { ...prev.loading, databases: false },
          error: { ...prev.error, databases: errorMessage },
        }));
      }
    };

    fetchDatabases();
  }, [state.databases.length]);

  /**
   * Fetch tables for selected database
   */
  const fetchTables = useCallback(
    async (databaseId: number) => {
      setState((prev) => ({
        ...prev,
        tables: [],
        fields: [],
        metrics: [],
        dimensions: [],
        loading: { ...prev.loading, tables: true, fields: false },
        error: { ...prev.error, tables: null, fields: null },
      }));

      try {
        const response = await fetch(
          `/api/selection/databases/${databaseId}/tables`,
          getSelectionRequestOptions()
        );

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.error || `Failed to fetch tables: ${response.statusText}`
          );
        }

        const result = await response.json();
        setState((prev) => ({
          ...prev,
          tables: result.data || [],
          loading: { ...prev.loading, tables: false },
        }));

        console.log('[useSelectionData] Tables fetched:', result.data.length);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useSelectionData] Error fetching tables:', errorMessage);

        setState((prev) => ({
          ...prev,
          loading: { ...prev.loading, tables: false },
          error: { ...prev.error, tables: errorMessage },
        }));
      }
    },
    []
  );

  /**
   * Fetch fields for selected table
   */
  const fetchFields = useCallback(
    async (tableId: number) => {
      setState((prev) => ({
        ...prev,
        fields: [],
        metrics: [],
        dimensions: [],
        loading: { ...prev.loading, fields: true },
        error: { ...prev.error, fields: null },
      }));

      try {
        const response = await fetch(
          `/api/selection/tables/${tableId}/fields`,
          getSelectionRequestOptions()
        );

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.error || `Failed to fetch fields: ${response.statusText}`
          );
        }

        const result = await response.json();
        const fields = result.data || [];
        const localMetrics = fields.filter((field: Field) => field.is_metric);
        const localDimensions = fields.filter((field: Field) => !field.is_metric);

        setState((prev) => ({
          ...prev,
          fields,
          metrics: localMetrics,
          dimensions: localDimensions,
          loading: { ...prev.loading, fields: false },
        }));

        console.log('[useSelectionData] Fields fetched - Metrics:', localMetrics.length, 'Dimensions:', localDimensions.length);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useSelectionData] Error fetching fields:', errorMessage);

        setState((prev) => ({
          ...prev,
          loading: { ...prev.loading, fields: false },
          error: { ...prev.error, fields: errorMessage },
        }));
      }
    },
    []
  );

  // Auto-refetch tables on remount when selected database exists but options are empty.
  useEffect(() => {
    if (!databaseId) {
      lastAutoFetchedTablesForDbRef.current = null;
      return;
    }

    if (state.tables.length > 0 || state.loading.tables) {
      return;
    }

    if (lastAutoFetchedTablesForDbRef.current === databaseId) {
      return;
    }

    lastAutoFetchedTablesForDbRef.current = databaseId;
    void fetchTables(databaseId);
  }, [databaseId, state.tables.length, state.loading.tables, fetchTables]);

  // Auto-refetch fields on remount when selected table exists but metric/dimension options are empty.
  useEffect(() => {
    const selectedTableId = selectedTable?.id;

    if (!selectedTableId) {
      lastAutoFetchedFieldsForTableRef.current = null;
      return;
    }

    const isOptionsEmpty = state.metrics.length === 0 && state.dimensions.length === 0;
    if (!isOptionsEmpty || state.loading.fields) {
      return;
    }

    if (lastAutoFetchedFieldsForTableRef.current === selectedTableId) {
      return;
    }

    lastAutoFetchedFieldsForTableRef.current = selectedTableId;
    void fetchFields(selectedTableId);
  }, [selectedTable?.id, state.metrics.length, state.dimensions.length, state.loading.fields, fetchFields]);

  return {
    databases: state.databases,
    tables: state.tables,
    fields: state.fields,
    metrics: state.metrics,
    dimensions: state.dimensions,
    loading: state.loading,
    error: state.error,
    fetchTables,
    fetchFields,
  };
}
