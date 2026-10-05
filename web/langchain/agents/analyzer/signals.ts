import { RISK_LEVEL_LABELS, type RiskLevel, type RiskType } from "./schema";

/**
 * Deterministic, rule-based detection of job-scam patterns.
 *
 * The signals are used three ways:
 * 1. passed to the model as <temuan_otomatis> so it can confirm or reject them,
 * 2. as a safety floor: a strong signal keeps the final risk level from being lowered
 *    (e.g. by a prompt-injection that convinced the model a fee-charging post is safe),
 * 3. as the limited rule-based analysis when the model is unavailable.
 */

export type SignalId =
  | "fee_request"
  | "sensitive_data_request"
  | "manipulation_attempt"
  | "personal_chat_contact"
  | "free_email_domain"
  | "shortlink";

export type SignalSeverity = "strong" | "moderate";

export interface DetectedSignal {
  id: SignalId;
  label: string;
  severity: SignalSeverity;
  riskType: RiskType;
  floor?: RiskLevel;
  floorReason?: string;
  description: string;
  evidence: string[];
}

interface SignalRule {
  id: SignalId;
  label: string;
  severity: SignalSeverity;
  riskType: RiskType;
  floor?: RiskLevel;
  floorReason?: string;
  description: string;
  patterns: RegExp[];
  negatable?: boolean;
}

// Applicant-facing fees. "uang" is only paired with purposes that are paid BY the applicant;
// "uang transport/makan/lembur" are benefits and must not match.
const FEE_PATTERNS = [
  /\bbiaya\s+(?:pendaftaran|registrasi|administrasi|admin|pelatihan|training|diklat|seragam|atribut|medical(?:\s+check[\s-]?up)?|mcu|pemeriksaan\s+kesehatan|tes|test|psikotes|ujian|interview|wawancara|akomodasi|penginapan|tiket|transport(?:asi)?|modul|onboarding|jaminan|deposit|materai|aktivasi|pemberkasan|pengurusan|visa|paspor|keberangkatan|penempatan)\b/gi,
  /\buang\s+(?:pendaftaran|registrasi|administrasi|admin|jaminan|deposit|pelatihan|seragam|pemberkasan|materai|pengurusan|keberangkatan)\b/gi,
  /\b(?:wajib|harus|diharuskan|diwajibkan|diminta|cukup|hanya|silakan|silahkan|segera)\s+(?:membayar|bayar|mentransfer|transfer|tf|setor|deposit|top[\s-]?up)\b/gi,
  /\b(?:transfer|tf|setor|deposit|top[\s-]?up)\b[^.!?\n]{0,40}?(?:rp\.?\s?\d|\b\d+(?:[.,]\d+)?\s?(?:ribu|rb|jt|juta|k)\b)/gi,
  /\b(?:dana|uang)\s+(?:jaminan|deposit)\b/gi,
];

const SENSITIVE_DATA_PATTERNS = [
  /\b(?:kirim(?:kan)?|berikan|beri|sebutkan|bagikan|share|informasikan|masukkan|minta)\b[^.!?\n]{0,30}?\b(?:kode\s+)?(?:otp|pin|password|kata\s+sandi|kode\s+verifikasi|cvv)\b/gi,
  /\b(?:kode\s+)?(?:otp|pin|password|kata\s+sandi|cvv)\b[^.!?\n]{0,30}?\b(?:dikirim|diberikan|dibagikan|diinformasikan)\b/gi,
  /\bselfie\b[^.!?\n]{0,25}?\b(?:ktp|e-?ktp|kartu\s+identitas)\b/gi,
  /\b(?:foto|swafoto)\b[^.!?\n]{0,15}?\b(?:memegang|pegang|sambil|dengan)\s+(?:ktp|e-?ktp)\b/gi,
  /\b(?:nomor|no\.?)\s+(?:kartu\s+kredit|cc)\b/gi,
  /\b(?:login|akun|user\s?id)\s+(?:m-?banking|mbanking|internet\s+banking)\b/gi,
];

