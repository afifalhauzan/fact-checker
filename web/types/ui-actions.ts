import { z } from "zod";

export const UIActionIdSchema = z.enum([
  "validate_company",
  "check_red_flags",
  "check_link_contact",
  "check_salary_benefit_reasonableness",
  "safe_next_steps",
]);

export type UIActionId = z.infer<typeof UIActionIdSchema>;

export const UIActionAttachmentSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  size: z.number().optional(),
  previewUrl: z.string().optional(),
});

export const UIActionPayloadSchema = z.object({
  type: z.literal("UI_ACTION"),
  actionId: UIActionIdSchema,
  actionLabel: z.string(),
  sourceMessageId: z.string().optional(),
  claim: z.string().optional(),
  context: z.string().optional(),
  attachment: UIActionAttachmentSchema.optional(),
});

export type UIActionPayload = z.infer<typeof UIActionPayloadSchema>;

export type AnalysisAction = {
  id: UIActionId;
  label: string;
  description?: string;
};

export const DEFAULT_ANALYSIS_ACTIONS: AnalysisAction[] = [
  {
    id: "validate_company",
    label: "Validasi Perusahaan",
    description: "Periksa apakah identitas perusahaan konsisten di kanal resmi sebelum kamu daftar.",
  },
  {
    id: "check_red_flags",
    label: "Cek Red Flag",
    description: "Tinjau indikator mencurigakan yang sering muncul pada lowongan kerja palsu.",
  },
  {
    id: "check_link_contact",
    label: "Periksa Link & Kontak",
    description: "Bedah risiko dari link pendaftaran, email recruiter, dan nomor kontak.",
  },
  {
    id: "check_salary_benefit_reasonableness",
    label: "Cek Kewajaran Gaji",
    description: "Nilai apakah klaim gaji/benefit masih wajar atau terlalu vague untuk posisi sejenis.",
  },
  {
    id: "safe_next_steps",
    label: "Beri Langkah Aman",
    description: "Dapatkan checklist tindakan aman sebelum kirim data, daftar, atau membayar biaya.",
  },
];
