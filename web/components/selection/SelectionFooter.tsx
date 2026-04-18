import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface SelectionFooterProps {
  step: number;
  totalSteps: number;
  canProceed: boolean;
  generating: boolean;
  onPrevious: () => void;
  onFinish: () => void;
}

export function SelectionFooter({
  step,
  totalSteps,
  canProceed,
  generating,
  onPrevious,
  onFinish,
}: SelectionFooterProps) {
  return (
    <div className="flex items-center justify-between bg-secondary/50 px-6 py-5">
      <Button
        onClick={onPrevious}
        disabled={step <= 1 || generating}
        variant="link"
        className="text-primary p-2 text-xs font-bold uppercase tracking-widest disabled:opacity-0 disabled:cursor-not-allowed"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Sebelumnya
      </Button>
      <Button
        onClick={onFinish}
        disabled={!canProceed}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {step === totalSteps ? (generating ? 'Menghasilkan...' : 'Selesai') : 'Berikutnya'}
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
