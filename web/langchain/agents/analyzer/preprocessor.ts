export interface PreprocessedInput {
  rawInput: string;
  cleanedText: string;
  extractedUrls: string[];
  extractedDomains: string[];
  hasShortlink: boolean;
  hasFreeEmailDomain: boolean;
}

const SHORTLINK_DOMAINS = ["bit.ly", "tinyurl.com", "t.co", "cutt.ly", "linktr.ee", "wa.me", "api.whatsapp.com"];
const FREE_EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "ymail.com"];

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

  return {
    rawInput,
    cleanedText,
    extractedUrls,
    extractedDomains,
    hasShortlink,
    hasFreeEmailDomain,
  };
}
