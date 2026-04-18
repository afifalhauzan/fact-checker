import { useSelectionStore } from '@/lib/selection-store';
import { STEP_CONFIGS, type StepConfig, type StepOption } from '@/config/selection.config';

export function useSelectionFlow() {
  const {
    step,
    dataContext,
    timeRange,
    outputType,
    visualization,
    setDataContext,
    setTimeRange,
    setOutputType,
    setVisualization,
    nextStep,
    prevStep,
    reset,
  } = useSelectionStore();

  const currentConfig = STEP_CONFIGS[step];

  const getSelectedValue = (): string | null => {
    switch (step) {
      case 1:
        return dataContext;
      case 2:
        return timeRange;
      case 3:
        return outputType;
      case 4:
        return visualization;
      case 5:
        return 'review';
      default:
        return null;
    }
  };

  const handleSelect = (value: string) => {
    switch (step) {
      case 1:
        setDataContext(value);
        break;
      case 2:
        setTimeRange(value);
        break;
      case 3:
        setOutputType(value);
        break;
      case 4:
        setVisualization(value);
        break;
    }
  };

  const canProceed = (): boolean => {
    if (step === 5) {
      return true;
    }

    const selectedValue = getSelectedValue();
    return selectedValue !== null;
  };

  const handleProceed = () => {
    if (step === 5) {
      // Final step - log the final state and reset
      console.log('[Selection Flow] Final Configuration:', {
        dataContext,
        timeRange,
        outputType,
        visualization,
      });
      // Reset flow for next use
      reset();
    } else {
      nextStep();
    }
  };

  const completionPercent = (step / 5) * 100;

  return {
    step,
    totalSteps: 5,
    currentConfig,
    selectedValue: getSelectedValue(),
    handleSelect,
    nextStep: handleProceed,
    prevStep,
    canProceed,
    canGoBack: step > 1,
    completionPercent,
    allValues: {
      dataContext,
      timeRange,
      outputType,
      visualization,
    },
  };
}
