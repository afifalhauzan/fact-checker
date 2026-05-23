import { Newspaper, PanelLeftClose, PanelLeftOpen, Star } from "lucide-react";
import { SourceItem, type SidebarSourceItem } from "@/components/sidebar/SourceItem";

export type SidebarMode = "collapsed" | "expanded";

interface SidebarProps {
  sources: SidebarSourceItem[];
  mode: SidebarMode;
  onExpand: () => void;
  onCollapse: () => void;
  onOpenSource?: (item: SidebarSourceItem) => void;
  className?: string;
}

export function Sidebar({
  sources,
  mode,
  onExpand,
  onCollapse,
  onOpenSource,
  className = "",
}: SidebarProps) {
  if (mode === "collapsed") {
    return (
      <aside
        className={`hidden h-full w-16 shrink-0 flex-col items-center gap-2 border-r border-border bg-muted/40 py-3 md:flex ${className}`}
        aria-label="Sidebar konteks minimal"
      >
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Buka panel konteks"
        >
          <PanelLeftOpen className="h-4 w-4" />
          <span className="sr-only">Buka panel konteks</span>
        </button>

        <div className="my-1 h-px w-8 bg-border" />

        <button
          type="button"
          onClick={onExpand}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Lihat konteks"
        >
          <Newspaper className="h-4 w-4" />
          <span className="sr-only">Lihat konteks</span>
        </button>

        <button
          type="button"
          onClick={onExpand}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Favorit"
        >
          <Star className="h-4 w-4" />
          <span className="sr-only">Favorit</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className={`flex min-h-0 w-full shrink-0 flex-col border-b border-border bg-muted/50 p-4 md:h-full md:w-[320px] md:border-b-0 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Konteks</h2>
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Klik bagian analisis untuk melihat sumber terkait
      </p>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {sources.length > 0 ? (
          sources.map((source) => (
            <SourceItem key={source.id} item={source} onOpen={onOpenSource} />
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card/30 p-3 text-xs text-muted-foreground">
            Belum ada sumber konteks untuk percakapan ini.
          </div>
        )}
      </div>

      <button
        type="button"
        className="mt-auto inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        title="Favorit"
      >
        <Star className="h-4 w-4" />
        <span>Favorit</span>
      </button>
    </aside>
  );
}
