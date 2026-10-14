import type { AnalyzeOptions } from "../../langchain/agents/analyzer/analyze";

type VariantOptions = Pick<AnalyzeOptions, "useRules" | "useSearch" | "useLLM" | "useExtraction">;

/**
 * Pipeline variants for the ablation. Attachments are read in every variant except
 * "tanpa_baca_dulu", so the variants differ only in what judges the material.
 */
export const VARIANTS: Record<string, { description: string; options: VariantOptions }> = {
  lengkap: { description: "Aturan + pencarian web + LLM (produksi)", options: {} },
  aturan_saja: { description: "Aturan saja (tanpa LLM penilai dan pencarian)", options: { useLLM: false, useSearch: false } },
  llm_saja: { description: "LLM saja (tanpa aturan dan pencarian)", options: { useRules: false, useSearch: false } },
  llm_pencarian: { description: "LLM + pencarian web (tanpa aturan)", options: { useRules: false } },
  tanpa_pencarian: { description: "Aturan + LLM (tanpa pencarian web)", options: { useSearch: false } },
  tanpa_baca_dulu: { description: "Lengkap, tetapi lampiran langsung dikirim ke analisis", options: { useExtraction: false } },
};

export const ABLATION_VARIANTS = ["lengkap", "aturan_saja", "llm_saja", "llm_pencarian"];

export function isModelEnabled(variant: string): boolean {
  return VARIANTS[variant]?.options.useLLM !== false;
}
