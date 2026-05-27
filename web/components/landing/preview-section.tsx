import { ArrowRight, BookOpen, Gauge, Quote } from "lucide-react";

export function PreviewSection() {
  return (
    <section
      id="produk"
      className="mx-auto mb-24 grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-4 sm:mb-32 sm:px-8 md:grid-cols-12 md:gap-10"
    >
      <div className="relative md:col-span-7">
        <div className="relative z-10 ml-auto max-w-xl rounded-lg border border-[#17232c]/10 bg-white p-5 shadow-[0_18px_45px_rgba(23,35,44,0.08)] sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#17232c]/10 pb-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a6a76] sm:text-xs">
                Contoh lowongan yang dibedah
              </span>
              <h3 className="mt-3 font-[var(--font-instrument-serif)] text-3xl leading-[0.95] text-[#17232c] sm:text-[2.45rem]">
                "Magang remote, gaji 8 juta, daftar via WA pribadi + biaya onboarding."
              </h3>
            </div>
            <Quote className="mt-1 size-5 shrink-0 text-[#2b6f95]" />
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-[#a34d3c]/20 bg-[#fff6f3] p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#a34d3c]">
                Red flag utama
              </div>
              <p className="text-sm leading-relaxed text-[#5a6a76]">
                Diminta biaya onboarding di awal dan diarahkan cepat ke chat personal.
              </p>
            </div>
            <div className="rounded-lg border border-[#3a7ca5]/20 bg-[#eef7fc] p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#3a7ca5]">
                Validitas perusahaan
              </div>
              <p className="text-sm leading-relaxed text-[#5a6a76]">
                Nama perusahaan perlu dicocokkan lagi ke website resmi, halaman karier, dan LinkedIn resmi.
              </p>
            </div>
            <div className="rounded-lg border border-[#2b6f95]/20 bg-[#f2f9fd] p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2b6f95]">
                Rekomendasi awal
              </div>
              <p className="text-sm leading-relaxed text-[#5a6a76]">
                Tahan kirim data sensitif dan verifikasi kanal resmi dulu sebelum lanjut daftar.
              </p>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-12 left-0 z-20 w-[19rem] rounded-lg border border-[#17232c]/10 bg-[#fbfdff]/90 p-4 shadow-[0_18px_45px_rgba(23,35,44,0.08)] backdrop-blur sm:-left-5 sm:w-80 sm:p-5">
          <div className="mb-4 flex items-center justify-between text-[#17232c]">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-[#2b6f95]" />
              <span className="text-sm font-semibold">Sumber verifikasi</span>
            </div>
            <Gauge className="size-4 text-[#47789a]" />
          </div>
          <ul className="space-y-3 sm:space-y-4">
            {[
              { label: "01", title: "Website/career page resmi", note: "cek apakah lowongan yang sama benar-benar muncul" },
              { label: "02", title: "LinkedIn resmi perusahaan", note: "cocokkan identitas brand dan kanal kontak" },
            ].map((source) => (
              <li key={source.label} className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#e8f2f8] text-xs text-[#17232c]">
                  {source.label}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#17232c]">{source.title}</div>
                  <div className="mt-0.5 text-xs text-[#5a6a76]">{source.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="md:col-span-5 motion-safe:animate-[fadeUp_1000ms_cubic-bezier(0.22,1,0.36,1)_both]">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[#5a6a76]">Cara AI menjelaskan</p>
        <h2 className="mb-5 font-[var(--font-instrument-serif)] text-[2.45rem] leading-[0.98] text-[#17232c] sm:mb-6 sm:text-5xl">
          Risiko dibuat terlihat, langkah aman dibuat jelas.
        </h2>
        <p className="mb-7 text-base leading-relaxed text-[#5a6a76] sm:mb-8 sm:text-lg">
          Platform ini tidak memberi vonis hitam-putih. Ia membantu membedah indikator mencurigakan, konteks yang hilang,
          dan langkah aman praktis sebelum kamu mengambil keputusan.
        </p>
        <a
          href="#cara-kerja"
          className="group inline-flex items-center gap-3 text-sm font-medium text-[#2b6f95] transition-colors hover:text-[#215875] sm:text-base"
        >
          Jelajahi cara kerjanya
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
