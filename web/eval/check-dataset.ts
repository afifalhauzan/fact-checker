/**
 * Checks the dataset CSV against the protocol and shows how far the composition is from the
 * targets in docs/wiki/ai/05-DATASET-EVALUASI.md bagian 4. Calls no model.
 *
 *   pnpm eval:check [eval/dataset/dataset.csv]
 */
import { dirname, join, resolve } from "node:path";
import { isInjectedVariant, loadDataset, type DatasetRow } from "./lib/dataset";

// Minimum counts for the frozen test set.
const TEST_TARGETS: Array<{ name: string; target: number; match: (row: DatasetRow) => boolean }> = [
  { name: "penipuan", target: 50, match: (row) => row.label === "penipuan" },
  { name: "asli", target: 50, match: (row) => row.label === "asli" },
  { name: "berupa gambar", target: 30, match: (row) => row.inputType !== "teks" },
  { name: "penipuan: impersonasi", target: 15, match: (row) => row.label === "penipuan" && row.modus === "impersonasi" },
  { name: "penipuan: biaya", target: 10, match: (row) => row.label === "penipuan" && row.modus === "biaya" },
  { name: "penipuan: tugas_deposit", target: 5, match: (row) => row.label === "penipuan" && row.modus === "tugas_deposit" },
  { name: "penipuan: data_sensitif", target: 5, match: (row) => row.label === "penipuan" && row.modus === "data_sensitif" },
  { name: "penipuan: tppo", target: 5, match: (row) => row.label === "penipuan" && row.modus === "tppo" },
  { name: "asli: punya pasangan palsu", target: 15, match: (row) => row.label === "asli" && Boolean(row.pairId) },
];

function count(rows: DatasetRow[], keyOf: (row: DatasetRow) => string): string {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(keyOf(row), (counts.get(keyOf(row)) ?? 0) + 1);
  return [...counts].map(([key, n]) => `${key} ${n}`).join(", ") || "-";
}

function main() {
  const csvPath = resolve(process.argv[2] ?? "eval/dataset/dataset.csv");
  const { rows, issues } = loadDataset(csvPath, join(dirname(csvPath), "images"));

  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warning");
  for (const issue of [...errors, ...warnings]) {
    console.log(`${issue.level === "error" ? "ERROR  " : "catatan"} ${issue.id}: ${issue.message}`);
  }

  console.log(`\n${rows.length} baris valid, ${new Set(errors.map((issue) => issue.id)).size} baris ditolak, ${warnings.length} catatan`);
  for (const split of ["dev", "test", "injeksi"] as const) {
    const inSplit = rows.filter((row) => row.split === split);
    console.log(`- ${split}: ${inSplit.length} (${count(inSplit, (row) => row.label)}; ${count(inSplit, (row) => row.inputType)})`);
  }
  console.log(`- pasangan injeksi: ${rows.filter(isInjectedVariant).length}`);

  const test = rows.filter((row) => row.split === "test");
  console.log("\nTarget set test:");
  for (const { name, target, match } of TEST_TARGETS) {
    const n = test.filter(match).length;
    console.log(`  ${n >= target ? "OK    " : "kurang"} ${name}: ${n}/${target}`);
  }

  process.exit(errors.length ? 1 : 0);
}

main();
