import React from 'react';

interface ProgressSidebarProps {
  step: number;
  totalSteps: number;
  databaseName: string | null;
  tableName: string | null;
  metricsCount: number;
  dimensionsCount: number;
  timeRange: string | null;
  chartType: string | null;
  title: string;
}

const STEP_ICONS: Record<number, string> = {
  1: '📊',
  2: '📋',
  3: '🔍',
  4: '🎨',
  5: '✓',
};

/**
 * Get display value for a step based on selection
 */
function getStepDisplayValue(stepNumber: number, data: {
  databaseName: string | null;
  tableName: string | null;
  metricsCount: number;
  dimensionsCount: number;
  timeRange: string | null;
  chartType: string | null;
  title: string;
}): string {
  switch (stepNumber) {
    case 1:
      return data.databaseName || 'Pilih Database';
    case 2:
      return data.tableName || 'Pilih Tabel';
    case 3:
      return `${data.metricsCount} metrik, ${data.dimensionsCount} dimensi`;
    case 4:
      return [data.chartType, data.timeRange].filter(Boolean).join(' | ') || 'Atur Visualisasi';
    case 5:
      return 'Tinjauan';
    default:
      return `Langkah ${stepNumber}`;
  }
}

export function SelectionProgress({
  step,
  totalSteps,
  databaseName,
  tableName,
  metricsCount,
  dimensionsCount,
  timeRange,
  chartType,
  title,
}: ProgressSidebarProps) {
  const completionPercent = (step / totalSteps) * 100;

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-20">
        <div className="mb-8">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Langkah {step} dari {totalSteps}
          </h2>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-gradient-to-r from-primary/50 to-primary/40 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        <nav className="relative space-y-4">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === step;
            const isCompleted = stepNumber < step;

            return (
              <div key={stepNumber} className="group relative flex items-center gap-4">
                {/* The Connector Line (Optional: hides for the last item) */}
                {index !== totalSteps - 1 && (
                  <div
                    className={`absolute left-2.5 top-7 h-full w-[1px] ${isCompleted ? 'bg-primary' : 'bg-slate-200'
                      }`}
                  />
                )}

                {/* Status Indicator */}
                <div className="relative flex h-5 w-5 items-center justify-center">
                  {isCompleted ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                      ✓
                    </div>
                  ) : isActive ? (
                    <>
                      <div className="absolute h-5 w-5 animate-ping duration-3000 rounded-full bg-primary/50 opacity-20" />
                      <div className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/30" />
                    </>
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-300 transition-colors group-hover:bg-slate-400" />
                  )}
                </div>

                {/* Text Content */}
                <div className="flex flex-col">
                  <span className={`text-[11px] font-semibold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-slate-400'
                    }`}>
                    {getStepDisplayValue(stepNumber, {
                      databaseName,
                      tableName,
                      metricsCount,
                      dimensionsCount,
                      timeRange,
                      chartType,
                      title,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
