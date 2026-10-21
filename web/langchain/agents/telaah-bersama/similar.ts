// Relative paths: eval scripts run this through jiti, which does not resolve the "@/" alias.
import { backendFetch, internalKeyHeader } from "../../../lib/server-auth";
import type { TelaahPost } from "../../../lib/telaah-bersama/types";
import { materialDayKeys } from "../analyzer/dates";
import { detectSignals } from "../analyzer/signals";
import { embedText, embeddingTextFor } from "./embeddings";
import { findContacts, isGenericDomain, type Identifier, type IdentifierKind } from "./identifiers";
import { toMaterialLines } from "./share-payload";

// "Sudah ditelaah sebelumnya" (design doc 6.2): a tool outside the analysis engine that offers an
// existing post before web search and the model run, purely to save their cost. A match never
// feeds into a verdict. Laravel returns candidates; they are scored here.

// Calibrated with eval/similar-match.ts on the seed posts (design doc 7.2): unrelated postings
// reached 0.896 there and reworded copies of a seed post 0.965+, so the bar sits between them.
export const COSINE_THRESHOLD = 0.92;
// A shared phone, account, email, or link is strong evidence on its own; the text only has to be related.
export const COSINE_WITH_SHARED_CONTACT = 0.6;
const SHARED_CONTACT_BONUS = 0.3;
const PERIOD_BONUS = 0.05;
const PERIOD_MARGIN_DAYS = 14;
const DEFAULT_PERIOD_DAYS = 60;
const SIMILAR_TIMEOUT_MS = 2_500;

const SHARED_LABELS: Record<IdentifierKind, string> = {
  phone: "Nomor WA/HP sama",
  email: "Email sama",
  account: "Rekening tujuan sama",
  domain: "Link atau domain sama",
};

export interface SimilarCandidate {
  post: TelaahPost;
  cosine: number | null;
  sharedIdentifiers: Identifier[];
  identifiers: Identifier[];
}

export interface SimilarMatch {
  post: TelaahPost;
  score: number;
  reasons: string[];
  // Same template, but advertised for another period: shown as an earlier version.
  differentPeriod: boolean;
}

export interface MaterialFeatures {
  text: string;
  identifiers: Identifier[];
  dayKeys: string[];
}

function officialDomains(identifiers: Identifier[]): Set<string> {
  return new Set(
    identifiers
      .filter((item) => item.kind === "domain" && !item.value.includes("/") && !isGenericDomain(item.value))
      .map((item) => item.value)
  );
}

function normalizeCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(pt|cv|tbk|persero|\(persero\))\b|[().,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** null when either side has no dates; otherwise whether a material date falls in the post's period. */
function periodOverlaps(post: TelaahPost, dayKeys: string[]): boolean | null {
  const start = post.openDate ?? (post.closeDate ? addDays(post.closeDate, -DEFAULT_PERIOD_DAYS) : null);
  const end = post.closeDate ?? (post.openDate ? addDays(post.openDate, DEFAULT_PERIOD_DAYS) : null);
  if (!start || !end || !dayKeys.length) return null;

  const from = addDays(start, -PERIOD_MARGIN_DAYS);
  const to = addDays(end, PERIOD_MARGIN_DAYS);
  return dayKeys.some((day) => day >= from && day <= to);
}

/** The match with its reasons, or null when the candidate should not be offered. */
export function scoreCandidate(candidate: SimilarCandidate, material: MaterialFeatures): SimilarMatch | null {
  const { post } = candidate;

  // Official posting vs. a fake one copying it (6.2 step 5). The material carries its own site and
  // the post does not share it: either the post names the same company, or it points to another
  // site of its own. Fakes that impersonate a ministry often name no company at all.
  const shared = candidate.sharedIdentifiers;
  const ownDomains = officialDomains(material.identifiers);
  const postDomains = officialDomains(candidate.identifiers);
  const sharesDomain = [...ownDomains].some((domain) => postDomains.has(domain));
  const sameCompany = !!post.company && material.text.toLowerCase().includes(normalizeCompany(post.company));
  if (ownDomains.size && !sharesDomain && (sameCompany || (postDomains.size && !shared.length))) {
    return null;
  }

  const cosine = candidate.cosine;
  const isMatch = shared.length
    ? cosine === null || cosine >= COSINE_WITH_SHARED_CONTACT
    : cosine !== null && cosine >= COSINE_THRESHOLD;
  if (!isMatch) return null;

  const reasons = [...new Set(shared.map((item) => SHARED_LABELS[item.kind]))];
  if (cosine !== null && cosine >= COSINE_THRESHOLD) reasons.push("Isi lowongan sangat mirip");

  const overlap = periodOverlaps(post, material.dayKeys);
  if (overlap) reasons.push("Periode pendaftaran tumpang-tindih");
  if (overlap === false) reasons.push("Versi sebelumnya, periode berbeda");

  return {
    post,
    score: (cosine ?? COSINE_WITH_SHARED_CONTACT) + (shared.length ? SHARED_CONTACT_BONUS : 0) + (overlap ? PERIOD_BONUS : 0),
    reasons,
    differentPeriod: overlap === false,
  };
}

export function pickBestMatch(candidates: SimilarCandidate[], material: MaterialFeatures): SimilarMatch | null {
  let best: SimilarMatch | null = null;
  for (const candidate of candidates) {
    const match = scoreCandidate(candidate, material);
    if (match && (!best || match.score > best.score)) best = match;
  }
  return best;
}

export function materialFeatures(materialText: string): MaterialFeatures {
  return {
    text: materialText,
    identifiers: findContacts(materialText).identifiers,
    dayKeys: materialDayKeys(materialText),
  };
}

/** Strong rule signals in the user's own material, shown next to the match (design doc decision 6). */
export function ownSignalLabels(materialText: string): string[] {
  return detectSignals(materialText)
    .filter((signal) => signal.severity === "strong")
    .map((signal) => (signal.evidence[0] ? `${signal.label}: “${signal.evidence[0]}”` : signal.label));
}

export interface SimilarRunMeta {
  status: "matched" | "no_match" | "error";
  candidateCount: number;
  ms: number;
}

/** Looks for an existing post on the same posting. Any failure means "no match": the pipeline then just runs. */
export async function findSimilarTelaah(materialText: string): Promise<{ match: SimilarMatch | null; meta: SimilarRunMeta }> {
  const startedAt = Date.now();
  const signal = AbortSignal.timeout(SIMILAR_TIMEOUT_MS);
  const features = materialFeatures(materialText);

  try {
    const embedding = await embedText(embeddingTextFor(toMaterialLines(materialText)), signal);
    if (!embedding && !features.identifiers.length) {
      return { match: null, meta: { status: "no_match", candidateCount: 0, ms: Date.now() - startedAt } };
    }

    const response = await backendFetch("/telaah-bersama/similar", {
      method: "POST",
      headers: internalKeyHeader(),
      body: JSON.stringify({ embedding, identifiers: features.identifiers }),
      signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`similar returned ${response.status}`);

    const candidates: SimilarCandidate[] = (await response.json()).data ?? [];
    const match = pickBestMatch(candidates, features);
    return {
      match,
      meta: { status: match ? "matched" : "no_match", candidateCount: candidates.length, ms: Date.now() - startedAt },
    };
  } catch (error) {
    console.error("[SimilarTelaah] Check failed, running the analysis:", error instanceof Error ? error.message : error);
    return { match: null, meta: { status: "error", candidateCount: 0, ms: Date.now() - startedAt } };
  }
}

/** Counts the offer on the post (Laravel keeps it to once per viewer per day). Fire and forget. */
export function recordMatchShown(postId: number, viewerKey: string): void {
  void backendFetch(`/telaah-bersama/${postId}/matched`, {
    method: "POST",
    headers: internalKeyHeader(),
    body: JSON.stringify({ viewer_key: viewerKey }),
  }).catch(() => undefined);
}