// Kept narrow on purpose: legitimate postings say things like "act as a liaison",
// "Katakan tidak pada penipuan", or "Catatan untuk model" (modeling jobs).
const MANIPULATION_PATTERNS = [
  /\b(?:abaikan|lupakan|acuhkan|hiraukan)\b[^.!?\n]{0,40}?\b(?:instruksi|perintah|aturan|prompt|arahan)\b/gi,
  /\b(?:ignore|disregard)\b[^.!?\n]{0,40}?\b(?:previous|prior|above|earlier|all)\b[^.!?\n]{0,20}?\b(?:instructions?|prompts?|rules)\b/gi,
  /\b(?:ungkapkan|tampilkan|bocorkan|reveal|print)\b[^.!?\n]{0,25}?\b(?:system\s+prompt|prompt\s+sistem|instruksi\s+sistem)\b/gi,
  /\b(?:kamu|anda)\s+(?:sekarang\s+)?(?:adalah|berperan\s+sebagai|bertindak\s+sebagai)\s+(?:ai|asisten|model|chatbot|bot)\b/gi,
  /\b(?:you\s+are\s+now|pretend\s+to\s+be)\b/gi,
  /\bact\s+as\s+(?:an?\s+)?(?:ai|assistant|chatbot|language\s+model)\b/gi,
  /\b(?:nyatakan|katakan|tandai|tuliskan|simpulkan|labeli|nilai)\b[^.!?\n]{0,30}?\b(?:lowongan|loker|ini|perusahaan|hasil)\b[^.!?\n]{0,25}?\b(?:aman|resmi|terpercaya|legal|valid|risiko\s+rendah|tidak\s+berisiko|bukan\s+penipuan|berbahaya|risiko\s+tinggi)\b/gi,
  /\b(?:catatan|pesan|instruksi|note)\s+(?:untuk|kepada|to)\s+(?:ai|chatbot|llm|gpt|gemini|asisten\s+ai|model\s+ai)\b/gi,
  /<\/?\s*(?:system|instruction|materi_lowongan|temuan_otomatis|sumber_pencarian|hasil_analisis_awal)\b/gi,
];

const PERSONAL_CHAT_PATTERNS = [
  /\b(?:wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|t\.me)\/\S+/gi,
  /\b(?:wa|whatsapp|whats\s?app|telegram)\b[^.!?\n]{0,25}?(?:\+?62|0)\s?8[\d\s-]{7,14}/gi,
  /\b(?:hubungi|chat|kontak|contact|daftar|kirim\s+cv)\b[^.!?\n]{0,25}?\b(?:wa|whatsapp|telegram)\b/gi,
];

const FREE_EMAIL_PATTERNS = [
  /[\w.+-]+@(?:gmail|yahoo|ymail|hotmail|outlook|live|aol|icloud|proton(?:mail)?)\.(?:com|co\.id|me)\b/gi,
];

