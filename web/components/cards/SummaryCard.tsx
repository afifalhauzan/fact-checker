import type { AnalysisResult, Citation } from "@/langchain/agents/analyzer/schema";
import { CitationBadge } from "@/components/cards/CitationBadge";

interface SummaryCardProps {
  summary: AnalysisResult["summary"];
  citations?: Citation[];
}

export function SummaryCard({ summary, citations = [] }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-primary/20 p-4 shadow-sm transition-colors hover:bg-primary/10">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Ringkasan Lowongan</p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{summary}</p>
      {citations.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {citations.map((citation, index) => (
            <CitationBadge
              key={`${citation.id}-${index}`}
              citation={citation}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
