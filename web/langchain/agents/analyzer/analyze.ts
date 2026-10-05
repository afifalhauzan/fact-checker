import {
  AnalysisSchema,
  LLMAnalysisOutputSchema,
  RISK_LEVEL_LABELS,
  SALARY_NOT_MENTIONED,
  type AnalysisResult,
  type LLMAnalysisOutput,
  type Reasoning,
  type RiskLevel,
} from "./schema";
import { analyzerSystemPrompt, buildAnalyzerUserPrompt } from "./prompts";
import { getLLMModel, LLM_TIMEOUT_MS, readTokenUsage, type TokenUsage } from "./llm";
import { preprocessJobInput } from "./preprocessor";
import {
  compareRiskLevels,
  describeFloorForProgress,
  describeSignalsForProgress,
  detectSignals,
  labelInSentence,
  ruleBasedRiskLevel,
  strongestFloor,
  type DetectedSignal,
} from "./signals";
import {
  GUIDANCE_REFERENCES,
  buildVerificationQuery,
  describeSearchForProgress,
  normalizeSourceId,
  searchWeb,
  sourceToCitation,
  sourcesToReferences,
  type WebSearchResult,
  type WebSearchStatus,
} from "./tools/tavily-search";

export interface AnalyzeImage {
  mediaType: string;
  url: string;
}

export interface AnalyzeInput {
  input: string;
  images?: AnalyzeImage[];
}

export interface AnalyzeOptions {
  /** Called with the full progress block each time a real pipeline stage finishes. */
  onProgress?: (reasoning: Reasoning[]) => void;
  // Component switches for the evaluation ablation. All default to true in production.
  useRules?: boolean;
  useSearch?: boolean;
  useLLM?: boolean;
}

export interface AnalysisRunMeta {
  mode: "ai" | "rule_fallback" | "not_job_input";
  fallbackReason?: string;
  signals: Array<Pick<DetectedSignal, "id" | "severity">>;
  search: { status: WebSearchStatus | "disabled"; retrievedCount: number; sourceCount: number };
  riskFloorApplied: boolean;
  // Source IDs the model cited that were never retrieved (hallucinated citations), removed.
  droppedSourceIds: number;
  // Evidence quotes that do not appear in the posting text (fabricated quotes), removed.
  droppedEvidence: number;
  timingsMs: { search: number; llm: number; total: number };
  tokenUsage?: TokenUsage;
}

export interface AnalysisRun {
  result: AnalysisResult;
  meta: AnalysisRunMeta;
}

export const PROGRESS_INTENT = "Tahapan pemeriksaan TelaahKarier";

const SALARY_BENEFIT_TITLE = "Kewajaran Gaji & Benefit";
const MAX_RISKS = 6;
const MAX_MODEL_STEPS = 5;
const MAX_SUGGESTED_QUESTIONS = 4;
const MIN_FALLBACK_VERDICT_LENGTH = 80;
// A displayed "100%" reads as an absolute verdict, which the product deliberately never gives.
const MAX_CONFIDENCE = 0.95;

const DEFAULT_SUGGESTED_QUESTIONS = [
  "Bantu cek red flag dari tawaran kerja ini.",
  "Periksa apakah perusahaan dan link pendaftarannya valid.",
  "Apakah wajar kalau recruiter meminta biaya administrasi?",
  "Apa langkah aman sebelum saya kirim data pribadi?",
];

const GENERAL_EXPLANATIONS = [
  {
    title: "Validitas Perusahaan",
    explanation:
      "Pastikan nama perusahaan yang diklaim memiliki website korporat resmi dan posisi yang sama terbit di halaman karier resmi atau LinkedIn.",
  },
  {
    title: "Risiko Link & Kontak",
    explanation:
      "Kanal pendaftaran berupa shortlink atau email non-korporat (@gmail/@yahoo) berisiko. Mintalah konfirmasi via email domain perusahaan resmi.",
  },
  {
    title: "Langkah Aman",
    explanation:
      "Jangan bayar biaya administrasi/modul/seragam, jangan kirim KTP/OTP di awal, dan simpan bukti percakapan recruiter.",
  },
];

const CLAIM_PREFIX_PATTERN =
  /^\s*tingkat\s+risiko(?:\s+awal)?\s*[:\-–—]?\s*(?:rendah|sedang|tinggi)\b\s*[.:\-–—]?\s*/i;

/** Keeps the visible "Tingkat Risiko Awal: X." prefix consistent with the structured riskLevel. */
function composeClaimText(level: RiskLevel, text: string): string {
  const reason = text.replace(CLAIM_PREFIX_PATTERN, "").trim();
  return `Tingkat Risiko Awal: ${RISK_LEVEL_LABELS[level]}.${reason ? ` ${reason}` : ""}`;
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9À-ɏ]+/g, " ")
    .trim();
}

