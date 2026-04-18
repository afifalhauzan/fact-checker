"use client";

import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InteractiveStepProps {
  stepId: string;
  question: string;
  options: string[];
  isCompleted?: boolean;
  completedSelection?: string;
  onSelectOption: (stepId: string, option: string) => void | Promise<void>;
}

export function InteractiveStep({
  stepId,
  question,
  options,
  isCompleted = false,
  completedSelection,
  onSelectOption,
}: InteractiveStepProps) {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccessBadge, setShowSuccessBadge] = React.useState(false);

  const frozenSelection = completedSelection ?? null;
  const isStepCompleted = isCompleted || !!frozenSelection;
  const isDisabled = isStepCompleted || isSubmitting;

  // Trigger transient "Selesai" badge when completion is detected
  React.useEffect(() => {
    if (isStepCompleted) {
      setShowSuccessBadge(true);
      const timer = setTimeout(() => {
        setShowSuccessBadge(false);
      }, 2000); // 2-second feedback window
      return () => clearTimeout(timer);
    }
  }, [isStepCompleted]);

  const handleSelect = async (option: string) => {
    if (isDisabled) return;

    setSelectedOption(option);
    setIsSubmitting(true);

    try {
      await onSelectOption(stepId, option);
    } catch (error) {
      console.error('[InteractiveStep] Failed to submit selection:', error);
      setIsSubmitting(false);
      setSelectedOption(null);
    }
  };

  return (
    <div className="mt-0 rounded-xl border border-border bg-muted/40 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{question}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pilih salah satu opsi untuk melanjutkan demo.
          </p>
        </div>

        <div className="h-7 min-w-[80px] flex justify-end">
          <AnimatePresence mode="wait">
            {isSubmitting && !isStepCompleted && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memproses
              </motion.div>
            )}

            {showSuccessBadge && isStepCompleted && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.92, y: 2 }}
                animate={{
                  opacity: 1,
                  scale: [0.92, 1.04, 1],
                  y: [2, -2, 0]
                }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1] // smooth "easeOutExpo-ish"
                }}
                className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5 delay-75" />
                Selesai
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <TooltipProvider>
          {options.map((option) => {
            const isSelected = selectedOption === option;
            const isFrozenSelected = !!frozenSelection && frozenSelection === option;

            const buttonElement = (
              <Button
                key={option}
                type="button"
                variant={(isSelected || isFrozenSelected) ? 'default' : 'secondary'}
                size="sm"
                disabled={isDisabled}
                onClick={() => handleSelect(option)}
                className={cn(
                  'min-w-0 rounded-full px-3 text-xs transition-all',
                  isSelected && !isStepCompleted && 'shadow-md',
                  isStepCompleted && !isFrozenSelected && 'opacity-50 grayscale-[0.5]'
                )}
              >
                {isStepCompleted && isFrozenSelected ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {option}
                  </div>
                ) : isSelected && isSubmitting ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {option}
                  </div>
                ) : (
                  option
                )}
              </Button>
            );

            // Show tooltip on disabled buttons (when step is completed)
            if (isDisabled) {
              return (
                <Tooltip key={option}>
                  <TooltipTrigger asChild>
                    {buttonElement}
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-xs">
                    Sudah dipilih. Kirim pesan baru untuk mengubah pilihan.
                  </TooltipContent>
                </Tooltip>
              );
            }

            return buttonElement;
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}