"use client";

import React from "react";
import Link from "next/link";
import { MessageSquareText, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/modal";
import { cn } from "@/utils/utils";
import { formatRelativeTime } from "@/utils/formatters";
import { useChatSessions, type ChatSession } from "@/hooks/use-chat-sessions";

// A full navigation reloads the chat state cleanly; StreamingContext loads history once per page.
export function openSession(id?: string) {
  window.location.assign(id ? `/chat?conversation_id=${encodeURIComponent(id)}` : "/chat");
}

function SessionRow({
  session,
  isActive,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onDelete: () => void;
}) {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={() => !isActive && openSession(session.id)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "w-full rounded-lg px-3 py-2 pr-9 text-left transition-colors",
          isActive ? "bg-primary/10" : "hover:bg-accent"
        )}
      >
        <p className={cn("truncate text-sm", isActive ? "font-medium text-primary" : "text-foreground")}>
          {session.title || "Telaah tanpa judul"}
        </p>
        <p className="text-[11px] text-muted-foreground">{formatRelativeTime(session.updated_at)}</p>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Hapus ${session.title || "telaah ini"}`}
        title="Hapus"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-opacity hover:bg-background hover:text-destructive focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

export function SessionHistory({ activeConversationId }: { activeConversationId: string | null }) {
  const { sessions, isGuest, isLoading, remove } = useChatSessions();
  const [pendingDelete, setPendingDelete] = React.useState<ChatSession | null>(null);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const deleted = await remove(pendingDelete.id);
    if (deleted && pendingDelete.id === activeConversationId) {
      openSession();
    }
  };

  return (
    <section aria-labelledby="riwayat-heading" className="flex min-h-0 flex-col">
      <h2 id="riwayat-heading" className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Riwayat telaah
      </h2>

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
      ) : (
        <ul className="no-scrollbar min-h-0 space-y-0.5 overflow-y-auto">
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              isActive={session.id === activeConversationId}
              onDelete={() => setPendingDelete(session)}
            />
          ))}
        </ul>
      )}

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
    </section>
  );
}
