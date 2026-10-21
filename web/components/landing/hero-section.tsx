"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Composer } from "@/components/chat/composer";
import { saveLandingChatDraft, type LandingAttachmentDraft } from "@/lib/landing-chat-handoff";
import { prepareAttachments } from "@/lib/attachments";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { formatRelativeTime } from "@/utils/formatters";

const reasoningSteps = [
  {
    title: "Mengekstrak info lowongan",
    description: "Mengurai posisi, nama perusahaan, kanal pendaftaran, serta kontak recruiter dari materi awal.",
    signal: "Info inti terbaca",
    tone: "border-[#2b6f95]/20 bg-[#f2f9fd]",
  },
  {
    title: "Menandai indikator mencurigakan",
    description: "Mencari red flag seperti biaya awal, komunikasi personal, dan janji benefit yang terlalu muluk.",
    signal: "Red flag terdeteksi",
    tone: "border-[#3a7ca5]/20 bg-[#eef7fc]",
  },
  {
    title: "Memeriksa validitas kanal",
    description: "Membandingkan domain, email, link pendaftaran, dan akun perusahaan dengan kanal resmi.",
    signal: "Kanal diuji",
    tone: "border-[#325f7f]/20 bg-[#f4f9fd]",
  },
  {
    title: "Menilai tingkat risiko awal",
    description: "Menyusun level risiko rendah/sedang/tinggi berdasarkan kombinasi indikator yang muncul.",
    signal: "Risiko terukur",
    tone: "border-[#a34d3c]/20 bg-[#fff7f7]",
  },
  {
    title: "Menyusun langkah aman",
    description: "Memberi checklist tindakan aman sebelum daftar, kirim data pribadi, atau melakukan pembayaran.",
    signal: "Bukan vonis final",
    tone: "border-[#17232c]/15 bg-white",
  },
];

