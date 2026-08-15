import { ExternalLink, Newspaper } from "lucide-react";

export interface SidebarSourceItem {
  id: string;
  title: string;
  link: string;
}

interface SourceItemProps {
  item: SidebarSourceItem;
  onOpen?: (item: SidebarSourceItem) => void;
}

function getDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function SourceItem({ item, onOpen }: SourceItemProps) {
  const domain = getDomain(item.link);

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-card/70 p-2">
      <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Newspaper className="h-4 w-4" />
      </div>

      <div className="flex-1">
        <p className="text-xs leading-relaxed text-foreground">{item.title}</p>
        {domain && <p className="mt-0.5 text-[10px] text-muted-foreground">{domain}</p>}
      </div>

      <a
        href={item.link}
        target="_blank"
        rel="noreferrer"
        onClick={() => onOpen?.(item)}
        className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        title="Open source"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Buka
      </a>
    </div>
  );
}