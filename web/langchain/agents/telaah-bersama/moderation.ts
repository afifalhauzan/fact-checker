// Comments that steer readers toward "it's safe" without evidence, the reassurance syndicate
// accounts post (design doc 5.5). A flagged comment stays visible with a label; comments never
// change the risk level either way.

const STEERS_TOWARD_SAFE = [
  /\baman\s*(kok|aja|saja|kak|banget)?\b/i,
  /\b(bukan|tidak|gak|nggak|ga) (penipuan|penipu|scam|hoaks)\b/i,
  /\b(terpercaya|terjamin|dijamin|legal kok|asli kok|resmi kok|100% (asli|aman|resmi))\b/i,
  /\b(sudah|udah|sdh) (di ?gaji|gajian|dibayar|cair|kerja di sana|ikut dan)\b/i,
  /\btransfer (saja|aja)\b/i,
];

// Words that show the comment is a warning, e.g. "katanya aman, ternyata uangnya hilang".
const WARNING_CONTEXT = /\b(ternyata|tapi|namun|hati-hati|jangan|hilang|ditipu|tertipu|tidak bisa ditarik|diblokir)\b/i;

export function flagComment(body: string): "klaim_tanpa_bukti" | null {
  const steers = STEERS_TOWARD_SAFE.some((pattern) => pattern.test(body));
  return steers && !WARNING_CONTEXT.test(body) ? "klaim_tanpa_bukti" : null;
}
