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
  isMobileOverlay?: boolean;
}

export function Sidebar({
  sources,
  mode,
  onExpand,
  onCollapse,
  onOpenSource,
  className = "",
  isMobileOverlay = false,
}: SidebarProps) {
  const isExpanded = mode === "expanded";

  if (isMobileOverlay) {
    return (
      <aside
        className={`flex min-h-0 w-full shrink-0 flex-col border-b border-border bg-muted/50 p-4 animate-in slide-in-from-left-3 duration-300 ${className}`}
        aria-label="Sidebar konteks"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Konteks</h2>
          <button
            type="button"
            onClick={onCollapse}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            title="Tutup panel konteks"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Lihat daftar sumber verifikasi yang bisa kamu cek untuk memastikan lowongan.
        </p>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {sources.length > 0 ? (
            sources.map((source) => (
              <SourceItem key={source.id} item={source} onOpen={onOpenSource} />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card/30 p-3 text-xs text-muted-foreground">
              Belum ada sumber verifikasi yang direkomendasikan untuk percakapan ini.
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

  return (
    <aside
      className={`relative hidden h-full shrink-0 overflow-hidden border-r border-border bg-muted/50 transition-[width] duration-300 ease-out md:flex ${isExpanded ? "w-[320px]" : "w-16"} ${className}`}
      aria-label="Sidebar konteks"
    >
      <div
        className={`absolute inset-y-0 left-0 flex w-16 flex-col items-center gap-2 py-3 transition-opacity duration-150 ${isExpanded ? "pointer-events-none opacity-0" : "opacity-100 delay-150"}`}
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
      </div>

      <div
        className={`absolute inset-y-0 left-0 flex min-h-0 w-[320px] flex-col p-4 transition-opacity duration-150 ${isExpanded ? "opacity-100 delay-150" : "pointer-events-none opacity-0"}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Konteks</h2>
          <button
            type="button"
            onClick={onCollapse}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            title="Tutup panel konteks"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Lihat daftar sumber verifikasi yang bisa kamu cek untuk memastikan lowongan.
        </p>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {sources.length > 0 ? (
            sources.map((source) => (
              <SourceItem key={source.id} item={source} onOpen={onOpenSource} />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card/30 p-3 text-xs text-muted-foreground">
              Belum ada sumber verifikasi yang direkomendasikan untuk percakapan ini.
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
      </div>
    </aside>
  );
}
