import { ExternalLink } from "lucide-react";
import { type Reference } from "@/langchain/agents/analyzer/schema";

interface ReferenceCardProps {
  reference: Reference;
}

export function ReferenceCard({ reference }: ReferenceCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-xs">
      <p className="font-semibold text-foreground">{reference.title}</p>
      {reference.snippet && (
        <p className="mt-1 leading-relaxed text-muted-foreground italic">{reference.snippet}</p>
      )}
      {reference.url && (
        <a
          href={reference.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-primary hover:underline"
        >
          Buka Sumber Verifikasi
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
      {/* {reference.citations?.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {reference.citations.map((citation, citationIndex) => (
            <CitationBadge
              key={`${reference.title}-${citation.id}-${citationIndex}`}
              citation={citation}
              index={citationIndex}
            />
          ))}
        </div>
      )} */}
    </div>
  );
}
