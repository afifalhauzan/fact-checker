import type { AnalysisResult } from "@/langchain/agents/analyzer/schema";

interface SummaryCardProps {
  summary: AnalysisResult["summary"];
}

export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-primary/20 p-4 shadow-sm transition-colors hover:bg-primary/10">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Ringkasan</p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{summary}</p>
    </div>
  );
}
