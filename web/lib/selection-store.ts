import { create } from 'zustand';

export interface SelectedTable {
  id: number;
  name: string;
  display_name: string;
}

export interface SelectionState {
  // Legacy fields (for backward compatibility)
  step: number;
  dataContext: string | null;
  timeRange: string | null;
  outputType: string | null;
  visualization: string | null;
  title: string;

  // New API-based fields
  databaseId: number | null;
  selectedTable: SelectedTable | null;
  selectedMetrics: string[];
  selectedDimensions: string[];
  chartType: string | null;

  // Legacy setters
  setStep: (step: number) => void;
  setDataContext: (value: string) => void;
  setTimeRange: (value: string) => void;
  setOutputType: (value: string) => void;
  setVisualization: (value: string) => void;
  setTitle: (value: string) => void;

  // New API-based setters
  setDatabaseId: (id: number | null) => void;
  setSelectedTable: (table: SelectedTable | null) => void;
  setSelectedMetrics: (metrics: string[]) => void;
  setSelectedDimensions: (dimensions: string[]) => void;
  setChartType: (type: string | null) => void;

  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const TOTAL_STEPS = 5;

export const useSelectionStore = create<SelectionState>((set) => ({
  // Legacy fields
  step: 1,
  dataContext: null,
  timeRange: null,
  outputType: null,
  visualization: null,
  title: '',

  // New API-based fields
  databaseId: null,
  selectedTable: null,
  selectedMetrics: [],
  selectedDimensions: [],
  chartType: null,

  // Legacy setters
  setStep: (step) => set({ step }),
  setDataContext: (value) => set({ dataContext: value }),
  setTimeRange: (value) => set({ timeRange: value }),
  setOutputType: (value) => set({ outputType: value }),
  setVisualization: (value) => set({ visualization: value }),
  setTitle: (value) => set({ title: value }),

  // New API-based setters
  setDatabaseId: (id) => set({ databaseId: id }),
  setSelectedTable: (table) => set({ selectedTable: table }),
  setSelectedMetrics: (metrics) => set({ selectedMetrics: metrics }),
  setSelectedDimensions: (dimensions) => set({ selectedDimensions: dimensions }),
  setChartType: (type) => set({ chartType: type }),

  nextStep: () =>
    set((state) => ({
      step: Math.min(state.step + 1, TOTAL_STEPS),
    })),

  prevStep: () =>
    set((state) => ({
      step: Math.max(state.step - 1, 1),
    })),

  reset: () =>
    set({
      step: 1,
      dataContext: null,
      timeRange: null,
      outputType: null,
      visualization: null,
      title: '',
      databaseId: null,
      selectedTable: null,
      selectedMetrics: [],
      selectedDimensions: [],
      chartType: null,
    }),
}));
