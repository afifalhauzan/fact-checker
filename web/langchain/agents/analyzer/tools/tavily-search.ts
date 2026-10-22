import type { Citation, Reference } from "../schema";
import type { PreprocessedInput } from "../preprocessor";
import { findContacts, isGenericDomain } from "../../telaah-bersama/identifiers";

export type WebSearchStatus = "ok" | "empty" | "skipped_no_key" | "skipped_no_query" | "error";

export interface SearchSource {
  // "S1", "S2", ... — the only handle the model is allowed to cite.
  id: string;
  title: string;
  url: string;
  snippet: string;
}

// The thing being verified. Only sources that mention it count as evidence.
export interface SearchEntity {
  kind: "company" | "domain";
  name: string;
  acronym?: string;
}

export interface SearchTarget {
  query: string;
  entity: SearchEntity;
}

export interface WebSearchResult {
  status: WebSearchStatus;
  entity?: SearchEntity;
  // Results returned by the search engine before the relevance filter.
  retrievedCount: number;
  // Only results that mention the entity.
  sources: SearchSource[];
}

const SEARCH_TIMEOUT_MS = 8000;
const MAX_RESULTS = 5;
const PROMPT_SNIPPET_LENGTH = 400;
const UI_SNIPPET_LENGTH = 180;

// Shown when there is no web evidence. Guidance for manual checks only, never cited as evidence.
export const GUIDANCE_REFERENCES: Reference[] = [
  {
    title: "Website & Career Page Resmi Perusahaan",
    snippet:
      "Pastikan lowongan yang sama benar-benar dipublikasikan di kanal resmi perusahaan, bukan hanya di poster/chat forwarding.",
    citations: [],
  },
  {
    title: "LinkedIn Resmi Perusahaan",
    snippet: "Gunakan profil resmi untuk mencocokkan nama perusahaan, aktivitas rekrutmen, dan informasi kontak.",
    url: "https://www.linkedin.com",
    citations: [],
  },
  {
    title: "Portal Karirhub Kemnaker",
    snippet: "Gunakan sebagai salah satu pembanding lowongan resmi dan informasi ketenagakerjaan yang lebih terstruktur.",
    url: "https://karirhub.kemnaker.go.id",
    citations: [],
  },
];

// Domains that say nothing about the employer, so they are useless as a search query.
const NON_EMPLOYER_DOMAINS = [
  "bit.ly", "s.id", "tinyurl.com", "cutt.ly", "shorturl.at", "rb.gy", "linktr.ee", "lnk.bio",
  "wa.me", "whatsapp.com", "t.me", "instagram.com", "facebook.com", "fb.com", "tiktok.com",
  "twitter.com", "x.com", "linkedin.com", "youtube.com", "google.com", "forms.gle",
];

// Bare text like "S.Kom" or "Jl.Mawar" also looks like a host; only common employer TLDs count.
// shortcut: fixed TLD list, extend it when a real employer domain is missed.
const EMPLOYER_TLD = /\.(?:id|com|net|org|co|io|group|biz|info|asia|my|sg|tech|ai|app|site|online|careers|jobs)$/;

