// Relative paths: eval scripts run this through jiti, which does not resolve the "@/" alias.
import { backendFetch, internalKeyHeader } from "../../../lib/server-auth";
import type { TelaahPost } from "../../../lib/telaah-bersama/types";
import { materialDayKeys } from "../analyzer/dates";
import { detectSignals } from "../analyzer/signals";
import { findContacts, isGenericDomain, type Identifier, type IdentifierKind } from "./identifiers";
import { toMaterialLines } from "./share-payload";

// "Sudah ditelaah sebelumnya" (design doc 6.2): a tool outside the analysis engine that offers an
// existing post before web search and the model run, purely to save their cost. A match never
// feeds into a verdict. Laravel returns candidates; they are matched here by three rules:
//   1. a shared phone, bank account, email, or link;
//   2. nearly identical text (trigram similarity, for copy-pasted templates that name no company);
//   3. the same company and position, backed by an overlapping period or the same source account.

// Trigram similarity of the whole material. Calibrated with eval/similar-match.ts (design doc 7.2).
export const TEXT_SIMILARITY_THRESHOLD = 0.5;
const PERIOD_MARGIN_DAYS = 14;
const DEFAULT_PERIOD_DAYS = 60;
// The candidate query usually takes well under a second but is slow on a cold start; the
// analysis it can skip takes 10-40 s, so a generous budget still pays off.
const SIMILAR_TIMEOUT_MS = 6_000;

const SHARED_LABELS: Record<IdentifierKind, string> = {
  phone: "Nomor WA/HP sama",
  email: "Email sama",
  account: "Rekening tujuan sama",
  domain: "Link atau domain sama",
};

export interface SimilarCandidate {
  post: TelaahPost;
  // Trigram similarity of the material texts (0-1); null where the database has no pg_trgm.
  textSimilarity: number | null;
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
  const text = material.text.toLowerCase();
  const sameCompany = !!post.company && text.includes(normalizeCompany(post.company));
  if (ownDomains.size && !sharesDomain && (sameCompany || (postDomains.size && !shared.length))) {
    return null;
  }

  const overlap = periodOverlaps(post, material.dayKeys);
  const samePosition = !!post.position && text.includes(post.position.toLowerCase());
  // A "source" that only repeats the company name would make the company rule back itself up
  const sourceIsCompany = !!post.company && normalizeCompany(post.source.account ?? "") === normalizeCompany(post.company);
  const sameSource = !!post.source.account && !sourceIsCompany && text.includes(post.source.account.toLowerCase());

  const byContact = shared.length > 0;
  const byText = (candidate.textSimilarity ?? 0) >= TEXT_SIMILARITY_THRESHOLD;
  // Company and position alone are what an impersonating fake copies, so they need backing
  const byCompany = sameCompany && samePosition && (overlap === true || sameSource);
  if (!byContact && !byText && !byCompany) return null;

  const reasons = [...new Set(shared.map((item) => SHARED_LABELS[item.kind]))];
  if (byText) reasons.push("Isi lowongan hampir sama");
  if (byCompany) reasons.push("Perusahaan dan posisi sama");
  if (sameSource) reasons.push("Sumber lowongan sama");
  if (overlap) reasons.push("Periode pendaftaran tumpang-tindih");
  if (overlap === false) reasons.push("Versi sebelumnya, periode berbeda");

  return {
    post,
    // Strongest evidence first when several posts match: a shared contact, then text, then company
    score: (byContact ? 2 : 0) + (candidate.textSimilarity ?? 0) + (byCompany ? 1 : 0) + (overlap ? 0.05 : 0),
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
    // Compared the way posts store it: redacted lines joined by newlines
    const text = toMaterialLines(materialText).join("\n");
    if (!text) {
      return { match: null, meta: { status: "no_match", candidateCount: 0, ms: Date.now() - startedAt } };
    }

    const response = await backendFetch("/telaah-bersama/similar", {
      method: "POST",
      headers: internalKeyHeader(),
      body: JSON.stringify({ text, identifiers: features.identifiers }),
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