/** True when the quote (or every meaningful word of it) actually occurs in the posting text. */
function isGroundedQuote(quote: string, sourceText: string): boolean {
  const normalizedQuote = normalizeForMatch(quote);
  const normalizedSource = normalizeForMatch(sourceText);

  if (!normalizedQuote.length) {
    return false;
  }
  if (normalizedSource.includes(normalizedQuote)) {
    return true;
  }

  const words = normalizedQuote.split(" ").filter((word) => word.length >= 3);
  return words.length > 0 && words.every((word) => normalizedSource.includes(word));
}

function describeMaterial(text: string, imageCount: number): string {
  const parts: string[] = [];
  if (text.length) {
    parts.push(`${text.length} karakter teks`);
  }
  if (imageCount > 0) {
    parts.push(`${imageCount} gambar`);
  }
  return `Membaca materi lowongan: ${parts.join(" dan ")}`;
}

async function invokeAnalyzer(
  text: string,
  images: AnalyzeImage[],
  signals: DetectedSignal[] | null,
  search: WebSearchResult
): Promise<{ output: LLMAnalysisOutput; usage: AnalysisRunMeta["tokenUsage"] }> {
  const llm = getLLMModel({ temperature: 0.2 });
  const structuredLlm = llm.withStructuredOutput(LLMAnalysisOutputSchema, { includeRaw: true });

  const prompt = buildAnalyzerUserPrompt({
    text,
    imageCount: images.length,
    signals,
    sources: search.sources,
  });

  const userContent = images.length
    ? [{ type: "text", text: prompt }, ...images.map((image) => ({ type: "image_url", image_url: image.url }))]
    : prompt;

  const { raw, parsed } = await structuredLlm.invoke(
    [
      { role: "system", content: analyzerSystemPrompt },
      { role: "user", content: userContent },
    ],
    { signal: AbortSignal.timeout(LLM_TIMEOUT_MS) }
  );

  if (!parsed) {
    throw new Error("Model output did not match LLMAnalysisOutputSchema");
  }

  return { output: parsed, usage: readTokenUsage(raw) };
}

