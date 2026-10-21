import { SquarePen } from "lucide-react";
import { cn } from "@/utils/utils";
import { SessionHistory, openSession } from "@/components/sidebar/session-history";

/**
 * A panel beside the chat. On desktop it slides open in the layout; on phones it overlays the chat.
 * Its open/close toggle lives in the chat toolbar, so the toggle never moves.
 */
export function SidePanel({
  side,
  isOpen,
  isMobile,
  label,
  onClose,
  children,
}: {
  side: "left" | "right";
  isOpen: boolean;
  isMobile: boolean;
  label: string;
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

  return (
    <aside
      aria-label={label}
      aria-hidden={!isOpen}
      className={cn(
        "relative h-full shrink-0 overflow-hidden bg-muted/40 transition-[width] duration-300 ease-out",
        side === "left" ? "border-r" : "border-l",
        isOpen ? "w-[280px] border-border" : "w-0 border-transparent"
      )}
    >
      <div className={cn("flex h-full w-[280px] flex-col overflow-y-auto p-4", !isOpen && "invisible")}>{children}</div>
    </aside>
  );
}

export function HistoryPanel({ activeConversationId }: { activeConversationId: string | null }) {
  return (
    <>
      <button
        type="button"
        onClick={() => openSession()}
        className="mb-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <SquarePen className="h-4 w-4" />
        Telaah baru
      </button>
      <div className="flex min-h-0 flex-1 flex-col">
        <SessionHistory activeConversationId={activeConversationId} />
      </div>
    </>
  );
}
