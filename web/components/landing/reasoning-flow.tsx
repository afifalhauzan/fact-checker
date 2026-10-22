import { AlertTriangle, ArrowRight, BookOpen, CheckCircle, CheckCircle2 } from "lucide-react";

const input = "Contoh lowongan: Magang remote, gaji 8 juta, daftar via WA pribadi + biaya onboarding. Diminta biaya onboarding di awal dan diarahkan cepat ke chat personal. Nama perusahaan perlu dicocokkan lagi ke website resmi, halaman karier, dan LinkedIn resmi. Tahan kirim data sensitif dan verifikasi kanal resmi dulu sebelum lanjut daftar.";
const reasoningSteps = [
  {
    title: "Mengekstrak info lowongan",
    description: "Mengurai posisi, nama perusahaan, kanal pendaftaran, serta kontak recruiter dari materi awal.",
    signal: "Info inti terbaca",
    tone: "border-[#2b6f95]/20 bg-[#f2f9fd]",
  },
  {
    title: "Menandai indikator mencurigakan & Validitas sumber",
    description: "Mencari red flag seperti biaya awal, komunikasi personal, sumber informasi, dan janji benefit yang terlalu muluk.",
    signal: "Red flag terdeteksi",
    tone: "border-[#3a7ca5]/20 bg-[#eef7fc]",
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

export function ReasoningFlow() {
  const hasDraft = input.trim().length > 0;

  return (
    <div
      key={hasDraft ? "live-reasoning" : "sample-reasoning"}
      className="mx-auto mt-8 w-full max-w-5xl text-left sm:mt-10 mb-10 sm:mb-24"
    >
      <div className="grid gap-4 md:grid-cols-[1.12fr_0.88fr]">
        <div className="rounded-lg border border-[#17232c]/10 bg-[#fbfdff]/[0.86] p-4 shadow-[0_18px_50px_rgba(23,35,44,0.07)] backdrop-blur sm:p-5">
          <div className="mb-4 flex flex-col gap-3 pb-0 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#5a6a76]">
                Langkah Analisis
              </p>
            </div>
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
                  <CheckCircle className="size-4 text-[#8fc7e3]" />
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