'use client';

import React from 'react';
import { useSelectionData } from '@/hooks/useSelectionData';
import { useSelectionGenerate } from '@/hooks/useSelectionGenerate';
import { useSelectionStore } from '@/lib/selection-store';
import { SelectionHeader } from '@/components/selection/SelectionHeader';
import { StepDatabaseSelection } from '@/components/selection/StepDatabaseSelection';
import { StepTableSelection } from '@/components/selection/StepTableSelection';
import { StepFieldsSelection } from '@/components/selection/StepFieldsSelection';
import { StepVisualization } from '@/components/selection/StepVisualization';
import { StepReview } from '@/components/selection/StepReview';
import { SelectionFooter } from '@/components/selection/SelectionFooter';
import { SelectionProgress } from '@/components/selection/SelectionProgress';
import { Modal } from '@/components/ui/modal';
import { Riple } from 'react-loading-indicators';

const CHART_OPTIONS = [
  { id: 'bar', title: 'Grafik Batang' },
  { id: 'line', title: 'Grafik Garis' },
  { id: 'pie', title: 'Grafik Pie' },
];

const TIME_RANGE_OPTIONS = [
  { id: 'day', title: 'Harian' },
  { id: 'week', title: 'Mingguan' },
  { id: 'month', title: 'Bulanan' },
  { id: 'year', title: 'Tahunan' },
];

