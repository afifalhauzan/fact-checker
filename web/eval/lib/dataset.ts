import { existsSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import type { AnalyzeImage } from "../../langchain/agents/analyzer/analyze";
import { parseCsvRecords } from "./csv";

// Column set and allowed values follow docs/wiki/ai/05-DATASET-EVALUASI.md (bagian 7).
export const COLUMNS = [
  "id", "split", "label", "modus", "kasus_sulit", "input_type", "text", "image_file", "platform",
  "sumber_label", "sumber_asli", "tanggal_kasus", "pasangan_id", "dikumpulkan_oleh", "diverifikasi_oleh", "catatan",
] as const;

/**
 * Annotated after the first test run, so older CSVs may not have it (bagian 6, analisis tambahan).
 * For penipuan rows: does the material itself show the red flag ("ya"), or does the fraud only
 * show outside it, e.g. behind a "link di bio" ("tidak")?
 */
export const VISIBLE_EVIDENCE_COLUMN = "bukti_terlihat";
export const VISIBLE_EVIDENCE = ["ya", "tidak"] as const;

export const SPLITS = ["dev", "test", "injeksi"] as const;
export const LABELS = ["penipuan", "asli"] as const;
export const MODUS = ["impersonasi", "biaya", "tugas_deposit", "data_sensitif", "tppo", "gaji_tidak_wajar", "lainnya"] as const;
export const INPUT_TYPES = ["teks", "gambar", "teks+gambar"] as const;
export const PLATFORMS = [
  "tiktok", "instagram", "facebook", "whatsapp", "telegram", "x", "website", "portal_kerja", "linkedin", "lainnya",
] as const;

/** In an injected row's text, stands for the clean version's text (see bagian 5 of the protocol). */
export const CLEAN_TEXT_PLACEHOLDER = "{{bersih}}";

export type Split = (typeof SPLITS)[number];
export type Label = (typeof LABELS)[number];
export type InputType = (typeof INPUT_TYPES)[number];

export interface DatasetRow {
  id: string;
  split: Split;
  label: Label;
  modus: string;
  hardCaseTags: string[];
  inputType: InputType;
  text: string;
  imageFiles: string[];
  platform: string;
  labelSource: string;
  pairId: string;
  /** "ya", "tidak", or "" when not annotated. */
  visibleEvidence: string;
  collectedBy: string;
  verifiedBy: string;
}

export interface DatasetIssue {
  id: string;
  level: "error" | "warning";
  message: string;
}

const MEDIA_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

function splitList(value: string): string[] {
  return value.split(/[;|]/).map((item) => item.trim()).filter(Boolean);
}

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

/**
 * Loads the dataset CSV and checks it against the protocol. Rows with errors are left out of
 * `rows`, so a run never evaluates a half-filled case; warnings keep the row.
 */
export function loadDataset(csvPath: string, imagesDir: string): { rows: DatasetRow[]; issues: DatasetIssue[] } {
  const { header, records } = parseCsvRecords(readFileSync(csvPath, "utf8"));
  const issues: DatasetIssue[] = [];

  const missingColumns = COLUMNS.filter((column) => !header.includes(column));
  if (missingColumns.length) {
    issues.push({ id: "(header)", level: "error", message: `kolom tidak ada: ${missingColumns.join(", ")}` });
    return { rows: [], issues };
  }

  const seenIds = new Set<string>();
  const rows: DatasetRow[] = [];

  records.forEach((record, index) => {
    const id = record.id || `(baris ${index + 2})`;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.id) errors.push("id kosong");
    else if (seenIds.has(record.id)) errors.push("id duplikat");
    seenIds.add(record.id);

    if (!isOneOf(SPLITS, record.split)) errors.push(`split "${record.split}" tidak dikenal`);
    if (!isOneOf(LABELS, record.label)) errors.push(`label "${record.label}" tidak dikenal`);
    if (!isOneOf(INPUT_TYPES, record.input_type)) errors.push(`input_type "${record.input_type}" tidak dikenal`);

    if (record.label === "penipuan" && !isOneOf(MODUS, record.modus)) {
      errors.push(`modus "${record.modus}" tidak dikenal untuk penipuan`);
    }
    if (record.platform && !isOneOf(PLATFORMS, record.platform)) {
      warnings.push(`platform "${record.platform}" tidak ada di daftar`);
    }

    const imageFiles = splitList(record.image_file);
    const hasText = Boolean(record.text) && !/^<[\s\S]*>$/.test(record.text);
    if (record.text && !hasText) errors.push("text masih berisi placeholder template");
    if (record.input_type === "teks" && !hasText) errors.push("input_type teks tetapi text kosong");
    if (record.input_type?.includes("gambar") && !imageFiles.length) errors.push(`input_type ${record.input_type} tetapi image_file kosong`);
    if (record.input_type === "teks+gambar" && !hasText) errors.push("input_type teks+gambar tetapi text kosong");
    if (record.input_type === "gambar" && hasText) warnings.push("input_type gambar tetapi text diisi (text ikut dikirim)");

    for (const file of imageFiles) {
      if (!MEDIA_TYPES[extname(file).toLowerCase()]) errors.push(`format lampiran ${file} tidak didukung`);
      else if (!existsSync(join(imagesDir, file))) errors.push(`lampiran ${file} tidak ditemukan di ${imagesDir}`);
    }

    const visibleEvidence = record[VISIBLE_EVIDENCE_COLUMN] ?? "";
    if (visibleEvidence && !isOneOf(VISIBLE_EVIDENCE, visibleEvidence)) {
      errors.push(`${VISIBLE_EVIDENCE_COLUMN} "${visibleEvidence}" tidak dikenal (ya/tidak)`);
    }
    if (visibleEvidence && record.label === "asli") warnings.push(`${VISIBLE_EVIDENCE_COLUMN} hanya dipakai untuk baris penipuan`);

    if (!record.sumber_label) {
      (record.split === "test" ? errors : warnings).push("sumber_label kosong");
    }
    if (record.split === "test") {
      if (!record.diverifikasi_oleh) errors.push("baris test belum diverifikasi orang kedua (diverifikasi_oleh kosong)");
      else if (record.diverifikasi_oleh === record.dikumpulkan_oleh) errors.push("pengumpul dan pemverifikasi orang yang sama");
    }

    errors.forEach((message) => issues.push({ id, level: "error", message }));
    warnings.forEach((message) => issues.push({ id, level: "warning", message }));
    if (errors.length) return;

    rows.push({
      id: record.id,
      split: record.split as Split,
      label: record.label as Label,
      modus: record.modus,
      hardCaseTags: splitList(record.kasus_sulit),
      inputType: record.input_type as InputType,
      text: hasText ? record.text : "",
      imageFiles,
      platform: record.platform,
      labelSource: record.sumber_label,
      pairId: record.pasangan_id,
      visibleEvidence: record.label === "penipuan" ? visibleEvidence : "",
      collectedBy: record.dikumpulkan_oleh,
      verifiedBy: record.diverifikasi_oleh,
    });
  });

  // Pair references are checked once every id is known.
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const row of rows) {
    const usesCleanText = row.text.includes(CLEAN_TEXT_PLACEHOLDER);
    if (!row.pairId) {
      if (usesCleanText) {
        issues.push({ id: row.id, level: "error", message: `${CLEAN_TEXT_PLACEHOLDER} hanya untuk baris injeksi yang punya pasangan_id` });
      }
      continue;
    }
    const pair = byId.get(row.pairId);
    if (!pair) {
      issues.push({ id: row.id, level: row.split === "injeksi" ? "error" : "warning", message: `pasangan_id ${row.pairId} tidak ditemukan` });
    } else if (row.split === "injeksi" && pair.label !== row.label) {
      issues.push({ id: row.id, level: "error", message: `label berbeda dengan versi bersihnya (${pair.id})` });
    } else if (row.split === "injeksi" && pair.split === "test") {
      issues.push({ id: row.id, level: "error", message: `versi bersih ${pair.id} ada di set test; set test harus tetap tertutup` });
    } else if (usesCleanText) {
      // The injected variant reuses the clean text, so it follows edits to the clean row.
      row.text = row.text.replaceAll(CLEAN_TEXT_PLACEHOLDER, pair.text).trim();
      if (row.inputType !== "gambar" && !row.text) {
        issues.push({ id: row.id, level: "error", message: `text versi bersih ${pair.id} masih kosong` });
      }
    }
  }

  const rejected = new Set(issues.filter((issue) => issue.level === "error").map((issue) => issue.id));
  return { rows: rows.filter((row) => !rejected.has(row.id)), issues };
}

