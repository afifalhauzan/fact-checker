import { z } from "zod";

export const UIActionIdSchema = z.enum([
  "inspect_source",
  "expand_context",
  "challenge_claim",
  "simplify_explanation",
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
    id: "inspect_source",
    label: "Periksa Sumber",
    description: "Lihat dari mana informasi ini berasal dan bagian mana yang perlu diverifikasi.",
  },
  {
    id: "expand_context",
    label: "Cari Konteks Hilang",
    description: "Temukan konteks penting yang belum terlihat dari informasi awal.",
  },
  {
    id: "challenge_claim",
    label: "Uji Klaim",
    description: "Lihat kemungkinan bantahan atau hal yang perlu dicek sebelum percaya.",
  },
  {
    id: "simplify_explanation",
    label: "Sederhanakan Penjelasan",
    description: "Ubah analisis menjadi bahasa yang lebih mudah dipahami.",
  },
];

