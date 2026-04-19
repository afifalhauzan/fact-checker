import { ChevronDown } from "lucide-react";

interface ExplanationCardProps {
  explanation?: string;
}

export function ExplanationCard({ explanation }: ExplanationCardProps) {
  if (!explanation?.trim().length) {
    return null;
  }

  return (
    <details className="rounded-xl border border-border bg-card p-3 group">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground">
        <span>What does this mean?</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-2 border-t border-border pt-2 text-sm leading-relaxed text-muted-foreground">
        {explanation}
      </div>
    </details>
  );
}