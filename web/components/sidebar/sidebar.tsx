"use client";

import React from "react";
import Link from "next/link";
import { History, MessageSquareText, Pin, Search, SquarePen, X } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/utils/utils";
import { ConfirmModal } from "@/components/ui/modal";
import { useChatSessions, type ChatSession } from "@/hooks/use-chat-sessions";
import { SessionList, openSession } from "@/components/sidebar/session-history";

const RAIL_WIDTH = "w-14";

/**
 * A panel beside the chat. On desktop it slides open in the layout, and a panel with `hasRail`
 * keeps a narrow icon column when closed; on phones it overlays the chat. Its open/close toggle
 * lives in the chat toolbar, so the toggle never moves.
 */
export function SidePanel({
  side,
  isOpen,
  isMobile,
  label,
  hasRail = false,
  onClose,
  children,
}: {
  side: "left" | "right";
  isOpen: boolean;
  isMobile: boolean;
  label: string;
  hasRail?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (isMobile) {
    if (!isOpen) return null;
    return (
      <>
        <button type="button" aria-label={`Tutup ${label}`} onClick={onClose} className="absolute inset-0 z-20 bg-black/20" />
        <aside
          aria-label={label}
          className={cn(
            "absolute inset-y-0 z-30 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-background p-4 shadow-xl animate-in duration-200",
            side === "left" ? "left-0 border-r border-border slide-in-from-left-4" : "right-0 border-l border-border slide-in-from-right-4"
          )}
        >
          {children}
        </aside>
      </>
    );
  }

  const showsRail = hasRail && !isOpen;

  return (
    <aside
      aria-label={label}
      aria-hidden={!isOpen && !hasRail}
      className={cn(
        "relative h-full shrink-0 overflow-hidden bg-muted/40 transition-[width] duration-300 ease-out",
        side === "left" ? "border-r" : "border-l",
        isOpen ? "w-[280px] border-border" : showsRail ? `${RAIL_WIDTH} border-border` : "w-0 border-transparent"
      )}
    >
      <div
        className={cn(
          "flex h-full flex-col overflow-y-auto",
          showsRail ? `${RAIL_WIDTH} items-center px-2 py-4` : "w-[280px] p-4",
          !isOpen && !hasRail && "invisible"
        )}
      >
        {children}
      </div>
    </aside>
  );
}

function RailButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}

/**
 * TelaahLoker sessions: search, new session, pinned, then the rest. When `collapsed` (desktop,
 * panel closed) the same order is shown as icons only; each one opens the panel.
 */
export function HistoryPanel({
  activeConversationId,
  collapsed,
  onExpand,
}: {
  activeConversationId: string | null;
  collapsed: boolean;
  onExpand: () => void;
}) {
  const { sessions, isGuest, isLoading, remove, setPinned } = useChatSessions();
  const [query, setQuery] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState<ChatSession | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const focusSearchOnExpand = React.useRef(false);

  React.useEffect(() => {
    if (!collapsed && focusSearchOnExpand.current) {
      focusSearchOnExpand.current = false;
      searchRef.current?.focus();
    }
  }, [collapsed]);

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = sessions.filter((session) => {
    const title = (session.title || "Telaah tanpa judul").toLowerCase();
    return words.every((word) => title.includes(word));
  });
  const pinned = matches
    .filter((session) => session.pinned_at)
    .sort((a, b) => (b.pinned_at ?? "").localeCompare(a.pinned_at ?? ""));
  const others = matches.filter((session) => !session.pinned_at);
  const hasPinned = sessions.some((session) => session.pinned_at);

  const togglePin = async (session: ChatSession) => {
    const saved = await setPinned(session.id, !session.pinned_at);
    if (!saved) toast.error("Sematan gagal disimpan. Coba lagi.");
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const deleted = await remove(pendingDelete.id);
    if (deleted && pendingDelete.id === activeConversationId) openSession();
  };

  if (collapsed) {
    return (
      <nav aria-label="Riwayat telaah" className="flex flex-col items-center gap-1">
        <RailButton
          label="Cari telaah"
          onClick={() => {
            focusSearchOnExpand.current = true;
            onExpand();
          }}
        >
          <Search className="h-4 w-4" />
        </RailButton>
        <RailButton label="TelaahLoker baru" onClick={() => openSession()}>
          <SquarePen className="h-4 w-4" />
        </RailButton>
        {hasPinned && (
          <RailButton label="Telaah disematkan" onClick={onExpand}>
            <Pin className="h-4 w-4" />
          </RailButton>
        )}
        <RailButton label="Riwayat telaah" onClick={onExpand}>
          <History className="h-4 w-4" />
        </RailButton>
      </nav>
    );
  }

  return (
    <>
      <label className="relative mb-3 block">
        <span className="sr-only">Cari telaah</span>
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari telaah"
          className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-8 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Hapus pencarian"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>

      <button
        type="button"
        onClick={() => openSession()}
        className="mb-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <SquarePen className="h-4 w-4" />
        TelaahLoker Baru
      </button>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 px-1" aria-hidden>
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-10 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : isGuest ? (
          <div className="rounded-lg border border-dashed border-border bg-card/40 p-3 text-xs leading-relaxed text-muted-foreground">
            Riwayat hanya tersimpan untuk akun.{" "}
            <Link href="/login?from=%2Fchat" className="font-medium text-primary hover:underline">
              Masuk
            </Link>{" "}
            supaya telaahmu bisa dibuka lagi nanti.
          </div>
        ) : sessions.length === 0 ? (
          <p className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <MessageSquareText className="h-3.5 w-3.5" />
            Belum ada telaah tersimpan.
          </p>
        ) : matches.length === 0 ? (
          <p className="px-1 text-xs text-muted-foreground">Tidak ada telaah yang cocok dengan &ldquo;{query.trim()}&rdquo;.</p>
        ) : (
          <>
            {pinned.length > 0 && (
              <SessionList
                title="Disematkan"
                sessions={pinned}
                activeConversationId={activeConversationId}
                onTogglePin={togglePin}
                onDelete={setPendingDelete}
              />
            )}
            {others.length > 0 && (
              <SessionList
                title="Riwayat telaah"
                sessions={others}
                activeConversationId={activeConversationId}
                onTogglePin={togglePin}
                onDelete={setPendingDelete}
              />
            )}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus telaah ini?"
        description="Percakapan dan hasil telaahnya akan dihapus permanen dari riwayatmu."
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive
      />
    </>
  );
}