export function Selection() {
  const {
    step,
    nextStep,
    prevStep,
    databaseId,
    selectedTable,
    selectedMetrics,
    selectedDimensions,
    chartType,
    timeRange,
    title,
    setDatabaseId,
    setSelectedTable,
    setSelectedMetrics,
    setSelectedDimensions,
    setChartType,
    setTimeRange,
    setTitle,
  } = useSelectionStore();

  const totalSteps = 5;

  const { databases, tables, metrics, dimensions, loading, error, fetchTables, fetchFields } =
    useSelectionData();
  const { generateDashboard, loading: generating, error: generateError } = useSelectionGenerate();

  const selectedDatabase = databases.find((db) => db.id === databaseId) || null;
  const previousAutoTitleRef = React.useRef('');

  // Loading messages for the generation modal
  const loadingMessages = [
    'Membuat dashboard Anda...',
    'Memproses data...',
    'Mengonfigurasi visualisasi...',
    'Hampir selesai...',
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);

  // Cycle through loading messages every 1.5 seconds
  React.useEffect(() => {
    if (!generating) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [generating, loadingMessages.length]);

  const autoTitle = React.useMemo(() => {
    const db = selectedDatabase?.name;
    const table = selectedTable?.display_name || selectedTable?.name;
    const primaryMetric = selectedMetrics[0];
    const timeRangeTitle = TIME_RANGE_OPTIONS.find((option) => option.id === timeRange)?.title;
    const chartTitle = CHART_OPTIONS.find((option) => option.id === chartType)?.title;

    const parts = [primaryMetric, table, timeRangeTitle, chartTitle, db].filter(Boolean);
    if (parts.length === 0) return '';

    return parts.join(' | ');
  }, [selectedDatabase?.name, selectedTable?.display_name, selectedTable?.name, selectedMetrics, timeRange, chartType]);

  React.useEffect(() => {
    const isTitleEmpty = title.trim().length === 0;
    const isPreviousAutoTitle = title === previousAutoTitleRef.current;

    if (!autoTitle) return;

    // Only auto-fill if field is empty OR if title is still the previous auto-generated value
    // This prevents override once user manually edits the title
    if (isTitleEmpty || isPreviousAutoTitle) {
      setTitle(autoTitle);
      previousAutoTitleRef.current = autoTitle;
    }
  }, [autoTitle, title, setTitle]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return Boolean(databaseId);
      case 2:
        return Boolean(selectedTable);
      case 3:
        return selectedMetrics.length > 0;
      case 4:
        return Boolean(chartType && timeRange);
      case 5:
        return !generating;
      default:
        return false;
    }
  };

  const handleMetricToggle = (name: string) => {
    if (selectedMetrics.includes(name)) {
      setSelectedMetrics(selectedMetrics.filter((item) => item !== name));
      return;
    }
    setSelectedMetrics([...selectedMetrics, name]);
  };

  const handleDimensionToggle = (name: string) => {
    if (selectedDimensions.includes(name)) {
      setSelectedDimensions(selectedDimensions.filter((item) => item !== name));
      return;
    }
    setSelectedDimensions([...selectedDimensions, name]);
  };

  const handleDatabaseSelect = async (value: string) => {
    const id = Number(value);
    if (!id) {
      setDatabaseId(null);
      setSelectedTable(null);
      setSelectedMetrics([]);
      setSelectedDimensions([]);
      return;
    }

    setDatabaseId(id);
    setSelectedTable(null);
    setSelectedMetrics([]);
    setSelectedDimensions([]);
    await fetchTables(id);
  };

  const handleTableSelect = async (value: string) => {
    const tableId = Number(value);
    const table = tables.find((item) => item.id === tableId) || null;

    setSelectedTable(table);
    setSelectedMetrics([]);
    setSelectedDimensions([]);

    if (table) {
      await fetchFields(table.id);
    }
  };

  const handleFinish = async () => {
    if (step < totalSteps) {
      nextStep();
      return;
    }
    await generateDashboard();
  };

  return (
    <div className="flex min-h-full flex-col w-full bg-background">
      <main className="w-full flex-1 px-6 py-6">
        <div className="flex justify-between items-start w-full h-full gap-6">
          {/* Main Content */}
          <div className="flex-1 max-w-2xl">
            <SelectionHeader step={step} />

            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="p-6">
                {step === 1 && (
                  <StepDatabaseSelection
                    databaseId={databaseId}
                    databases={databases}
                    loading={loading.databases}
                    error={error.databases}
                    onSelect={handleDatabaseSelect}
                  />
                )}

                {step === 2 && (
                  <StepTableSelection
                    selectedTableId={selectedTable?.id ?? null}
                    tables={tables}
                    databaseId={databaseId}
                    loading={loading.tables}
                    error={error.tables}
                    onSelect={handleTableSelect}
                  />
                )}

                {step === 3 && (
                  <StepFieldsSelection
                    selectedMetrics={selectedMetrics}
                    selectedDimensions={selectedDimensions}
                    metrics={metrics}
                    dimensions={dimensions}
                    loading={loading.fields}
                    error={error.fields}
                    onMetricToggle={handleMetricToggle}
                    onDimensionToggle={handleDimensionToggle}
                  />
                )}

                {step === 4 && (
                  <StepVisualization
                    chartType={chartType}
                    timeRange={timeRange}
                    title={title}
                    chartOptions={CHART_OPTIONS}
                    timeRangeOptions={TIME_RANGE_OPTIONS}
                    onChartTypeSelect={setChartType}
                    onTimeRangeSelect={setTimeRange}
                    onTitleChange={setTitle}
                  />
                )}

                {step === 5 && (
                  <StepReview
                    selectedDatabase={selectedDatabase}
                    selectedTable={selectedTable}
                    selectedMetrics={selectedMetrics}
                    selectedDimensions={selectedDimensions}
                    chartType={chartType}
                    timeRange={timeRange}
                    title={title}
                    generateError={generateError}
                  />
                )}
              </div>

              <SelectionFooter
                step={step}
                totalSteps={totalSteps}
                canProceed={canProceed()}
                generating={generating}
                onPrevious={prevStep}
                onFinish={handleFinish}
              />
            </div>
          </div>

          {/* Sidebar Progress */}
          <SelectionProgress
            step={step}
            totalSteps={totalSteps}
            databaseName={selectedDatabase?.name || null}
            tableName={selectedTable?.display_name || selectedTable?.name || null}
            metricsCount={selectedMetrics.length}
            dimensionsCount={selectedDimensions.length}
            timeRange={timeRange}
            chartType={chartType}
            title={title}
          />
        </div>
      </main>

      {/* Generation Loading Modal */}
      <Modal
        isOpen={generating}
        onClose={() => {}}
        showCloseButton={false}
      >
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <Riple color="#3c6bd6" size="large" text="" textColor="" />
          <p className="text-center text-foreground font-medium mt-4">
            {loadingMessages[currentMessageIndex]}
          </p>
        </div>
      </Modal>
    </div>
  );
}
