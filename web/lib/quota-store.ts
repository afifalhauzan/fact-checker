"use client";

import { create } from "zustand";
import toast from "react-hot-toast";
import type { QuotaBlock, QuotaState } from "@/lib/quota";

// The viewer's TelaahLoker quota as the profile popup and the chat show it. Updated after every
// answer (the chat route streams the new state) and fetched when a page needs it.

export interface ViewerQuota extends QuotaState {
  // Guests: the one session this browser may use, if it has started
  guestSessionId?: string | null;
}

interface QuotaStore {
  quota: ViewerQuota | null;
  refresh: (conversationId?: string | null) => Promise<void>;
  // An update from the chat stream: also tells the viewer when a limit is reached
  apply: (next: QuotaState) => void;
}

export const SESSION_WARNING_SHARE = 0.8;

export function sessionShare(quota: QuotaState | null): number {
  return quota && !quota.exempt && quota.sessionBudget > 0 ? quota.sessionTokens / quota.sessionBudget : 0;
}

export function sessionsLeft(quota: QuotaState | null): number | null {
  if (!quota || quota.guest || quota.exempt || quota.sessionsLimit === undefined) return null;
  return Math.max(0, quota.sessionsLimit - (quota.sessionsUsed ?? 0));
}

export const useQuotaStore = create<QuotaStore>((set, get) => ({
  quota: null,

  refresh: async (conversationId) => {
    try {
      const query = conversationId ? `?conversation_id=${encodeURIComponent(conversationId)}` : "";
      const response = await fetch(`/api/quota${query}`, { cache: "no-store" });
      if (!response.ok) return;
      const fresh: ViewerQuota = await response.json();
      // Without a session (e.g. from the profile popup) the open session's usage stays as it was
      const sessionTokens = conversationId ? fresh.sessionTokens : (get().quota?.sessionTokens ?? 0);
      set({ quota: { ...fresh, sessionTokens } });
    } catch {
      // The display is a convenience; the chat route enforces the limits either way
    }
  },

  apply: (next) => {
    const previous = get().quota;
    set({ quota: { ...previous, ...next } });

    const before = previous ? sessionShare(previous) : 0;
    const after = sessionShare(next);
    if (after >= 1 && before < 1) {
      toast("Sesi ini sudah penuh. Lanjutkan di sesi baru untuk bertanya lagi.", { icon: "⏳", duration: 6000 });
    } else if (after >= SESSION_WARNING_SHARE && before < SESSION_WARNING_SHARE) {
      toast(`Sesi ini sudah terpakai ${Math.round(after * 100)}%.`, { icon: "⚠️" });
    }

    // Only on the answer that opened the day's last session, not on later turns in it
    if (previous && sessionsLeft(next) === 0 && (next.sessionsUsed ?? 0) > (previous.sessionsUsed ?? 0)) {
      toast("Ini sesi terakhirmu hari ini. Kuota direset pukul 00.00 WIB.", { icon: "ℹ️", duration: 6000 });
    }
  },
}));

const BLOCKED_TOASTS: Record<QuotaBlock, string> = {
  guest_limit: "Masuk untuk lanjut memakai TelaahLoker.",
  guest_ip_limit: "Masuk untuk lanjut memakai TelaahLoker.",
  daily_limit: "Kuota sesi hari ini habis. Direset pukul 00.00 WIB.",
  session_full: "Sesi ini sudah penuh. Lanjutkan di sesi baru.",
};

export function notifyBlocked(reason: QuotaBlock): void {
  toast.error(BLOCKED_TOASTS[reason], { duration: 6000 });
}
