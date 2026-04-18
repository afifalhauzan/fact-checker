import type { AnalysisResult } from "@/src/agents/analyzer/schema";

interface SummaryCardProps {
  summary: AnalysisResult["summary"];
}

export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground">{summary}</p>
    </div>
  );
}
