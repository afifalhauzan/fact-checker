import {
  Banknote,
  Building2,
  Link2,
  ListChecks,
  Loader2,
  ShieldAlert,
} from "lucide-react";
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
      <p className="text-xs font-medium text-primary">Aksi Investigasi Lanjutan</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {actions.map((action) => {
          const isActionPending = pendingActionId === action.id && isLoading;
          const isDisabled = isLoading;
          const Icon = {
            validate_company: Building2,
            check_red_flags: ShieldAlert,
            check_link_contact: Link2,
            check_salary_benefit_reasonableness: Banknote,
            safe_next_steps: ListChecks,
          }[action.id];
          const isLastAction = actions.length === 5 && actions.indexOf(action) === 4;

          return (
            <button
              key={`${messageId}-${action.id}`}
              type="button"
              onClick={() => onActionClick(action, messageId)}
              disabled={isDisabled}
              title={action.description}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70 ${isLastAction ? "col-span-2 md:col-span-1" : ""}`}
            >
              {isActionPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
