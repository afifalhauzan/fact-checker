import { History, Newspaper, PanelLeftClose, PanelLeftOpen, SquarePen } from "lucide-react";
import { SourceItem, type SidebarSourceItem } from "@/components/sidebar/SourceItem";
import { SessionHistory, openSession } from "@/components/sidebar/session-history";

export type SidebarMode = "collapsed" | "expanded";

interface SidebarProps {
  sources: SidebarSourceItem[];
  mode: SidebarMode;
  onExpand: () => void;
  onCollapse: () => void;
  onOpenSource?: (item: SidebarSourceItem) => void;
  activeConversationId: string | null;
  className?: string;
  isMobileOverlay?: boolean;
}

const ICON_BUTTON =
  "inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function PanelContent({
  sources,
  onCollapse,
  onOpenSource,
  activeConversationId,
}: Pick<SidebarProps, "sources" | "onCollapse" | "onOpenSource" | "activeConversationId">) {
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => openSession()}
          className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <SquarePen className="h-4 w-4" />
          Telaah baru
        </button>
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Tutup panel"
          aria-label="Tutup panel"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-[3] flex-col">
        <SessionHistory activeConversationId={activeConversationId} />
      </div>

      <section aria-labelledby="konteks-heading" className="mt-4 flex min-h-0 flex-[2] flex-col border-t border-border pt-4">
        <h2 id="konteks-heading" className="mb-1 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Konteks
        </h2>
        <p className="mb-3 px-1 text-xs leading-relaxed text-muted-foreground">
          Sumber verifikasi yang bisa kamu cek untuk memastikan lowongan ini.
        </p>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {sources.length > 0 ? (
            sources.map((source) => <SourceItem key={source.id} item={source} onOpen={onOpenSource} />)
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card/30 p-3 text-xs text-muted-foreground">
              Belum ada sumber verifikasi untuk percakapan ini.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function Sidebar({
  sources,
  mode,
  onExpand,
  onCollapse,
  onOpenSource,
  activeConversationId,
  className = "",
  isMobileOverlay = false,
}: SidebarProps) {
  const isExpanded = mode === "expanded";

  if (isMobileOverlay) {
    return (
      <aside
        className={`flex min-h-0 w-full shrink-0 flex-col border-b border-border bg-muted/50 p-4 animate-in slide-in-from-left-3 duration-300 ${className}`}
        aria-label="Riwayat dan konteks"
      >
        <PanelContent
          sources={sources}
          onCollapse={onCollapse}
          onOpenSource={onOpenSource}
          activeConversationId={activeConversationId}
        />
      </aside>
    );
  }

  return (
    <aside
      className={`relative hidden h-full shrink-0 overflow-hidden border-r border-border bg-muted/50 transition-[width] duration-300 ease-out md:flex ${isExpanded ? "w-[300px]" : "w-16"} ${className}`}
      aria-label="Riwayat dan konteks"
    >
      <div
        className={`absolute inset-y-0 left-0 flex w-16 flex-col items-center gap-2 py-3 transition-opacity duration-150 ${isExpanded ? "pointer-events-none opacity-0" : "opacity-100 delay-150"}`}
      >
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          title="Buka panel"
        >
          <PanelLeftOpen className="h-4 w-4" />
          <span className="sr-only">Buka panel</span>
        </button>

        <div className="my-1 h-px w-8 bg-border" />

        <button type="button" onClick={() => openSession()} className={ICON_BUTTON} title="Telaah baru">
          <SquarePen className="h-4 w-4" />
          <span className="sr-only">Telaah baru</span>
        </button>
        <button type="button" onClick={onExpand} className={ICON_BUTTON} title="Riwayat telaah">
          <History className="h-4 w-4" />
          <span className="sr-only">Riwayat telaah</span>
        </button>
        <button type="button" onClick={onExpand} className={ICON_BUTTON} title="Lihat konteks">
          <Newspaper className="h-4 w-4" />
          <span className="sr-only">Lihat konteks</span>
        </button>
      </div>

      <div
        className={`absolute inset-y-0 left-0 flex min-h-0 w-[300px] flex-col p-4 transition-opacity duration-150 ${isExpanded ? "opacity-100 delay-150" : "pointer-events-none opacity-0"}`}
      >
        <PanelContent
          sources={sources}
          onCollapse={onCollapse}
          onOpenSource={onOpenSource}
          activeConversationId={activeConversationId}
        />
      </div>
    </aside>
  );
}
