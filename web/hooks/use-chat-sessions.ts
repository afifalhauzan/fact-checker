import { useCallback, useEffect, useState } from "react";
import { SESSION_SAVED_EVENT } from "@/lib/chat-persistence";

export interface ChatSession {
  id: string;
  title: string | null;
  pinned_at: string | null;
  updated_at: string;
}

/** The signed-in user's saved sessions; refreshed whenever an exchange is saved. Guests have none. */
export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/sessions", { cache: "no-store" });
      const body = await response.json();
      setIsGuest(Boolean(body?.guest));
      setSessions(Array.isArray(body?.data) ? body.data : []);
    } catch (error) {
      console.error("[ChatSessions] Failed to load sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const response = await fetch(`/api/chat/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) {
      setSessions((current) => current.filter((session) => session.id !== id));
    }
    return response.ok;
  }, []);

  // Optimistic: the pin shows at once and is rolled back if saving fails.
  const setPinned = useCallback(async (id: string, pinned: boolean): Promise<boolean> => {
    const apply = (value: boolean) =>
      setSessions((current) =>
        current.map((session) => (session.id === id ? { ...session, pinned_at: value ? new Date().toISOString() : null } : session))
      );
    apply(pinned);
    const response = await fetch(`/api/chat/sessions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    }).catch(() => null);
    if (!response?.ok) apply(!pinned);
    return !!response?.ok;
  }, []);

  useEffect(() => {
    void refresh();
    const handleSaved = () => void refresh();
    window.addEventListener(SESSION_SAVED_EVENT, handleSaved);
    return () => window.removeEventListener(SESSION_SAVED_EVENT, handleSaved);
  }, [refresh]);

  return { sessions, isGuest, isLoading, remove, setPinned };
}
