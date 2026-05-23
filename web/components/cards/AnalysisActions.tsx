import { Loader2, Sparkles } from "lucide-react";
import type { AnalysisAction } from "@/types/ui-actions";

interface AnalysisActionsProps {
  messageId: string;
  actions: AnalysisAction[];
  onActionClick: (action: AnalysisAction, sourceMessageId?: string) => void;
  isLoading?: boolean;
  pendingActionId?: string | null;
}

export function AnalysisActions({
  messageId,
  actions,
  onActionClick,
  isLoading = false,
  pendingActionId = null,
}: AnalysisActionsProps) {
  if (!actions.length) {
    return null;
  }

  return (
    <section className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <p className="text-xs font-medium text-primary">Aksi lanjutan</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const isActionPending = pendingActionId === action.id && isLoading;
          const isDisabled = isLoading;

          return (
            <button
              key={`${messageId}-${action.id}`}
              type="button"
              onClick={() => onActionClick(action, messageId)}
              disabled={isDisabled}
              title={action.description}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isActionPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              )}
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