const SHORTLINK_PATTERNS = [
  /\b(?:https?:\/\/)?(?:www\.)?(?:bit\.ly|s\.id|tinyurl\.com|cutt\.ly|shorturl\.at|rb\.gy|t\.ly|is\.gd|ow\.ly|bit\.do|linktr\.ee|lnk\.bio|heylink\.me)\/[\w\-./?=&%#]+/gi,
];

const SIGNAL_RULES: SignalRule[] = [
  {
    id: "fee_request",
    label: "Permintaan biaya kepada pelamar",
    severity: "strong",
    riskType: "payment_request",
    floor: "tinggi",
    floorReason: "Perusahaan resmi umumnya tidak memungut biaya apa pun selama proses rekrutmen.",
    description:
      "Lowongan meminta pelamar membayar sejumlah biaya. Perusahaan resmi umumnya tidak memungut biaya apa pun selama proses rekrutmen.",
    patterns: FEE_PATTERNS,
    negatable: true,
  },
  {
    id: "sensitive_data_request",
    label: "Permintaan data sensitif",
    severity: "strong",
    riskType: "sensitive_data",
    floor: "tinggi",
    floorReason: "Kode OTP, PIN, kata sandi, atau foto KTP sambil selfie tidak dibutuhkan dalam rekrutmen resmi.",
    description:
      "Ada permintaan data sensitif (seperti OTP, PIN, atau foto KTP sambil selfie) yang berisiko disalahgunakan untuk penipuan atau pinjaman ilegal.",
    patterns: SENSITIVE_DATA_PATTERNS,
    negatable: true,
  },
  {
    id: "manipulation_attempt",
    label: "Upaya memanipulasi analisis otomatis",
    severity: "strong",
    riskType: "manipulation",
    floor: "sedang",
    floorReason: "Materi berisi kalimat yang mencoba mengarahkan hasil analisis, sehingga perlu dicek ulang secara manual.",
    description:
      "Materi berisi kalimat yang mencoba mengatur hasil analisis otomatis. Hal ini tidak lazim pada lowongan resmi.",
    patterns: MANIPULATION_PATTERNS,
  },
  {
    id: "personal_chat_contact",
    label: "Kontak lewat chat pribadi (WhatsApp/Telegram)",
    severity: "moderate",
    riskType: "suspicious_contact",
    description:
      "Pendaftaran atau kontak diarahkan ke chat pribadi (WhatsApp/Telegram), bukan kanal resmi perusahaan.",
    patterns: PERSONAL_CHAT_PATTERNS,
  },
  {
    id: "free_email_domain",
    label: "Email domain gratis",
    severity: "moderate",
    riskType: "suspicious_contact",
    description: "Kontak menggunakan email domain gratis, bukan domain resmi perusahaan.",
    patterns: FREE_EMAIL_PATTERNS,
  },
  {
    id: "shortlink",
    label: "Tautan pendaftaran disamarkan (shortlink)",
    severity: "moderate",
    riskType: "suspicious_contact",
    description: "Link pendaftaran memakai pemendek tautan sehingga tujuan aslinya tersembunyi.",
    patterns: SHORTLINK_PATTERNS,
  },
];

const LEVEL_RANK: Record<RiskLevel, number> = { rendah: 0, sedang: 1, tinggi: 2 };

const NEGATION_BEFORE = /\b(?:tidak|tdk|tanpa|tak|bebas|gratis|bukan|jangan|free|never)\b/i;
const NEGATION_AFTER = /\b(?:gratis|free|ditanggung|dibebaskan|tidak\s+dipungut|tidak\s+dikenakan)\b/i;
// "tidak dipungut biaya pendaftaran maupun biaya pelatihan": the negation covers the whole list.
const COORDINATED_GAP = /^[\s,]*(?:(?:dan|atau|maupun|ataupun|serta)(?:\s+juga)?\s+)?$/i;
const MAX_EVIDENCE_PER_SIGNAL = 2;

// A fee/data phrase is negated when a negation word sits right before it in the same clause
// ("tidak dipungut biaya"), the clause right after it waives it ("biaya pelatihan ditanggung"),
// or it sits in a question ("Apakah wajar recruiter meminta biaya administrasi?"), which asks
// about a request rather than making one.
function isNegated(text: string, start: number, end: number): boolean {
  const before = text.slice(Math.max(0, start - 30), start);
  const clauseBefore = before.split(/[.!?\n,;:]/).pop() ?? "";
  if (NEGATION_BEFORE.test(clauseBefore)) {
    return true;
  }

  // A period followed by a digit is a thousands separator ("Rp 50.000"), not a sentence end.
  const sentenceEnd = text.slice(end).search(/[!?\n]|\.(?!\d)/);
  if (sentenceEnd >= 0 && text[end + sentenceEnd] === "?") {
    return true;
  }

  const after = text.slice(end, end + 40);
  const clauseAfter = after.split(/[.!?\n]/)[0] ?? "";
  return NEGATION_AFTER.test(clauseAfter);
}

function extractSnippet(text: string, start: number, end: number): string {
  const from = Math.max(0, start - 35);
  const to = Math.min(text.length, end + 35);
  let snippet = text.slice(from, to).replace(/\s+/g, " ").trim();

  if (from > 0) {
    snippet = `…${snippet.replace(/^\S*\s/, "")}`;
  }
  if (to < text.length) {
    snippet = `${snippet.replace(/\s\S*$/, "")}…`;
  }

  return snippet;
}

export function detectSignals(text: string): DetectedSignal[] {
  if (!text.trim().length) {
    return [];
  }

  const signals: DetectedSignal[] = [];

  for (const rule of SIGNAL_RULES) {
    const evidence: string[] = [];

    for (const pattern of rule.patterns) {
      let lastNegatedEnd = -1;

      for (const match of text.matchAll(pattern)) {
        const start = match.index ?? 0;
        const end = start + match[0].length;

        if (rule.negatable) {
          const continuesNegatedList =
            lastNegatedEnd >= 0 && COORDINATED_GAP.test(text.slice(lastNegatedEnd, start));
          if (continuesNegatedList || isNegated(text, start, end)) {
            lastNegatedEnd = end;
            continue;
          }
        }

        const snippet = extractSnippet(text, start, end);
        if (!evidence.includes(snippet)) {
          evidence.push(snippet);
        }
        if (evidence.length >= MAX_EVIDENCE_PER_SIGNAL) {
          break;
        }
      }
      if (evidence.length >= MAX_EVIDENCE_PER_SIGNAL) {
        break;
      }
    }

    if (evidence.length > 0) {
      signals.push({
        id: rule.id,
        label: rule.label,
        severity: rule.severity,
        riskType: rule.riskType,
        floor: rule.floor,
        floorReason: rule.floorReason,
        description: rule.description,
        evidence,
      });
    }
  }

  return signals;
}

export function compareRiskLevels(a: RiskLevel, b: RiskLevel): number {
  return LEVEL_RANK[a] - LEVEL_RANK[b];
}

/** The strongest floor imposed by the detected signals, with the signal that imposed it. */
export function strongestFloor(signals: DetectedSignal[]): { level: RiskLevel; signal: DetectedSignal } | null {
  let best: { level: RiskLevel; signal: DetectedSignal } | null = null;

  for (const signal of signals) {
    if (!signal.floor) {
      continue;
    }
    if (!best || compareRiskLevels(signal.floor, best.level) > 0) {
      best = { level: signal.floor, signal };
    }
  }

  return best;
}

/**
 * Risk level from rules alone. Rules can surface red flags but cannot confirm that a company
 * is legitimate, so the absence of signals yields "sedang" (unverified), never "rendah".
 */
export function ruleBasedRiskLevel(signals: DetectedSignal[]): RiskLevel {
  return strongestFloor(signals)?.level === "tinggi" ? "tinggi" : "sedang";
}

export function formatSignalsForPrompt(signals: DetectedSignal[]): string {
  if (!signals.length) {
    return "Tidak ada pola yang terdeteksi oleh aturan otomatis.";
  }

  return signals
    .map((signal) => {
      const severity = signal.severity === "strong" ? "kuat" : "sedang";
      const evidence = signal.evidence.map((item) => `"${item}"`).join("; ");
      return `- [${severity}] ${signal.label}. Bukti: ${evidence}`;
    })
    .join("\n");
}

/** Label for use mid-sentence; keeps proper nouns such as "WhatsApp" intact. */
export function labelInSentence(signal: DetectedSignal): string {
  return signal.label.charAt(0).toLowerCase() + signal.label.slice(1);
}

export function describeSignalsForProgress(signals: DetectedSignal[]): string {
  if (!signals.length) {
    return "Mendeteksi pola berisiko secara otomatis: tidak ada pola umum yang cocok";
  }

  return `Mendeteksi pola berisiko secara otomatis: ${signals.map(labelInSentence).join(", ")}`;
}

export function describeFloorForProgress(level: RiskLevel, signal: DetectedSignal): string {
  return `Pengaman aturan: tingkat risiko dinaikkan ke ${RISK_LEVEL_LABELS[level]} karena terdeteksi ${labelInSentence(signal)}`;
}
