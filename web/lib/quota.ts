import type { NextRequest } from "next/server";
// Relative paths: the unit tests import this without the "@/" alias
import { backendFetch, clientIpHeader, getAccessToken, internalKeyHeader } from "./server-auth";
import { hasValidSignature, sign } from "../langchain/agents/telaah-bersama/share-payload";
import type { TokenUsage } from "../langchain/agents/analyzer/llm";

// TelaahLoker usage limits, enforced here before any model call (Laravel keeps the counts):
// a guest gets one session per browser, an account five new sessions a day, and every session a
// token budget. Our prompts do not grow with a session (follow-ups use the posting, the analysis and
// the last turns), so the budget is about fair use, not the model's context window.

export const SESSION_TOKEN_BUDGET = Number(process.env.QUOTA_SESSION_TOKENS) || 40_000;
export const GUEST_COOKIE = "telaah-guest-session";
const GUEST_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

export type QuotaBlock = "guest_limit" | "guest_ip_limit" | "daily_limit" | "session_full";

export interface QuotaState {
  guest: boolean;
  // Accounts only
  sessionsUsed?: number;
  sessionsLimit?: number;
  resetsAt?: string;
  exempt?: boolean;
  sessionTokens: number;
  sessionBudget: number;
}

export interface SessionOpening {
  state: QuotaState | null;
  blocked?: QuotaBlock;
  // Set on the response when a guest starts their one session
  guestCookie?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Prefixed so a guest cookie can never pass as another signed value
export const signGuest = (sessionId: string) => `${sessionId}.${sign(`guest-session:${sessionId}`)}`;

/** The session id in a guest cookie, or null when it is missing or was not signed here. */
export function guestSessionOf(cookie: string | undefined): string | null {
  const [sessionId, signature] = cookie?.split(".") ?? [];
  return sessionId && signature && UUID.test(sessionId) && hasValidSignature(`guest-session:${sessionId}`, signature)
    ? sessionId
    : null;
}

export function guestCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: GUEST_COOKIE_MAX_AGE };
}

function quotaHeaders(req: NextRequest) {
  return { ...internalKeyHeader(), ...clientIpHeader(req) };
}

/**
 * Opens the session for a model call, or says why it may not run. If Laravel cannot be reached the
 * call goes ahead uncounted: the quota must not take TelaahLoker down with it.
 */
export async function openSession(req: NextRequest, conversationId: string | undefined): Promise<SessionOpening> {
  const token = getAccessToken(req);
  // Older clients send no session id; they are left unmetered rather than broken
  if (!conversationId || !UUID.test(conversationId)) return { state: null };

  const guestSession = token ? null : guestSessionOf(req.cookies.get(GUEST_COOKIE)?.value);
  if (!token && guestSession && guestSession !== conversationId) {
    return { state: null, blocked: "guest_limit" };
  }

  try {
    const response = await backendFetch(`/quota/sessions/${conversationId}/start`, {
      method: "POST",
      token,
      headers: quotaHeaders(req),
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 429) {
      return { state: toState(body), blocked: body.reason === "guest_ip_limit" ? "guest_ip_limit" : "daily_limit" };
    }
    if (!response.ok) throw new Error(`quota start returned ${response.status}`);

    const state = toState(body);
    return {
      state,
      blocked: !state.exempt && state.sessionTokens >= SESSION_TOKEN_BUDGET ? "session_full" : undefined,
      guestCookie: !token && !guestSession ? signGuest(conversationId) : undefined,
    };
  } catch (error) {
    console.error("[Quota] Could not open the session, running it unmetered:", error instanceof Error ? error.message : error);
    return { state: null };
  }
}

/** Adds what the model calls of one turn used to the session. Returns the updated state. */
export async function chargeSession(
  req: NextRequest,
  conversationId: string | undefined,
  state: QuotaState | null,
  usages: Array<TokenUsage | undefined>
): Promise<QuotaState | null> {
  const tokens = usages.reduce((sum, usage) => sum + (usage?.total ?? 0), 0);
  if (!state || !conversationId || tokens === 0) return state;

  try {
    const response = await backendFetch(`/quota/sessions/${conversationId}/usage`, {
      method: "POST",
      token: getAccessToken(req),
      headers: quotaHeaders(req),
      body: JSON.stringify({ tokens }),
    });
    if (!response.ok) throw new Error(`quota usage returned ${response.status}`);
    return { ...state, sessionTokens: (await response.json()).sessionTokens ?? state.sessionTokens + tokens };
  } catch (error) {
    console.error("[Quota] Could not record usage:", error instanceof Error ? error.message : error);
    return state;
  }
}

export function toState(body: any): QuotaState {
  return {
    guest: !!body?.guest,
    sessionsUsed: body?.sessionsUsed,
    sessionsLimit: body?.sessionsLimit,
    resetsAt: body?.resetsAt,
    exempt: body?.exempt,
    sessionTokens: Number(body?.sessionTokens) || 0,
    sessionBudget: SESSION_TOKEN_BUDGET,
  };
}
