import React from "react";
import { ExternalLink } from "lucide-react";
import { type Citation } from "@/langchain/agents/analyzer/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CitationBadgeProps {
  citation: Citation;
  index: number;
}

export function CitationBadge({ citation, index }: CitationBadgeProps) {
  const [open, setOpen] = React.useState(false);
  const label = citation.label?.trim().length ? citation.label : `[${index + 1}]`;

  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 text-[10px] font-semibold leading-none text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label={`Citation ${label}`}
          >
            {label}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="max-w-sm">
          <div className="space-y-1">
            <p className="font-medium text-background">{citation.title}</p>
            <a
              href={citation.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] underline underline-offset-2"
            >
              Open source
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
