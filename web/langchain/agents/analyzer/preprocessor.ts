export interface PreprocessedInput {
  rawInput: string;
  cleanedText: string;
  extractedUrls: string[];
  extractedDomains: string[];
  hasShortlink: boolean;
  hasFreeEmailDomain: boolean;
  hasSubstantiveContent: boolean;
}

const SHORTLINK_DOMAINS = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "linktr.ee", "wa.me", "api.whatsapp.com"];
const FREE_EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "ymail.com"];
const JOB_SIGNAL_KEYWORDS = [
  "lowongan", "loker", "posisi", "gaji", "perusahaan", "pt ", "cv ",
  "recruiter", "rekrutmen", "hr", "wawancara", "interview", "lamar",
  "job", "vacancy", "hiring", "career", "salary", "wa ", "whatsapp",
];
const MIN_SUBSTANTIVE_LENGTH = 25;

export function preprocessJobInput(input: string): PreprocessedInput {
  const rawInput = input || "";
  const cleanedText = rawInput.trim();

  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = cleanedText.match(urlRegex) || [];
  const extractedUrls = Array.from(new Set(matches));

  const extractedDomains: string[] = [];
  let hasShortlink = false;

  for (const urlStr of extractedUrls) {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();
      extractedDomains.push(host);

      if (SHORTLINK_DOMAINS.some((domain) => host.includes(domain))) {
        hasShortlink = true;
      }
    } catch {
      // Invalid URL format, ignore
    }
  }

  const lowerText = cleanedText.toLowerCase();
  const hasFreeEmailDomain = FREE_EMAIL_DOMAINS.some((domain) => lowerText.includes(`@${domain}`));

  const hasJobSignal = JOB_SIGNAL_KEYWORDS.some((keyword) => lowerText.includes(keyword));
  const hasSubstantiveContent =
    extractedUrls.length > 0 || hasJobSignal || cleanedText.length >= MIN_SUBSTANTIVE_LENGTH;

  return {
    rawInput,
    cleanedText,
    extractedUrls,
    extractedDomains,
    hasShortlink,
    hasFreeEmailDomain,
    hasSubstantiveContent,
  };
}
