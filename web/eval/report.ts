/**
 * Turns a run directory from eval/run.ts into a Markdown report (printed and saved as report.md).
 *
 *   pnpm eval:report eval/results/<run>
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  classificationSummary,
  groupBy,
  injectionPairs,
  operationalSummary,
  rate,
  type EvalRecord,
  type Rate,
} from "./lib/metrics";
import { isModelEnabled, VARIANTS } from "./lib/variants";

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const withCi = (r: Rate) => (r.n ? `${percent(r.value)} (${r.k}/${r.n}; ${percent(r.ci[0])}–${percent(r.ci[1])})` : "-");
const short = (r: Rate) => (r.n ? `${percent(r.value)} (${r.k}/${r.n})` : "-");
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} dtk`;

function table(header: string[], rows: Array<Array<string | number>>): string {
  return [
    `| ${header.join(" | ")} |`,
    `|${header.map(() => "---").join("|")}|`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\|/g, "\\|").replace(/\n/g, " ")).join(" | ")} |`),
  ].join("\n");
}

function readRecords(file: string): EvalRecord[] {
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line) as EvalRecord);
}

// Main metrics use labeled dev/test cases only; injection-set cases are scored as attack pairs.
const isScored = (record: EvalRecord) => record.split !== "injeksi" && !record.injected;

function variantDetail(variant: string, records: EvalRecord[]): string {
  const scored = records.filter(isScored);
  const summary = classificationSummary(scored);
  const out: string[] = [`## Varian \`${variant}\`: ${VARIANTS[variant]?.description ?? ""}`];

  if (summary.n) {
    const c = summary.confusion;
    out.push(
      "",
      `### Matriks hasil (n = ${summary.n}${summary.errors ? `, ${summary.errors} error dikecualikan` : ""})`,
      "",
      table(
        ["Label \\ Prediksi", "rendah", "sedang", "tinggi", "tanpa verdict"],
        (["penipuan", "asli"] as const).map((label) => [label, c[label].rendah, c[label].sedang, c[label].tinggi, c[label].tanpa_verdict])
      ),
      "",
      "### Metrik utama (IK 95% Wilson)",
      "",
      table(
        ["Metrik", "Nilai"],
        [
          ["Lolos kritis (penipuan → rendah)", withCi(summary.criticalMiss)],
          ["Deteksi (penipuan → tinggi)", withCi(summary.detection)],
          ["Alarm palsu (asli → tinggi)", withCi(summary.falseAlarm)],
          ["Tanpa verdict", withCi(summary.noVerdict)],
        ]
      ),
      "",
      table(
        ["Ambang", "Precision", "Recall", "F1", "TP/FP/FN/TN"],
        [
          ["Ketat (tinggi = penipuan)", summary.strict],
          ["Longgar (sedang+tinggi = waspada)", summary.loose],
        ].map(([name, s]) => {
          const scores = s as typeof summary.strict;
          return [name as string, percent(scores.precision), percent(scores.recall), percent(scores.f1), `${scores.tp}/${scores.fp}/${scores.fn}/${scores.tn}`];
        })
      )
    );

    const scams = scored.filter((record) => record.label === "penipuan" && record.prediction !== "error");
    const byModus = groupBy(scams, (record) => [record.modus || "-"]);
    if (byModus.size) {
      out.push(
        "",
        "### Penipuan per modus",
        "",
        table(
          ["Modus", "n", "Deteksi (tinggi)", "Waspada (sedang+tinggi)", "Lolos kritis"],
          [...byModus].map(([modus, rows]) => [
            modus,
            rows.length,
            short(rate(rows.filter((r) => r.prediction === "tinggi").length, rows.length)),
            short(rate(rows.filter((r) => r.prediction === "tinggi" || r.prediction === "sedang").length, rows.length)),
            short(rate(rows.filter((r) => r.prediction === "rendah").length, rows.length)),
          ])
        )
      );
    }

    const tagged = groupBy(scored.filter((record) => record.prediction !== "error"), (record) => record.hardCaseTags);
    if (tagged.size) {
      out.push(
        "",
        "### Kasus sulit (per tag)",
        "",
        table(
          ["Tag", "Label", "n", "rendah", "sedang", "tinggi"],
          [...tagged].flatMap(([tag, rows]) =>
            (["penipuan", "asli"] as const)
              .map((label) => rows.filter((r) => r.label === label))
              .filter((group) => group.length)
              .map((group) => [
                tag,
                group[0].label,
                group.length,
                group.filter((r) => r.prediction === "rendah").length,
                group.filter((r) => r.prediction === "sedang").length,
                group.filter((r) => r.prediction === "tinggi").length,
              ])
          )
        )
      );
    }

    const byInput = groupBy(scored.filter((record) => record.prediction !== "error"), (record) => [record.inputType]);
    out.push(
      "",
      "### Per jenis input",
      "",
      table(
        ["Input", "n", "Deteksi", "Alarm palsu", "Lolos kritis"],
        [...byInput].map(([input, rows]) => {
          const s = classificationSummary(rows);
          return [input, rows.length, short(s.detection), short(s.falseAlarm), short(s.criticalMiss)];
        })
      )
    );

    const mistakes = scored.filter(
      (record) => (record.label === "penipuan" && record.prediction === "rendah") || (record.label === "asli" && record.prediction === "tinggi")
    );
    if (mistakes.length) {
      out.push(
        "",
        "### Kesalahan fatal (untuk analisis)",
        "",
        table(
          ["ID", "Label", "Prediksi", "Modus/tag", "Alasan sistem"],
          mistakes.map((record) => [
            record.id,
            record.label,
            record.prediction,
            [record.modus, ...record.hardCaseTags].filter(Boolean).join(", ") || "-",
            (record.claim ?? "").slice(0, 160),
          ])
        )
      );
    }
  }

  const pairs = injectionPairs(records);
  if (pairs.length) {
    const successes = pairs.filter((pair) => pair.success).length;
    out.push(
      "",
      "### Prompt injection",
      "",
      `Attack success rate: **${withCi(rate(successes, pairs.length))}** (verdict bergeser ke arah yang diinginkan penyerang dibanding versi bersih).`,
      "",
      table(
        ["ID", "Bersih", "Label", "Verdict bersih", "Verdict tersuntik", "Berhasil?"],
        pairs.map((pair) => [pair.id, pair.cleanId, pair.label, pair.clean, pair.injected, pair.success ? "YA" : "tidak"])
      )
    );
  }

  const ops = operationalSummary(records, isModelEnabled(variant));
  out.push(
    "",
    "### Operasional",
    "",
    table(
      ["Ukuran", "Nilai"],
      [
        ["Latensi total p50 / p95", `${seconds(ops.latencyMs.p50)} / ${seconds(ops.latencyMs.p95)}`],
        ["Latensi LLM p50 / p95", `${seconds(ops.llmMs.p50)} / ${seconds(ops.llmMs.p95)}`],
        ["Rata-rata token input / output", `${ops.avgTokens.input} / ${ops.avgTokens.output}`],
        ["Jatuh ke fallback aturan", isModelEnabled(variant) ? short(ops.fallback) : "- (model dimatikan)"],
        ["Risk floor diterapkan", ops.riskFloorApplied],
        ["Sitasi halusinasi dibuang", `${ops.droppedSourceIds.total} (di ${ops.droppedSourceIds.runs} kasus)`],
        ["Kutipan palsu dibuang", `${ops.droppedEvidence.total} (di ${ops.droppedEvidence.runs} kasus)`],
        ["Status pencarian", Object.entries(ops.searchStatus).map(([k, v]) => `${k}: ${v}`).join(", ") || "-"],
        ["Status baca lampiran", Object.entries(ops.extractionStatus).map(([k, v]) => `${k}: ${v}`).join(", ") || "-"],
      ]
    )
  );

  const errors = records.filter((record) => record.prediction === "error");
  if (errors.length) {
    out.push("", `**${errors.length} kasus error**: ${errors.map((record) => `${record.id} (${record.error})`).join("; ")}`);
  }

  return out.join("\n");
}

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Pemakaian: pnpm eval:report eval/results/<run>");
    process.exit(1);
  }
  const runDir = resolve(dir);
  const config = JSON.parse(readFileSync(join(runDir, "run.json"), "utf8"));
  const variants: string[] = config.variants.filter((variant: string) => existsSync(join(runDir, `${variant}.jsonl`)));
  const recordsByVariant = new Map(variants.map((variant) => [variant, readRecords(join(runDir, `${variant}.jsonl`))]));

  const overview = variants.map((variant) => {
    const records = recordsByVariant.get(variant)!;
    const s = classificationSummary(records.filter(isScored));
    const ops = operationalSummary(records, isModelEnabled(variant));
    const pairs = injectionPairs(records);
    return [
      variant,
      s.n,
      short(s.criticalMiss),
      short(s.detection),
      short(s.falseAlarm),
      percent(s.strict.f1),
      percent(s.loose.f1),
      pairs.length ? short(rate(pairs.filter((pair) => pair.success).length, pairs.length)) : "-",
      `${seconds(ops.latencyMs.p50)} / ${seconds(ops.latencyMs.p95)}`,
      `${ops.avgTokens.input} / ${ops.avgTokens.output}`,
    ];
  });

  const report = [
    "# Laporan Evaluasi TelaahKarier",
    "",
    table(
      ["Run", "Nilai"],
      [
        ["Dimulai", config.startedAt],
        ["Commit", `${config.commit}${config.uncommittedChanges ? " (+perubahan belum di-commit)" : ""}`],
        ["Dataset", `${config.dataset.path} (sha256 ${String(config.dataset.sha256).slice(0, 12)})`],
        ["Split", config.splits.join(", ")],
        ["Model", Object.entries(config.models).map(([stage, model]) => `${stage}: ${model}`).join(", ")],
        ["Override env", config.envOverrides.join(", ") || "-"],
      ]
    ),
    "",
    "## Ringkasan per varian",
    "",
    table(
      ["Varian", "n", "Lolos kritis", "Deteksi", "Alarm palsu", "F1 ketat", "F1 longgar", "Injeksi berhasil", "Latensi p50/p95", "Token in/out"],
      overview
    ),
    "",
    "Lolos kritis = penipuan dinilai rendah. Deteksi = penipuan dinilai tinggi. Alarm palsu = asli dinilai tinggi. Ketat: hanya tinggi dihitung penipuan; longgar: sedang dan tinggi.",
    "",
    ...variants.map((variant) => `${variantDetail(variant, recordsByVariant.get(variant)!)}\n`),
  ].join("\n");

  writeFileSync(join(runDir, "report.md"), `${report}\n`);
  console.log(report);
  console.log(`\nDisimpan di ${join(runDir, "report.md")}`);
}

main();
