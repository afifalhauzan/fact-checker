import type { RiskType } from "@/langchain/agents/analyzer/schema";

// TelaahBareng data as the Laravel API returns it (TelaahPost::present), plus shared labels.

export type TelaahRiskLevel = "sedang" | "tinggi";

export type TelaahModus = "biaya" | "tugas_deposit" | "data_sensitif" | "tppo" | "impersonasi" | "lainnya";

export type ContactKind = "phone" | "email" | "account" | "domain";

export type ReportType = "data_pribadi" | "spam";

export interface TelaahContact {
  kind: ContactKind;
  value: string;
}

export interface TelaahEvidence {
  type: RiskType;
  description: string;
  evidence?: string | null;
}

export interface TelaahAttachment {
  id: number;
  label: string;
}

export interface TelaahComment {
  id: number;
  // The top-level comment this replies to; replies are one level deep.
  parentId: number | null;
  // A deleted comment that still has replies: no author or text, only a placeholder.
  isDeleted: boolean;
  author: string | null;
  isPostAuthor: boolean;
  // Written by the signed-in viewer, who may delete it.
  isMine: boolean;
  isNewAccount: boolean;
  body: string | null;
  flag: "klaim_tanpa_bukti" | null;
  createdAt: string;
}

export interface TelaahPost {
  id: number;
  status: "visible" | "hidden_pending_edit";
  title: string;
  riskLevel: TelaahRiskLevel;
  claim: string;
  modus: TelaahModus;
  company: string | null;
  position: string | null;
  location: string | null;
  salary: string | null;
  openDate: string | null;
  closeDate: string | null;
  source: { platform: string | null; account: string | null };
  contacts: TelaahContact[];
  summary: string;
  evidence: TelaahEvidence[];
  materialLines: string[];
  story: string | null;
  links: string[];
  attachments: TelaahAttachment[];
  author: string;
  createdAt: string;
  analyzedAt: string;
  reactionCount: number;
  commentCount: number;
  matchCount: number;
  spamReports: number;
  isSeed: boolean;
  viewer: { isOwner: boolean; reacted: boolean; reported: boolean };
  // Only on the detail endpoint.
  comments?: TelaahComment[];
}

export const MODUS_VALUES: TelaahModus[] = ["biaya", "tugas_deposit", "data_sensitif", "tppo", "impersonasi", "lainnya"];

export const MODUS_LABELS: Record<TelaahModus, string> = {
  biaya: "Permintaan biaya",
  tugas_deposit: "Tugas berbayar / deposit",
  data_sensitif: "Permintaan data pribadi",
  tppo: "Kerja luar negeri",
  impersonasi: "Mencatut instansi",
  lainnya: "Kontak mencurigakan",
};

export const CONTACT_LABELS: Record<ContactKind, string> = {
  phone: "Nomor WA/HP",
  email: "Email",
  account: "Rekening tujuan",
  domain: "Domain/link",
};

export const SOURCE_PLATFORMS = ["Instagram", "WhatsApp", "Telegram", "Facebook", "TikTok", "Website", "Lainnya"];

export function attachmentUrl(attachment: TelaahAttachment): string {
  return `/api/telaah-bersama/attachments/${attachment.id}`;
}

const ACCUSATORY_WORDS = /\b(penipu|penipuan|scam|palsu|bodong|abal-abal|hoaks|hoax)\b/i;

export function hasAccusatoryWord(text: string): boolean {
  return ACCUSATORY_WORDS.test(text);
}

// Relative: server code that eval scripts load through jiti imports this file too.
export { formatRelativeTime as formatRelative } from "../../utils/formatters";

const DATE = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatPeriod(openDate?: string | null, closeDate?: string | null): string | null {
  if (openDate && closeDate) return `${formatDate(openDate)} – ${formatDate(closeDate)}`;
  if (openDate) return `dibuka ${formatDate(openDate)}`;
  if (closeDate) return `ditutup ${formatDate(closeDate)}`;
  return null;
}