function mapModelOutput(
  output: LLMAnalysisOutput,
  { text, hasImages, search, meta }: { text: string; hasImages: boolean; search: WebSearchResult; meta: AnalysisRunMeta }
): AnalysisResult {
  // Citations: only IDs that resolve to a retrieved source survive.
  const sourceById = new Map(search.sources.map((source) => [source.id, source]));
  const citedIds = Array.from(new Set((output.summarySourceIds ?? []).map(normalizeSourceId)));
  const citedSources = citedIds.flatMap((id) => sourceById.get(id) ?? []);
  meta.droppedSourceIds = citedIds.length - citedSources.length;

  // Evidence quotes are checked against the posting text. Image input cannot be checked this way,
  // so quotes are kept as-is when an image is attached.
  const seenRisks = new Set<string>();
  const risks: AnalysisResult["risks"] = [];
  for (const risk of output.risks ?? []) {
    const description = risk.description?.trim();
    const key = `${risk.type}:${description}`;
    if (!description || seenRisks.has(key)) {
      continue;
    }
    seenRisks.add(key);

    const evidence = risk.evidence?.trim().replace(/^["“']+|["”']+$/g, "");
    if (evidence && !hasImages && !isGroundedQuote(evidence, text)) {
      meta.droppedEvidence += 1;
      risks.push({ type: risk.type, description });
    } else {
      risks.push(evidence ? { type: risk.type, description, evidence } : { type: risk.type, description });
    }
  }

  // No verdict without enough information: a "Rendah" here would falsely reassure the user.
  const assessment = output.informationSufficient ? output.riskAssessment : undefined;

  return {
    conversationText: output.conversationText?.trim() ?? "",
    claims: assessment
      ? [
          {
            riskLevel: assessment.riskLevel,
            text: composeClaimText(assessment.riskLevel, assessment.text ?? ""),
            confidence: Math.max(0, Math.min(MAX_CONFIDENCE, assessment.confidence ?? 0)),
          },
        ]
      : [],
    // In the main analysis a "not mentioned" salary card is noise; the salary action still shows it.
    salaryBenefit:
      output.salaryBenefit && output.salaryBenefit.status !== SALARY_NOT_MENTIONED
        ? { title: SALARY_BENEFIT_TITLE, ...output.salaryBenefit }
        : undefined,
    risks: risks.slice(0, MAX_RISKS),
    summary: output.summary?.trim() ?? "",
    summaryCitations: citedSources.map((source) => sourceToCitation(source, search.sources)),
    explanations: output.explanations ?? [],
    suggestedQuestions: (output.suggestedQuestions ?? []).slice(0, MAX_SUGGESTED_QUESTIONS),
    references: search.sources.length ? sourcesToReferences(search.sources) : GUIDANCE_REFERENCES,
    mode: "ai",
  };
}

/**
 * Raises the risk level when a deterministic signal demands a minimum (e.g. a fee request is
 * always at least "tinggi"). Returns the progress line to show when it changed the verdict.
 */
function applyRiskFloor(result: AnalysisResult, signals: DetectedSignal[]): string | null {
  const floor = strongestFloor(signals);
  if (!floor) {
    return null;
  }

  const current = result.claims[0];
  if (current && compareRiskLevels(current.riskLevel, floor.level) >= 0) {
    return null;
  }
  // Without a verdict there is no posting to judge. Only direct evidence of fraud (fee or
  // sensitive-data requests) justifies creating one; a manipulation attempt alone does not.
  if (!current && floor.level !== "tinggi") {
    return null;
  }

  const { level, signal } = floor;
  const reason = `Terdeteksi ${labelInSentence(signal)}. ${signal.floorReason ?? ""}`.trim();
  result.claims = [
    {
      riskLevel: level,
      text: composeClaimText(level, reason),
      confidence: level === "tinggi" ? 0.85 : 0.6,
    },
  ];

  if (!result.risks.some((risk) => risk.type === signal.riskType)) {
    result.risks = [{ type: signal.riskType, description: signal.description, evidence: signal.evidence[0] }, ...result.risks];
  }

  return describeFloorForProgress(level, signal);
}

function buildNotJobInputResult(text: string): AnalysisResult {
  return {
    conversationText: text.length
      ? "Halo! Pesan ini sepertinya belum berisi detail lowongan kerja. Tempel teks, link, atau deskripsi poster lowongan yang ingin kamu periksa."
      : "Belum ada input lowongan yang bisa dianalisis. Tempel teks, link, atau deskripsi poster lowongan terlebih dahulu.",
    claims: [],
    risks: [],
    summary: "",
    summaryCitations: [],
    explanations: [],
    suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS,
    references: [],
  };
}

/** Limited, clearly labeled check used when the model cannot run. Never claims more than rules can know. */
function buildRuleBasedResult(text: string, signals: DetectedSignal[], search: WebSearchResult): AnalysisResult {
  if (!text.length) {
    return {
      conversationText:
        "Maaf, analisis gambar sedang tidak dapat dijalankan. Coba kirim ulang beberapa saat lagi, atau ketik isi lowongannya agar bisa saya periksa.",
      claims: [],
      risks: [],
      summary: "",
      summaryCitations: [],
      explanations: [],
      suggestedQuestions: [],
      references: [],
      mode: "rule_fallback",
    };
  }

  // A short message with no pattern hits is most likely a question, not a posting: ask for it
  // instead of issuing a verdict the rules cannot support.
  if (!signals.length && text.length < MIN_FALLBACK_VERDICT_LENGTH) {
    return {
      ...buildNotJobInputResult(text),
      conversationText:
        "Analisis AI sedang tidak dapat dijalankan dan pesan ini belum memuat detail lowongan. Tempel teks lengkap, link, atau poster lowongannya agar bisa diperiksa.",
      mode: "rule_fallback",
    };
  }

  const level = ruleBasedRiskLevel(signals);
  const strongSignals = signals.filter((signal) => signal.severity === "strong");
  const moderateSignals = signals.filter((signal) => signal.severity === "moderate");

  let reason: string;
  if (strongSignals.length) {
    reason = `Terdeteksi ${strongSignals.map(labelInSentence).join(" dan ")}.`;
  } else if (moderateSignals.length) {
    reason = `Ditemukan hal yang perlu diverifikasi: ${moderateSignals.map(labelInSentence).join(", ")}.`;
  } else {
    reason =
      "Belum dapat dipastikan. Pemeriksaan terbatas tidak menemukan pola mencurigakan yang umum, tetapi identitas perusahaan dan kanal pendaftarannya belum diverifikasi.";
  }

  const risks: AnalysisResult["risks"] = signals.length
    ? signals.map((signal) => ({ type: signal.riskType, description: signal.description, evidence: signal.evidence[0] }))
    : [
        {
          type: "missing_context",
          description: "Identitas perusahaan, kanal pendaftaran, dan legalitasnya belum dapat diverifikasi secara otomatis.",
        },
      ];

  return {
    conversationText:
      "Analisis AI sedang tidak dapat dijalankan, jadi yang tampil di bawah adalah **pemeriksaan otomatis terbatas** berbasis pola. Hasil ini belum mempertimbangkan konteks lengkap lowongan, jadi gunakan sebagai pengingat awal.",
    claims: [
      {
        riskLevel: level,
        text: composeClaimText(level, reason),
        confidence: strongSignals.length ? 0.7 : 0.4,
      },
    ],
    risks,
    summary: `Pemeriksaan otomatis terbatas menemukan ${signals.length} pola berisiko pada materi ini. Karena analisis AI tidak tersedia, konteks lengkap lowongan belum dinilai; lakukan verifikasi ke kanal resmi perusahaan.`,
    summaryCitations: [],
    explanations: GENERAL_EXPLANATIONS,
    suggestedQuestions: DEFAULT_SUGGESTED_QUESTIONS,
    references: search.sources.length ? sourcesToReferences(search.sources) : GUIDANCE_REFERENCES,
    mode: "rule_fallback",
  };
}

/**
 * Full analysis pipeline: preprocess -> rule signals -> web search -> model -> grounding checks
 * -> risk floor. Returns the client-facing result plus run metadata for logging and evaluation.
 */
export async function runAnalysis({ input, images = [] }: AnalyzeInput, options: AnalyzeOptions = {}): Promise<AnalysisRun> {
  const { onProgress, useRules = true, useSearch = true, useLLM = true } = options;
  const startedAt = Date.now();

  const preprocessed = preprocessJobInput(input);
  const text = preprocessed.cleanedText;
  const hasImages = images.length > 0;

  const meta: AnalysisRunMeta = {
    mode: "ai",
    signals: [],
    search: { status: "disabled", retrievedCount: 0, sourceCount: 0 },
    riskFloorApplied: false,
    droppedSourceIds: 0,
    droppedEvidence: 0,
    timingsMs: { search: 0, llm: 0, total: 0 },
  };

  if ((!text.length || !preprocessed.hasSubstantiveContent) && !hasImages) {
    meta.mode = "not_job_input";
    meta.timingsMs.total = Date.now() - startedAt;
    return { result: buildNotJobInputResult(text), meta };
  }

  const steps: string[] = [];
  const addStep = (step: string) => {
    steps.push(step);
    onProgress?.([{ intent: PROGRESS_INTENT, steps: [...steps] }]);
  };

  addStep(describeMaterial(text, images.length));

  const signals = useRules ? detectSignals(text) : [];
  meta.signals = signals.map(({ id, severity }) => ({ id, severity }));
  if (useRules) {
    addStep(describeSignalsForProgress(signals));
  }

  let search: WebSearchResult = { status: "skipped_no_query", retrievedCount: 0, sources: [] };
  if (useSearch) {
    const searchStartedAt = Date.now();
    search = await searchWeb(buildVerificationQuery(preprocessed));
    meta.timingsMs.search = Date.now() - searchStartedAt;
    meta.search = { status: search.status, retrievedCount: search.retrievedCount, sourceCount: search.sources.length };
    addStep(describeSearchForProgress(search));
  }

  let result: AnalysisResult | null = null;

  if (useLLM) {
    addStep("Menelaah materi dengan model AI");
    const llmStartedAt = Date.now();
    try {
      const { output, usage } = await invokeAnalyzer(text, images, useRules ? signals : null, search);
      meta.tokenUsage = usage;
      result = mapModelOutput(output, { text, hasImages, search, meta });
      steps.push(
        ...(output.analysisSteps ?? [])
          .map((step) => step.trim())
          .filter(Boolean)
          .slice(0, MAX_MODEL_STEPS)
      );
    } catch (error) {
      meta.fallbackReason = error instanceof Error ? error.message : String(error);
      console.error("[Analyzer] Model analysis failed, using rule-based fallback:", meta.fallbackReason);
      addStep("Model AI tidak dapat dijalankan, beralih ke pemeriksaan berbasis aturan");
    } finally {
      meta.timingsMs.llm = Date.now() - llmStartedAt;
    }
  } else {
    meta.fallbackReason = "model disabled";
  }

  if (!result) {
    meta.mode = "rule_fallback";
    result = buildRuleBasedResult(text, signals, search);
  }

  if (useRules) {
    const floorStep = applyRiskFloor(result, signals);
    if (floorStep) {
      meta.riskFloorApplied = true;
      steps.push(floorStep);
    }
  }

  result.reasoning = [{ intent: PROGRESS_INTENT, steps: [...steps] }];
  meta.timingsMs.total = Date.now() - startedAt;

  return { result: AnalysisSchema.parse(result), meta };
}
