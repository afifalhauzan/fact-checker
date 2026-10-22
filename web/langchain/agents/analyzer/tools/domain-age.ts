// Registration date of the domains a posting points to, from RDAP (the public successor of WHOIS;
// rdap.org forwards to the registry, including PANDI for .id). A recruitment site registered a few
// weeks ago is a warning sign; an old one proves nothing on its own.

const RDAP_TIMEOUT_MS = 5000;
const MAX_DOMAINS = 2;
export const NEW_DOMAIN_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Suffixes under which the registered name has three labels (idstar.co.id, not co.id).
// shortcut: a hand-picked list instead of the Public Suffix List; extend it when a domain is misread.
const SECOND_LEVEL_SUFFIXES = new Set([
  "co.id", "go.id", "ac.id", "or.id", "web.id", "sch.id", "my.id", "biz.id", "net.id", "mil.id", "desa.id", "ponpes.id",
  "co.uk", "com.sg", "com.my", "com.au", "co.jp", "com.ph", "com.vn", "co.th", "com.kh", "com.mm", "com.hk", "com.tw",
]);
// Free hosting: the platform's domain is old, so its age says nothing about the site on it.
const HOSTING_SUFFIXES = [
  "vercel.app", "netlify.app", "github.io", "pages.dev", "web.app", "firebaseapp.com", "blogspot.com", "wordpress.com",
  "wixsite.com", "weebly.com", "carrd.co", "glitch.me", "herokuapp.com", "000webhostapp.com",
];

export interface DomainAge {
  domain: string;
  // ISO date, or null when the registry did not answer.
  registeredAt: string | null;
}

/** The registered domain behind a host ("career.idstar.co.id" -> "idstar.co.id"), or null for free hosting. */
export function registrableDomain(host: string): string | null {
  const clean = host.toLowerCase().replace(/^www\./, "");
  if (HOSTING_SUFFIXES.some((suffix) => clean === suffix || clean.endsWith(`.${suffix}`))) return null;

  const labels = clean.split(".");
  const keep = SECOND_LEVEL_SUFFIXES.has(labels.slice(-2).join(".")) ? 3 : 2;
  return labels.length >= keep ? labels.slice(-keep).join(".") : null;
}

export function domainAgeDays(registeredAt: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(registeredAt).getTime()) / MS_PER_DAY);
}

async function lookupDomainAge(domain: string): Promise<DomainAge> {
  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      // rdap.org answers 403 to clients without a User-Agent of their own
      headers: { Accept: "application/rdap+json", "User-Agent": "TelaahKarier/1.0 (+https://telaahkarier.com)" },
      signal: AbortSignal.timeout(RDAP_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`RDAP HTTP ${response.status}`);

    const events: Array<{ eventAction?: string; eventDate?: string }> = (await response.json())?.events ?? [];
    const registration = events.find((event) => event.eventAction === "registration")?.eventDate;
    return { domain, registeredAt: registration && !Number.isNaN(Date.parse(registration)) ? registration : null };
  } catch (error) {
    console.error(`[DomainAge] ${domain}:`, error instanceof Error ? error.message : error);
    return { domain, registeredAt: null };
  }
}

/** Looks up the first few distinct registered domains among the given hosts. */
export async function lookupDomainAges(hosts: string[]): Promise<DomainAge[]> {
  const domains = [...new Set(hosts.flatMap((host) => registrableDomain(host) ?? []))].slice(0, MAX_DOMAINS);
  return Promise.all(domains.map(lookupDomainAge));
}

export function describeDomainAgesForProgress(ages: DomainAge[], now: Date = new Date()): string | null {
  if (!ages.length) return null;
  const parts = ages.map(({ domain, registeredAt }) =>
    registeredAt ? `${domain} terdaftar ${domainAgeDays(registeredAt, now)} hari lalu` : `${domain} tidak dapat diperiksa`
  );
  return `Memeriksa umur domain: ${parts.join(", ")}`;
}
