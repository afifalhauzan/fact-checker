import { stripUrlQuery } from "../analyzer/redaction";

// Contact details in a posting, in two forms: as written (shown on the post) and normalized
// (used to recognise the same scam spelled differently, e.g. "+62 812-..." vs "0812...").

export type IdentifierKind = "phone" | "email" | "account" | "domain";

export interface Identifier {
  kind: IdentifierKind;
  value: string;
}

export interface ContactFinding {
  // As written in the material, for display.
  contacts: Identifier[];
  // Normalized, for matching.
  identifiers: Identifier[];
}

// Job boards host everyone's postings: the posting is the path (glints.com/id/opportunities/jobs/<id>).
const JOB_BOARDS = new Set([
  "glints.com", "jobstreet.co.id", "id.jobstreet.com", "jobstreet.com", "linkedin.com", "id.linkedin.com", "kalibrr.id",
  "kalibrr.com", "indeed.com", "id.indeed.com", "karirhub.kemnaker.go.id", "loker.id", "karir.com", "dealls.com",
]);
// Free mail, shorteners, chat links, and job boards say nothing about who runs them on their own.
const GENERIC_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "yahoo.co.id", "hotmail.com", "outlook.com", "ymail.com", "icloud.com", "proton.me",
  "bit.ly", "s.id", "tinyurl.com", "linktr.ee", "forms.gle", "docs.google.com", "wa.me", "t.me", "chat.whatsapp.com",
  "instagram.com", "facebook.com", "tiktok.com", "x.com", "twitter.com", "youtube.com", "google.com",
  ...JOB_BOARDS,
]);
// For these, the path is what identifies the scam (bit.ly/daftar-xyz, t.me/grupnya) or the posting.
const PATH_IDENTIFIES = new Set(["bit.ly", "s.id", "tinyurl.com", "linktr.ee", "forms.gle", "wa.me", "t.me", "chat.whatsapp.com", ...JOB_BOARDS]);

/** A link to one posting on a job board (the normalized value from findContacts). */
export function isJobBoardPosting(value: string): boolean {
  const [host, ...path] = value.split("/");
  return JOB_BOARDS.has(host) && path.length > 0;
}

const PHONE = /(?<![\d+])(?:\+?62|0)[\s.-]?8\d(?:[\s.-]?\d){6,11}(?!\d)/g;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
// Not right after "@": "@loker.bumn.id" is a social media handle, not a website.
const URL = /(?<![@\w.-])(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9-]+\.)+[a-z]{2,})(\/[^\s,;)"']*)?/gi;
const BANKS = "BRI|BCA|BNI|Mandiri|BSI|CIMB(?: Niaga)?|Danamon|Permata|BTN|Jago|SeaBank|Muamalat|DANA|OVO|GoPay|ShopeePay";
const ACCOUNT = new RegExp(`\\b(${BANKS})\\b[^\\d\\n]{0,25}((?:\\d[\\s.-]?){7,18}\\d)`, "gi");

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
}

export function isGenericDomain(host: string): boolean {
  return GENERIC_DOMAINS.has(host.toLowerCase().replace(/^www\./, ""));
}

function normalizeLink(host: string, path: string | undefined): string {
  const cleanHost = host.toLowerCase().replace(/^www\./, "");
  const cleanPath = stripUrlQuery(path ?? "")
    .replace(/\/+$/, "")
    // "…/jobs/<id>/share/<sharer>": the same posting, whoever shared it
    .replace(/\/share\/[^/]+$/i, "")
    .toLowerCase();
  return PATH_IDENTIFIES.has(cleanHost) && cleanPath ? `${cleanHost}${cleanPath}` : cleanHost;
}

/** Finds phone numbers, emails, bank accounts, and domains in posting material. */
export function findContacts(text: string): ContactFinding {
  const contacts: Identifier[] = [];
  const identifiers: Identifier[] = [];
  const seen = new Set<string>();

  const add = (kind: IdentifierKind, shown: string, value: string) => {
    if (!value || seen.has(`${kind}|${value}`)) return;
    seen.add(`${kind}|${value}`);
    contacts.push({ kind, value: shown.trim() });
    identifiers.push({ kind, value });
  };

  // Emails are matched first and blanked out, so their domains are not read again as links.
  let withoutEmails = text;
  for (const email of text.match(EMAIL) ?? []) {
    add("email", email, email.toLowerCase());
    withoutEmails = withoutEmails.replace(email, " ");
  }

  for (const match of withoutEmails.matchAll(PHONE)) {
    add("phone", match[0], normalizePhone(match[0]));
  }
  for (const match of text.matchAll(ACCOUNT)) {
    add("account", `${match[1]} ${match[2]}`, `${match[1].toLowerCase()}:${match[2].replace(/\D/g, "")}`);
  }
  for (const match of withoutEmails.matchAll(URL)) {
    // Skip decimals and amounts like "Rp1.350.000" that look like hosts with digit labels.
    if (/^[\d.]+$/.test(match[1].replace(/\.[a-z]{2,}$/i, ""))) continue;
    const value = normalizeLink(match[1], match[2]);
    // A bare "glints.com" or "instagram.com" is shared by unrelated postings
    if (isGenericDomain(value)) continue;
    add("domain", match[0], value);
  }

  return { contacts, identifiers };
}

/** Links in the material, without query strings, for the "Link" section of a post. */
export function findLinks(text: string): string[] {
  const links = new Set<string>();
  for (const match of text.matchAll(URL)) {
    if (/^https?:\/\//i.test(match[0]) || match[2]) {
      const url = /^https?:\/\//i.test(match[0]) ? match[0] : `https://${match[0]}`;
      links.add(stripUrlQuery(url).replace(/[.,]+$/, ""));
    }
  }
  return [...links];
}
