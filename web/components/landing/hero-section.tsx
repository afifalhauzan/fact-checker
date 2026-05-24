"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Image,
  Link2,
  Paperclip,
  Search,
  SendHorizontal,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { saveLandingChatDraft, type LandingAttachmentDraft } from "@/lib/landing-chat-handoff";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createAttachmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `landing-attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const reasoningSteps = [
  {
    title: "Mendeteksi klaim utama",
    description: "Memisahkan pernyataan yang bisa diuji dari opini, nada, dan asumsi.",
    signal: "Klaim terurai",
    tone: "border-[#2b6f95]/20 bg-[#f2f9fd]",
  },
  {
    title: "Mencari konteks tambahan",
    description: "Melihat apa yang hilang: waktu, ruang lingkup, pembanding, dan definisi.",
    signal: "Konteks kurang",
    tone: "border-[#3a7ca5]/20 bg-[#eef7fc]",
  },
  {
    title: "Membandingkan kualitas sumber",
    description: "Memprioritaskan sumber primer, rekam jejak, dan konsistensi antar referensi.",
    signal: "Sumber ditimbang",
    tone: "border-[#325f7f]/20 bg-[#f4f9fd]",
  },
  {
    title: "Menandai potensi overclaim",
    description: "Membedakan bukti yang benar dari kesimpulan yang terlalu jauh.",
    signal: "Overclaim mungkin",
    tone: "border-[#a34d3c]/20 bg-[#fff7f7]",
  },
  {
    title: "Menyusun kesimpulan bernuansa",
    description: "Memberi ringkasan, tingkat keyakinan, dan pertanyaan lanjutan yang perlu dicek.",
    signal: "Bukan verdict final",
    tone: "border-[#17232c]/15 bg-white",
  },
];

const inputModes = [
  { label: "Klaim", icon: FileText },
  { label: "Screenshot", icon: Image },
  { label: "Link", icon: Link2 },
];

function ReasoningFlow({ input, hasAttachments }: { input: string; hasAttachments: boolean }) {
  const hasDraft = input.trim().length > 0 || hasAttachments;
  const displayClaim =
    input.trim() ||
    "Minum kopi tiga kali sehari terbukti menggantikan kebutuhan air putih.";

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
                {hasDraft ? "Analisis berjalan" : "Simulasi setelah submit"}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#17232c]">
                "{displayClaim}"
              </p>
            </div>
            <div className="w-fit rounded-full border border-[#2b6f95]/15 bg-[#e9f4f9] px-3 py-1 text-xs font-medium text-[#2b6f95]">
              Reasoning view
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
          className="rounded-lg border border-[#17232c]/10 bg-[#142634] p-5 text-[#f8fbff] shadow-[0_18px_50px_rgba(23,35,44,0.12)] motion-safe:opacity-0 motion-safe:animate-[fadeUp_760ms_cubic-bezier(0.22,1,0.36,1)_forwards]"
          style={{ animationDelay: "1040ms" }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#b8c9d6]">Output yang diutamakan</p>
          <h3 className="mt-4 font-[var(--font-instrument-serif)] text-4xl leading-[0.95] text-white">
            Bukan cuma benar atau salah.
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-[#d7e4ec]">
            FactChecker AI menjelaskan ruang abu-abu: apa yang kuat, apa yang lemah, dan bagian mana yang masih perlu
            diverifikasi manusia.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-[#b8c9d6]">
                <span>Keyakinan analisis</span>
                <span>72%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[72%] rounded-full bg-[#8fc7e3]" />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <AlertTriangle className="size-4 text-[#f2c879]" />
                  Overclaim
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#c8d7e0]">Kesimpulan lebih luas dari bukti awal.</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <CheckCircle2 className="size-4 text-[#8fc7e3]" />
                  Sumber primer
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#c8d7e0]">Perlu dibandingkan dengan data asli.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function HeroSection() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<LandingAttachmentDraft[]>([]);
  const [isPreparingAttachments, setIsPreparingAttachments] = React.useState(false);

  const handleSelectFiles = React.useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setIsPreparingAttachments(true);
    try {
      const selected = Array.from(files);
      const prepared = await Promise.all(
        selected.map(async (file): Promise<LandingAttachmentDraft> => ({
          id: createAttachmentId(),
          filename: file.name,
          mediaType: file.type || "application/octet-stream",
          url: await fileToDataUrl(file),
          size: file.size,
        }))
      );

      setAttachments((prev) => [...prev, ...prepared]);
    } catch (error) {
      console.error("[HeroSection] Failed to prepare attachments:", error);
    } finally {
      setIsPreparingAttachments(false);
    }
  }, []);

  const handleSubmit = React.useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault();

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

  const canSubmit = !isPreparingAttachments && (input.trim().length > 0 || attachments.length > 0);

  return (
    <section className="mx-auto mb-20 w-full max-w-[1440px] px-4 text-center sm:mb-28 sm:px-8">
      <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-[#5a6a76] motion-safe:animate-[fadeUp_600ms_cubic-bezier(0.22,1,0.36,1)_both]">
        Asisten berpikir kritis untuk informasi digital
      </div>

      <h1 className="mx-auto max-w-5xl font-regular text-4xl leading-[0.9] tracking-normal text-[#17232c] md:text-[4rem] motion-safe:animate-[fadeUp_760ms_cubic-bezier(0.22,1,0.36,1)_both]">
        Pahami informasi
        <span className="block italic font-medium text-[#2b6f95]">sebelum mempercayainya.</span>
      </h1>

      <div className="mx-auto mt-6 max-w-3xl sm:mt-7 motion-safe:animate-[fadeUp_880ms_cubic-bezier(0.22,1,0.36,1)_both]">
        <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-[#5a6a76] sm:text-md">
          FactChecker AI membedah klaim, tautan, atau screenshot menjadi konteks, kualitas sumber, potensi overclaim,
          dan tingkat ketidakpastian yang bisa kamu nilai sendiri.
        </p>

        <div className="mb-3 flex flex-wrap justify-center gap-2">
          {inputModes.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#17232c]/10 bg-white/60 px-3 py-1 text-xs font-medium text-[#5a6a76]"
            >
              <Icon className="size-3.5" />
              {label}
            </span>
          ))}
        </div>

        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-[#17232c]/10 bg-white px-3 py-1.5 text-xs text-[#5a6a76] shadow-sm"
              >
                <span className="truncate">{attachment.filename || "file"}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== attachment.id))}
                  className="rounded-full p-0.5 text-[#748493] transition-colors hover:bg-[#edf5fa] hover:text-[#17232c]"
                  aria-label="Hapus file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-white p-1.5 shadow-[0_18px_45px_rgba(23,35,44,0.08)] ring-1 ring-[#17232c]/10 transition-all focus-within:ring-2 focus-within:ring-[#2b6f95]/25 sm:p-2"
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <Search className="ml-3 size-4 text-[#748493] sm:ml-4" strokeWidth={2} />
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tempel klaim, link berita, atau jelaskan screenshot..."
              className="w-full bg-transparent px-2 py-3 text-sm text-[#17232c] placeholder:text-[#9aa9b5] focus:outline-none sm:px-4 sm:py-4 sm:text-base"
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                void handleSelectFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5a6a76] transition-colors hover:bg-[#edf5fa] hover:text-[#17232c] sm:mr-0"
              title="Lampirkan file"
              aria-label="Lampirkan file"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-md bg-[#2b6f95] px-4 py-2.5 text-sm font-medium text-[#f8fbff] shadow-[0_10px_24px_rgba(43,111,149,0.22)] transition hover:bg-[#215875] disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-3.5"
            >
              Analisis
              <SendHorizontal className="hidden size-4 sm:block" />
            </button>
          </div>
        </form>
      </div>

      <ReasoningFlow input={input} hasAttachments={attachments.length > 0} />
    </section>
  );
}
