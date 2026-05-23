export const LANDING_CHAT_HANDOFF_KEY = "landing-chat-handoff-v1";

export interface LandingAttachmentDraft {
  id: string;
  filename?: string;
  mediaType: string;
  url: string;
  size?: number;
}

export interface LandingChatDraft {
  text: string;
  attachments: LandingAttachmentDraft[];
  createdAt: number;
}

const MAX_DRAFT_AGE_MS = 15 * 60 * 1000;

export function saveLandingChatDraft(draft: Omit<LandingChatDraft, "createdAt">): void {
  if (typeof window === "undefined") return;

  const payload: LandingChatDraft = {
    ...draft,
    createdAt: Date.now(),
  };

  window.localStorage.setItem(LANDING_CHAT_HANDOFF_KEY, JSON.stringify(payload));
}

export function readLandingChatDraft(): LandingChatDraft | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(LANDING_CHAT_HANDOFF_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LandingChatDraft;
    const isExpired = Date.now() - parsed.createdAt > MAX_DRAFT_AGE_MS;

    if (
      !parsed ||
      typeof parsed.text !== "string" ||
      !Array.isArray(parsed.attachments) ||
      typeof parsed.createdAt !== "number" ||
      isExpired
    ) {
      window.localStorage.removeItem(LANDING_CHAT_HANDOFF_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(LANDING_CHAT_HANDOFF_KEY);
    return null;
  }
}

export function clearLandingChatDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LANDING_CHAT_HANDOFF_KEY);
}
