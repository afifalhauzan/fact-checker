import { ChevronDown } from "lucide-react";
import { type Reasoning } from "@/langchain/agents/analyzer/schema";

interface ReasoningComponentProps {
  messageId: string;
  reasoning: Reasoning[];
  isStreaming: boolean;
  defaultOpen?: boolean;
}

export function ReasoningComponent({
  messageId,
  reasoning,
  isStreaming,
  defaultOpen = false,
}: ReasoningComponentProps) {
  const primaryReasoning = reasoning[0];

  if (!primaryReasoning) {
    return null;
  }

  return (
    <details className="group max-w-md rounded-lg bg-background py-2" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-start gap-2 px-1 text-xs font-medium text-foreground hover:text-primary">
        {isStreaming ? (
          <div className="flex items-center gap-2">
            <span className="animate-pulse">Sedang menganalisis...</span>
            <ChevronDown className="h-3 w-3 animate-pulse text-muted-foreground group-open:rotate-180" />
          </div>

        ) : (
          <div className="flex items-center gap-2">
            <span className="">Lihat tahapan analisis</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground group-open:rotate-180" />
          </div>
        )}


      </summary>
      <div className="mt-3 ml-1 space-y-1.5 border-l border-gray-300 pl-3 text-xs">
        <p className="pl-2 italic text-muted-foreground">{primaryReasoning.intent}</p>
        <ul className="space-y-1 pl-4">
          {primaryReasoning.steps.map((step, index) => (
            <li key={`${messageId}-reasoning-step-${index}`} className="flex gap-1.5 text-muted-foreground">
              <span className="flex-shrink-0 font-semibold text-primary">-&gt;</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
        {isStreaming && (
          <div className="animate-pulse pl-2 pt-1 text-[11px] text-muted-foreground">Menganalisis...</div>
        )}
      </div>
    </details>
  );
}