/**
 * An injected variant: an "injeksi" row whose pasangan_id points to its clean version. Clean
 * versions (no pasangan_id) may sit in "injeksi" or "dev", never in "test".
 */
export function isInjectedVariant(row: DatasetRow): boolean {
  return row.split === "injeksi" && Boolean(row.pairId);
}

/**
 * Rows to evaluate for the given splits. Injection rows also pull in their clean versions,
 * because the attack is measured as the change from the clean verdict.
 */
export function selectRows(rows: DatasetRow[], splits: Split[]): DatasetRow[] {
  const selected = new Map(rows.filter((row) => splits.includes(row.split)).map((row) => [row.id, row]));
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const row of [...selected.values()]) {
    if (isInjectedVariant(row) && !selected.has(row.pairId)) {
      const clean = byId.get(row.pairId);
      if (clean) selected.set(clean.id, clean);
    }
  }
  return [...selected.values()];
}

export function loadAttachments(row: DatasetRow, imagesDir: string): AnalyzeImage[] {
  return row.imageFiles.map((file) => {
    const mediaType = MEDIA_TYPES[extname(file).toLowerCase()];
    const data = readFileSync(join(imagesDir, file)).toString("base64");
    return { mediaType, url: `data:${mediaType};base64,${data}` };
  });
}
