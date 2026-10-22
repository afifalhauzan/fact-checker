// The PDF is drawn with the built-in Helvetica, which covers Latin text and common punctuation
// but nothing else (no emoji or arrows), so other characters are replaced or dropped.

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/[→⇒➜➔]/g, "->"],
  [/←/g, "<-"],
  [/≥/g, ">="],
  [/≤/g, "<="],
  [/[‐-‒−]/g, "-"],
  [/[   ]/g, " "],
  [/[​-‍️]/g, ""],
  [/[●▪◦]/g, "•"],
];

// ASCII, Latin-1, and the extra punctuation WinAnsi (the PDF standard fonts' encoding) has
const UNSUPPORTED = /[^\n -~¡-ÿ–—‘’‚“”„†‡•…‰‹›€™]/gu;

export function pdfSafe(text: string): string {
  let result = text;
  for (const [pattern, replacement] of REPLACEMENTS) result = result.replace(pattern, replacement);
  // Not trimmed: a span's edge spaces separate it from the span next to it
  return result.replace(UNSUPPORTED, "").replace(/ {2,}/g, " ");
}
