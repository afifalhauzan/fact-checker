import { useCallback, useEffect, useState } from "react";
import { SESSION_SAVED_EVENT } from "@/lib/chat-persistence";

export interface ChatSession {
  id: string;
  title: string | null;
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

  useEffect(() => {
    void refresh();
    const handleSaved = () => void refresh();
    window.addEventListener(SESSION_SAVED_EVENT, handleSaved);
    return () => window.removeEventListener(SESSION_SAVED_EVENT, handleSaved);
  }, [refresh]);

  return { sessions, isGuest, isLoading, remove };
}
