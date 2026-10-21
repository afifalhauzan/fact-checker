"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquarePlus, RotateCcw } from "lucide-react";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { ClaimCard } from "@/components/cards/ClaimCard";
import { SummaryCard } from "@/components/cards/SummaryCard";
import { RiskCard } from "@/components/cards/RiskCard";
import { AnalysisActions } from "@/components/cards/AnalysisActions";
import { ReasoningComponent } from "@/components/cards/ReasoningComponent";
import { PrototypeBanner } from "@/components/telaah-bersama/prototype-banner";
import { MockAttachment } from "@/components/telaah-bersama/mock-attachment";
import { BuatPostPrompt, SessionMoveCard, SimilarTelaahCard } from "@/components/telaah-bersama/chat-cards";
import { cn } from "@/utils/utils";
import { DEFAULT_ANALYSIS_ACTIONS } from "@/types/ui-actions";
import type { Risk } from "@/langchain/agents/analyzer/schema";
import { posts } from "@/lib/telaah-bersama/mock-data";

// Click-through prototype of the chat flows in docs/wiki/ai/06-DESAIN-TELAAH-BERSAMA.md (6.2, 6.10, 6.11).
// Nothing here calls the analysis API.

const STEP_DELAY_MS = 650;
const PIPELINE_STEPS = [
  "Membaca materi lowongan",
  "Memeriksa pola berisiko dengan aturan",
  "Mencari jejak perusahaan di web",
  "Menelaah materi dengan model AI",
];

interface MockAnalysis {
  opening: string;
  summary: string;
  claim: string;
  confidence: number;
  risks: Risk[];
  canPost: boolean;
}

const PLN_POST = posts[0];

const PLN_ANALYSIS: MockAnalysis = {
  opening: "Terima kasih, saya sudah menelaah surat panggilan ini. Ada tanda bahaya yang perlu kamu perhatikan.",
  summary: PLN_POST.summary,
  claim: PLN_POST.claim,
  confidence: 0.85,
  risks: PLN_POST.evidence,
  canPost: true,
};

const BARISTA_ANALYSIS: MockAnalysis = {
  opening: "Saya sudah menelaah lowongan barista ini.",
  summary:
    "Lowongan barista di kedai Kopi Senja, Malang, dengan gaji Rp2,8 juta. Lamaran hanya lewat WhatsApp pribadi, tanpa alamat kedai.",
  claim:
    "Tingkat Risiko Awal: Sedang. Tidak ada permintaan biaya, tetapi kontak hanya lewat WhatsApp pribadi dan alamat usaha tidak disebutkan, sehingga identitas pemberi kerja perlu diverifikasi.",
  confidence: 0.6,
  risks: [
    {
      type: "suspicious_contact",
      description: "Lamaran hanya lewat WhatsApp pribadi, tanpa kanal resmi usaha.",
      evidence: "kirim CV ke WA 0896-0000-1188",
    },
    { type: "missing_context", description: "Alamat kedai dan nama pemilik usaha tidak disebutkan." },
  ],
  canPost: true,
};

const PLN_MESSAGE =
  "Kak, saya dapat surat panggilan tes dari PT Listrik Nusantara buat Staff Admin. Disuruh transfer Rp1.350.000 ke Citra Wisata Travel buat akomodasi, konfirmasi ke WA 0812-0000-4471. Ini aman nggak?";

const BARISTA_MESSAGE =
  "Dibutuhkan barista Kopi Senja Malang, gaji 2,8 jt, shift pagi/sore. Minat kirim CV ke WA 0896-0000-1188, dibuka sampai 10 November 2026.";

function UserBubble({ text, attachment }: { text: string; attachment?: { label: string; variant: "poster" | "chat" } }) {
  return (
    <div className="flex justify-end">
      <div className="flex w-full flex-col items-end gap-2 md:max-w-[82%]">
        {attachment && (
          <div className="w-40">
            <MockAttachment label={attachment.label} variant={attachment.variant} />
          </div>
        )}
        <div className="max-w-full rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </div>
  );
}

function AssistantText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-foreground">{children}</p>;
}

function Appear({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
      {children}
    </motion.div>
  );
}