function ReasoningFlow({ input, hasAttachments }: { input: string; hasAttachments: boolean }) {
  const hasDraft = input.trim().length > 0 || hasAttachments;
  const displayClaim =
    input.trim() ||
    "Lowongan magang remote admin data, gaji 7-9 juta, daftar via WA + biaya onboarding.";

  return (
    <div
      key={hasDraft ? "live-reasoning" : "sample-reasoning"}
      className="mx-auto mt-8 w-full max-w-5xl text-left sm:mt-10"
    >
      <div className="grid gap-4 md:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-lg border border-[#17232c]/10 bg-[#fbfdff]/[0.86] p-4 shadow-[0_18px_50px_rgba(23,35,44,0.07)] backdrop-blur sm:p-5">
          <div className="mb-4 flex flex-col gap-3 border-b border-[#17232c]/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#5a6a76]">
                {/* {hasDraft ? "Analisis berjalan" : "Simulasi setelah submit"} */}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#17232c]">
                "{displayClaim}"
              </p>
            </div>
          </div>

          <div className="mb-3">
            <TypingIndicator />
          </div>

          <div className="relative space-y-3">
            <div className="absolute bottom-6 left-[15px] top-6 w-px bg-[#17232c]/10" />
            {reasoningSteps.map((step, index) => (
              <div
                key={step.title}
                className={`relative flex gap-3 rounded-lg border p-3 motion-safe:opacity-0 motion-safe:animate-[fadeUp_620ms_cubic-bezier(0.22,1,0.36,1)_forwards] ${step.tone}`}
                style={{ animationDelay: `${index * 160 + 160}ms` }}
              >
                <div className="relative z-10 mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-[#17232c]/10 bg-white text-xs font-semibold text-[#2b6f95]">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-sm font-semibold text-[#17232c]">{step.title}</h3>
                    <span className="w-fit rounded-full border border-[#17232c]/10 bg-white/70 px-2 py-1 text-[11px] font-medium text-[#5a6a76]">
                      {step.signal}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#5a6a76]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside
          className="rounded-lg border border-[#17232c]/10 bg-slate-50 p-5 text-[#f8fbff] shadow-[0_18px_50px_rgba(23,35,44,0.12)] motion-safe:opacity-0 motion-safe:animate-[fadeUp_760ms_cubic-bezier(0.22,1,0.36,1)_forwards]"
          style={{ animationDelay: "1040ms" }}
        >
          <h3 className="mt-4 font-[var(--font-instrument-serif)] text-4xl leading-[0.95] text-slate-800">
            Bukan sekadar aman atau tidak aman.
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            Sistem membantu membaca ruang abu-abu: indikator risiko, bagian yang masih lemah, dan apa yang wajib
            diverifikasi manual sebelum kamu bertindak.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>Keyakinan analisis awal</span>
                <span>78%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[78%] rounded-full bg-[#8fc7e3]" />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <AlertTriangle className="size-4 text-[#f2c879]" />
                  Red flag
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">Permintaan biaya dan kontak personal naikkan risiko.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <CheckCircle2 className="size-4 text-[#8fc7e3]" />
                  Verifikasi kanal
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">Cocokkan ke website resmi dan halaman karier.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const MAX_RECENT_SESSIONS = 3;

/** Signed-in visitors can pick up their latest telaah right from the homepage. */
function RecentSessions() {
  const { sessions, isGuest, isLoading } = useChatSessions();
  if (isLoading || isGuest || sessions.length === 0) return null;

  return (
    <div className="mt-5 text-left">
      <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-medium text-[#5a6a76]">
        <History className="size-3.5" />
        Lanjutkan telaah terakhir
      </p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {sessions.slice(0, MAX_RECENT_SESSIONS).map((session) => (
          <li key={session.id}>
            <Link
              href={`/chat?conversation_id=${encodeURIComponent(session.id)}`}
              className="block rounded-lg border border-[#17232c]/10 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-[#2b6f95]/40"
            >
              <span className="block truncate text-sm font-medium text-[#17232c]">{session.title || "Telaah tanpa judul"}</span>
              <span className="text-xs text-[#5a6a76]">{formatRelativeTime(session.updated_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HeroSection() {
  const router = useRouter();
  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<LandingAttachmentDraft[]>([]);
  const [isPreparingAttachments, setIsPreparingAttachments] = React.useState(false);
  const [attachmentNotice, setAttachmentNotice] = React.useState<string | null>(null);

  const handleSelectFiles = React.useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      setIsPreparingAttachments(true);
      try {
        const { attachments: prepared, rejections } = await prepareAttachments(files, attachments.length);
        setAttachmentNotice(rejections.length ? rejections.join(" ") : null);
        setAttachments((prev) => [...prev, ...prepared]);
      } catch (error) {
        console.error("[HeroSection] Failed to prepare attachments:", error);
        setAttachmentNotice("Gagal membaca lampiran. Coba lagi ya.");
      } finally {
        setIsPreparingAttachments(false);
      }
    },
    [attachments.length]
  );

  const handleSubmit = React.useCallback(
    () => {
      const text = input.trim();
      const hasText = text.length > 0;
      const hasAttachments = attachments.length > 0;

      if (!hasText && !hasAttachments) return;

      saveLandingChatDraft({
        text,
        attachments,
      });

      router.push("/chat");
    },
    [attachments, input, router]
  );

  return (
    <section className="mx-auto mb-20 w-full max-w-[1440px] px-4 text-center sm:mb-28 sm:px-8">
      <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-[#5a6a76] motion-safe:animate-[fadeUp_600ms_cubic-bezier(0.22,1,0.36,1)_both]">
        Analisis risiko lowongan kerja digital
      </div>

      <h1 className="mx-auto max-w-5xl font-regular text-4xl leading-[0.9] tracking-normal text-[#17232c] md:text-[4rem] motion-safe:animate-[fadeUp_760ms_cubic-bezier(0.22,1,0.36,1)_both]">
        Cek Risiko Lowongan Kerja
        <span className="block italic font-medium text-[#2b6f95]">sebelum anda daftar.</span>
      </h1>

      <div className="mx-auto mt-6 max-w-3xl sm:mt-7 motion-safe:animate-[fadeUp_880ms_cubic-bezier(0.22,1,0.36,1)_both]">
        <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-[#5a6a76] sm:text-md">
          Unggah poster, screenshot, teks, atau link lowongan kerja. Sistem akan membantu membedah red flag,
          validitas perusahaan, risiko link/kontak, dan langkah aman sebelum kamu kirim data atau melakukan pembayaran.
        </p>

        <Composer
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isPreparingAttachments}
          attachments={attachments}
          onSelectFiles={(files) => void handleSelectFiles(files)}
          onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((item) => item.id !== id))}
          autoFocus={false}
          className="shadow-[0_18px_45px_rgba(23,35,44,0.08)]"
        />

        {attachmentNotice && (
          <p role="alert" className="mt-2 text-xs text-[#a34d3c]">
            {attachmentNotice}
          </p>
        )}

        <RecentSessions />
      </div>

      <ReasoningFlow input={input} hasAttachments={attachments.length > 0} />
    </section>
  );
}
