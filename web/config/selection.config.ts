/**
 * Selection Builder Configuration
 * Centralized step definitions for the selection flow
 * Can be dynamically fetched from backend later
 */

export interface StepOption {
  id: string;
  title: string;
  description: string;
}

export interface StepConfig {
  id: string;
  title: string;
  subtitle: string;
  options: StepOption[];
}

/**
 * Step configurations for the 5-step selection builder
 * Can be replaced with async backend fetch in the future
 */
export const STEP_CONFIGS: Record<number, StepConfig> = {
  1: {
    id: 'data-context',
    title: 'Pilih Database/Sumber Data',
    subtitle: 'Pilih sumber data untuk analisis Anda.',
    options: [],
  },
  2: {
    id: 'table-selection',
    title: 'Pilih Tabel',
    subtitle: 'Pilih tabel dari database yang dipilih.',
    options: [],
  },
  3: {
    id: 'field-selection',
    title: 'Pilih Metrics & Dimensions',
    subtitle: 'Tentukan metrik dan dimensi untuk dashboard.',
    options: [],
  },
  4: {
    id: 'visualization',
    title: 'Konfigurasi Visualisasi',
    subtitle: 'Pilih chart type, periode waktu, dan judul.',
    options: [
      { id: 'bar', title: 'Grafik Batang', description: 'Bandingkan nilai antar kategori' },
      { id: 'line', title: 'Grafik Garis', description: 'Lacak tren dari waktu ke waktu' },
      { id: 'pie', title: 'Grafik Pie', description: 'Tampilkan bagian dari keseluruhan' },
    ],
  },
  5: {
    id: 'review',
    title: 'Tinjauan',
    subtitle: 'Periksa kembali konfigurasi Anda sebelum menyelesaikan.',
    options: [],
  },
};