// Names stay on one line: transcribed letters put the address ("Jl. ...") on the next line.
const COMPANY_PATTERN = /\b(PT|CV)\.?[ \t]+((?:[A-Z0-9][\w&'.-]*[ \t]?){1,6})(?:\(([A-Z]{2,8})\))?/;
const COMPANY_STOPWORDS = new Set([
  "membuka", "lowongan", "loker", "kerja", "dibutuhkan", "butuh", "mencari", "segera", "hiring",
  "rekrutmen", "recruitment", "karyawan", "posisi", "untuk", "bagian", "job", "vacancy", "sedang",
  "kini", "menerima", "is", "are", "opening", "gaji", "lokasi", "kualifikasi", "syarat",
  "persyaratan", "penempatan", "domisili", "hubungi", "kirim", "daftar", "info", "jl", "jalan",
]);
// Legal suffixes that sources often drop ("PT Bank Central Asia Tbk" vs "PT Bank Central Asia").
const LEGAL_SUFFIXES = new Set(["tbk", "persero"]);

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

function normalizeForMatch(value: string): string {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

function extractCompany(text: string): SearchEntity | null {
  const match = text.match(COMPANY_PATTERN);
  if (!match) {
    return null;
  }

  const words: string[] = [];
  for (const word of match[2].trim().split(/\s+/)) {
    const bareWord = word.replace(/[.,;:]+$/, "");
    if (COMPANY_STOPWORDS.has(bareWord.toLowerCase())) {
      break;
    }
    words.push(bareWord);
    // Trailing punctuation ends the name: "PT Sukses Makmur Sentosa. Gaji 6 juta".
    if (bareWord !== word) {
      break;
    }
  }

  if (!words.length) {
    return null;
  }

  return { kind: "company", name: `${match[1].toUpperCase()} ${words.join(" ")}`, acronym: match[3] };
}

/**
 * Finds something in the posting that can actually be verified on the web: the legal company
 * name, else a non-generic employer domain. Without one, searching the posting text only returns
 * generic job-board pages that say nothing about this posting, so no search is done.
 */
export function buildVerificationQuery(preprocessed: PreprocessedInput): SearchTarget | null {
  const company = extractCompany(preprocessed.cleanedText);
  if (company) {
    return { query: `"${company.name}" lowongan kerja`, entity: company };
  }

  // Posters write sites bare ("idstar.co.id") and often only give an email, so both count
  const { identifiers } = findContacts(preprocessed.cleanedText);
  const employerDomain = [
    ...preprocessed.extractedDomains,
    ...identifiers.filter((item) => item.kind === "domain").map((item) => item.value),
    ...identifiers.filter((item) => item.kind === "email").map((item) => item.value.split("@")[1]),
  ]
    .map((domain) => domain.replace(/^www\./, ""))
    .find(
      (domain) =>
        EMPLOYER_TLD.test(domain) &&
        !isGenericDomain(domain) &&
        !NON_EMPLOYER_DOMAINS.some((generic) => domain === generic || domain.endsWith(`.${generic}`))
    );
  if (employerDomain) {
    return { query: employerDomain, entity: { kind: "domain", name: employerDomain } };
  }

  return null;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * A source is evidence only if it is about the same company or domain, judged on its title and
 * URL (snippet-only mentions are mostly listing pages about other companies). A company name must
 * match as a whole: "PT Sukses Makmur Sentosa" must not match "PT Jaya Sukses Makmur Sentosa Tbk".
 */
export function mentionsEntity(source: SearchSource, entity: SearchEntity): boolean {
  const host = hostnameOf(source.url);

  if (entity.kind === "domain") {
    const domain = entity.name.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`) || `${source.title} ${source.snippet}`.toLowerCase().includes(domain);
  }

  const [legalForm, ...nameTokens] = normalizeForMatch(entity.name).trim().split(" ");
  while (nameTokens.length && LEGAL_SUFFIXES.has(nameTokens[nameTokens.length - 1])) {
    nameTokens.pop();
  }
  if (!nameTokens.length) {
    return false;
  }

  const phrase = nameTokens.join(" ");
  const compactName = nameTokens.join("");
  const title = normalizeForMatch(source.title);
  const titleAndUrl = normalizeForMatch(`${source.title} ${source.url}`);
  const hostLabels = host.split(".").map((label) => label.replace(/[^a-z0-9]/g, ""));

  return (
    // "... PT Sukses Makmur Sentosa ..." with the legal form right before the name.
    titleAndUrl.includes(` ${legalForm} ${phrase} `) ||
    // Company sites often title pages without the legal form: "Sukses Makmur Sentosa | Karir".
    title.startsWith(` ${phrase} `) ||
    hostLabels.some((label) => label === compactName || label === `${legalForm}${compactName}`) ||
    Boolean(entity.acronym && titleAndUrl.includes(` ${entity.acronym.toLowerCase()} `))
  );
}

export async function searchWeb(target: SearchTarget | null): Promise<WebSearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return { status: "skipped_no_key", retrievedCount: 0, sources: [] };
  }
  if (!target) {
    return { status: "skipped_no_query", retrievedCount: 0, sources: [] };
  }

  const { query, entity } = target;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        max_results: MAX_RESULTS,
      }),
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error HTTP ${response.status}`);
    }

    const data = await response.json();
    const results: any[] = Array.isArray(data?.results) ? data.results : [];

    const retrieved: Array<Omit<SearchSource, "id">> = [];
    for (const item of results) {
      const url = item?.url;
      if (typeof url !== "string" || !/^https?:\/\//i.test(url) || retrieved.some((source) => source.url === url)) {
        continue;
      }
      retrieved.push({
        title: cleanText(item.title) || "Sumber web",
        url,
        snippet: truncate(cleanText(item.content), PROMPT_SNIPPET_LENGTH),
      });
      if (retrieved.length >= MAX_RESULTS) {
        break;
      }
    }

    // IDs are assigned after filtering so the model only ever sees S1..Sn of relevant sources.
    const sources: SearchSource[] = retrieved
      .filter((item) => mentionsEntity({ id: "", ...item }, entity))
      .map((item, index) => ({ id: `S${index + 1}`, ...item }));

    return { status: sources.length ? "ok" : "empty", entity, retrievedCount: retrieved.length, sources };
  } catch (error) {
    console.error("[WebSearch] Tavily request failed:", error instanceof Error ? error.message : error);
    return { status: "error", entity, retrievedCount: 0, sources: [] };
  }
}

/** Accepts the forms models produce for a source ID ("S1", "s1", "[S1]", "1") and returns "S1". */
export function normalizeSourceId(id: string): string {
  const match = id.toUpperCase().match(/S?\s*(\d+)/);
  return match ? `S${match[1]}` : id.trim().toUpperCase();
}

export function sourceToCitation(source: SearchSource, sources: SearchSource[]): Citation {
  return {
    id: `src-${source.id}`,
    label: `[${sources.indexOf(source) + 1}]`,
    title: source.title,
    link: source.url,
  };
}

export function sourcesToReferences(sources: SearchSource[]): Reference[] {
  return sources.map((source) => ({
    title: source.title,
    snippet: truncate(source.snippet, UI_SNIPPET_LENGTH),
    url: source.url,
    citations: [sourceToCitation(source, sources)],
  }));
}

export function describeSearchForProgress(result: WebSearchResult): string {
  const target = result.entity ? ` "${truncate(result.entity.name, 60)}"` : "";

  switch (result.status) {
    case "ok":
      return `Mencari jejak digital${target} di web: ${result.sources.length} dari ${result.retrievedCount} hasil membahas entitas yang sama`;
    case "empty":
      return `Mencari jejak digital${target} di web: ${result.retrievedCount} hasil ditemukan, tetapi tidak ada yang membahas entitas yang sama`;
    case "skipped_no_key":
      return "Pencarian web dilewati: layanan pencarian belum dikonfigurasi";
    case "skipped_no_query":
      return "Pencarian web dilewati: materi tidak menyebut nama perusahaan atau domain yang bisa diverifikasi";
    case "error":
      return "Pencarian web gagal, analisis dilanjutkan tanpa sumber eksternal";
  }
}
