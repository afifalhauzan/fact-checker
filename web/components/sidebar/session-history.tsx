"use client";

import { Pin, PinOff, Trash2 } from "lucide-react";
import { cn } from "@/utils/utils";
import { formatRelativeTime } from "@/utils/formatters";
import type { ChatSession } from "@/hooks/use-chat-sessions";

// A full navigation reloads the chat state cleanly; StreamingContext loads history once per page.
export function openSession(id?: string) {
  window.location.assign(id ? `/chat?conversation_id=${encodeURIComponent(id)}` : "/chat");
}

const ROW_ACTION =
  "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100";

function SessionRow({
  session,
  isActive,
  onTogglePin,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onTogglePin: () => void;
  onDelete: () => void;
}) {
  const title = session.title || "Telaah tanpa judul";
  const isPinned = !!session.pinned_at;

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={() => !isActive && openSession(session.id)}
        aria-current={isActive ? "page" : undefined}
        className={cn("w-full rounded-lg px-3 py-2 pr-16 text-left transition-colors", isActive ? "bg-primary/10" : "hover:bg-accent")}
      >
        <p className={cn("truncate text-sm", isActive ? "font-medium text-primary" : "text-foreground")}>{title}</p>
        <p className="text-[11px] text-muted-foreground">{formatRelativeTime(session.updated_at)}</p>
      </button>
      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={isPinned ? `Lepas sematan ${title}` : `Sematkan ${title}`}
          title={isPinned ? "Lepas sematan" : "Sematkan"}
          className={cn(ROW_ACTION, "hover:text-primary")}
        >
          {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Hapus ${title}`}
          title="Hapus"
          className={cn(ROW_ACTION, "hover:text-destructive")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

/** One titled group of sessions in the sidebar, e.g. "Disematkan" or "Riwayat telaah". */
export function SessionList({
  title,
  sessions,
  activeConversationId,
  onTogglePin,
  onDelete,
}: {
  title: string;
  sessions: ChatSession[];
  activeConversationId: string | null;
  onTogglePin: (session: ChatSession) => void;
  onDelete: (session: ChatSession) => void;
}) {
  return (
    <section aria-label={title} className="flex flex-col">
      <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</h2>
      <ul className="space-y-0.5">
        {sessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            isActive={session.id === activeConversationId}
            onTogglePin={() => onTogglePin(session)}
            onDelete={() => onDelete(session)}
          />
        ))}
      </ul>
    </section>
  );
}