/** Plays the reasoning steps one by one, then shows the analysis cards. */
function SimulatedAnalysis({ id, analysis }: { id: string; analysis: MockAnalysis }) {
  const [shownSteps, setShownSteps] = React.useState(1);
  const isDone = shownSteps > PIPELINE_STEPS.length;

  React.useEffect(() => {
    if (isDone) return;
    const timer = setTimeout(() => setShownSteps((count) => count + 1), STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shownSteps, isDone]);

  return (
    <div className="space-y-3">
      <ReasoningComponent
        messageId={id}
        reasoning={[{ intent: "Tahapan pemeriksaan TelaahKarier", steps: PIPELINE_STEPS.slice(0, shownSteps) }]}
        isStreaming={!isDone}
        defaultOpen={!isDone}
      />
      {isDone && <AnalysisResult analysis={analysis} />}
    </div>
  );
}

function AnalysisResult({ analysis }: { analysis: MockAnalysis }) {
  return (
    <Appear>
      <AssistantText>{analysis.opening}</AssistantText>
      <SummaryCard summary={analysis.summary} />
      <ClaimCard text={analysis.claim} />
      <div className="space-y-2">
        {analysis.risks.map((risk, index) => (
          <RiskCard key={index} type={risk.type} description={risk.description} evidence={risk.evidence} />
        ))}
      </div>
      <AnalysisActions messageId="prototype" actions={DEFAULT_ANALYSIS_ACTIONS} onActionClick={() => undefined} />
      {analysis.canPost && <BuatPostPrompt />}
    </Appear>
  );
}

function ScenarioNewTelaah() {
  return (
    <>
      <UserBubble text={PLN_MESSAGE} attachment={{ label: "Surat panggilan tes", variant: "poster" }} />
      <AnalysisResult analysis={PLN_ANALYSIS} />
    </>
  );
}

function ScenarioSimilarFound() {
  const [choice, setChoice] = React.useState<"self" | null>(null);

  return (
    <>
      <UserBubble text={PLN_MESSAGE} />
      <Appear>
        <AssistantText>
          Lowongan seperti ini <b>sudah pernah ditelaah dan dibagikan</b> pengguna lain. Kamu bisa membaca Telaah itu
          beserta diskusinya, atau tetap menelaah pesanmu sendiri.
        </AssistantText>
        <SimilarTelaahCard
          post={PLN_POST}
          reasons={["Nomor WA sama", "Perusahaan & posisi sama", "Periode pendaftaran tumpang-tindih"]}
          ownSignals={["Permintaan biaya: “transfer Rp1.350.000 ke Citra Wisata Travel”"]}
          choice={choice}
          onSelfAnalyze={() => setChoice("self")}
        />
      </Appear>
      {choice === "self" && <SimulatedAnalysis id="similar-self" analysis={PLN_ANALYSIS} />}
    </>
  );
}

function ScenarioSecondPosting() {
  const [choice, setChoice] = React.useState<"move" | "stay" | null>(null);
  const [view, setView] = React.useState<"old" | "new">("old");
  const [hasMoved, setHasMoved] = React.useState(false);

  React.useEffect(() => {
    if (choice !== "move") return;
    const timer = setTimeout(() => {
      setHasMoved(true);
      setView("new");
    }, 900);
    return () => clearTimeout(timer);
  }, [choice]);

  if (view === "new") {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
            Sesi baru. Pesanmu dipindahkan dari sesi sebelumnya.
          </span>
          <button type="button" onClick={() => setView("old")} className="font-medium text-primary hover:underline">
            Lihat sesi sebelumnya
          </button>
        </div>
        <UserBubble text={BARISTA_MESSAGE} />
        <SimulatedAnalysis id="moved" analysis={BARISTA_ANALYSIS} />
      </>
    );
  }

  return (
    <>
      <UserBubble text={PLN_MESSAGE} attachment={{ label: "Surat panggilan tes", variant: "poster" }} />
      <Appear>
        <AssistantText>{PLN_ANALYSIS.opening}</AssistantText>
        <ClaimCard text={PLN_ANALYSIS.claim} />
        <RiskCard {...PLN_ANALYSIS.risks[0]} />
      </Appear>
      <UserBubble text="Kalau saya cuma konfirmasi kehadiran ke WA itu, aman nggak?" />
      <AssistantText>
        Sebaiknya jangan dulu. Konfirmasi lewat WA pribadi biasanya diikuti desakan untuk transfer. Cek pengumuman di
        situs resmi perusahaan, lalu hubungi kontak resmi yang tercantum di sana.
      </AssistantText>

      {choice === "move" ? (
        hasMoved ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <span>Pesan tentang lowongan barista sudah dipindahkan ke sesi baru dan tidak tersimpan di sesi ini.</span>
            <button type="button" onClick={() => setView("new")} className="font-medium text-primary hover:underline">
              Buka sesi baru
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">Membuka sesi baru…</p>
        )
      ) : (
        <>
          <UserBubble text={BARISTA_MESSAGE} />
          <Appear>
            <SessionMoveCard
              previousTitle="Surat panggilan tes PT Listrik Nusantara (Persero)"
              choice={choice}
              onMove={() => setChoice("move")}
              onStay={() => setChoice("stay")}
            />
          </Appear>
          {choice === "stay" && (
            <>
              <p className="rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] text-violet-800">
                Catatan prototipe: pilihan ini dicatat sebagai peringatan keliru untuk mengukur akurasi router.
              </p>
              <SimulatedAnalysis id="stay" analysis={BARISTA_ANALYSIS} />
            </>
          )}
        </>
      )}
    </>
  );
}

const SCENARIOS = [
  {
    id: "baru",
    label: "1. Telaah baru",
    description: "Hasil Tinggi memunculkan tombol Buat post?, yang membuka halaman Buat Post.",
    Component: ScenarioNewTelaah,
  },
  {
    id: "serupa",
    label: "2. Sudah pernah ditelaah",
    description: "Lowongan mirip Telaah yang sudah ada. Pilih Baca Telaah, atau Tetap telaah sendiri.",
    Component: ScenarioSimilarFound,
  },
  {
    id: "kedua",
    label: "3. Lowongan kedua di sesi",
    description: "Pengguna menempel lowongan lain di sesi yang sama. Coba kedua pilihan peringatannya.",
    Component: ScenarioSecondPosting,
  },
] as const;

export default function ChatPrototypePage() {
  const [scenarioId, setScenarioId] = React.useState<(typeof SCENARIOS)[number]["id"]>("baru");
  const [runKey, setRunKey] = React.useState(0);
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0];
  const { Component } = scenario;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ProtectedTopNavbar />
      <PrototypeBanner />

      <div className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {SCENARIOS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setScenarioId(item.id);
                  setRunKey((key) => key + 1);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  item.id === scenarioId
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRunKey((key) => key + 1)}
              className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Ulangi
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{scenario.description}</p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 py-6">
        <Component key={`${scenarioId}-${runKey}`} />
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 py-3">
          <div className="rounded-xl border border-input bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            Prototipe: kolom pesan dinonaktifkan. Pilih skenario di atas.
          </div>
        </div>
      </div>
    </div>
  );
}
