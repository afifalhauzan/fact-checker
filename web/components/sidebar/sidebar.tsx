import { PanelLeftClose, Star } from "lucide-react";
import { SourceItem, type SidebarSourceItem } from "@/components/sidebar/SourceItem";

interface SidebarProps {
  sources: SidebarSourceItem[];
  onClose: () => void;
  onOpenSource?: (item: SidebarSourceItem) => void;
}

export function Sidebar({ sources, onClose, onOpenSource }: SidebarProps) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col bg-muted/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Context</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Klik bagian analisis untuk melihat sumber terkait
      </p>

      <div className="space-y-2 overflow-y-auto pr-1">
        {sources.map((source) => (
          <SourceItem key={source.id} item={source} onOpen={onOpenSource} />
        ))}
      </div>

      <button
        type="button"
        className="mt-auto inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        title="Favorite"
      >
        <Star className="h-4 w-4" />
        <span>Favorite</span>
      </button>
    </aside>
  );
}