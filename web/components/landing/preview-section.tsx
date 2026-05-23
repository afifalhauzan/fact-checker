import { ArrowRight, BookOpen } from "lucide-react";

export function PreviewSection() {
  return (
    <section className="mx-auto mb-24 grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-4 sm:mb-32 sm:px-8 md:grid-cols-12 md:gap-8">
      <div className="relative md:col-span-7">
        <div className="relative z-10 ml-auto max-w-md rounded-[28px] bg-white p-6 shadow-[0_20px_40px_rgba(44,52,55,0.08)] ring-1 ring-[#e3e9ed] sm:p-8">
          <div className="mb-5 flex items-center gap-3 sm:mb-6">
            <span className="size-2 rounded-full bg-[#a8364b]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#596064] sm:text-xs">
              Potential Misinformation
            </span>
          </div>
          <h3 className="mb-3 font-['Newsreader',serif] text-2xl leading-tight text-[#2c3437] sm:mb-4 sm:text-[2rem]">
            "Scientists discover coffee is now the only source of hydration needed."
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-[#596064] sm:mb-6">
            Deconstructed analysis shows this headline simplifies a study on polyphenols while ignoring
            cellular hydration metrics.
          </p>
          <div className="flex gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#e3e9ed]">
              <div className="h-full w-1/3 bg-[#a8364b]" />
            </div>
            <div className="h-1 flex-1 rounded-full bg-[#e3e9ed]" />
            <div className="h-1 flex-1 rounded-full bg-[#e3e9ed]" />
          </div>
        </div>

        <div className="absolute -bottom-12 left-0 z-20 w-64 rounded-2xl border border-white/50 bg-white/65 p-4 shadow-[0_20px_40px_rgba(44,52,55,0.08)] backdrop-blur-xl sm:-left-4 sm:w-72 sm:p-6">
          <div className="mb-4 flex items-center gap-3 text-[#2c3437]">
            <BookOpen className="size-4 text-[#4e45e4]" />
            <span className="text-sm font-semibold">Sumber</span>
          </div>
          <ul className="space-y-3 sm:space-y-4">
            {[
              { label: "01", width: "w-24" },
              { label: "02", width: "w-32" },
            ].map((source) => (
              <li key={source.label} className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded bg-[#e3e9ed] text-xs text-[#2c3437]">
                  {source.label}
                </div>
                <div className={`h-2 rounded-full bg-[#dce4e8] ${source.width}`} />
              </li>
            ))}
          </ul>
        </div>

        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_20%_20%,rgba(78,69,228,0.22),transparent_42%),radial-gradient(circle_at_80%_20%,rgba(103,96,253,0.2),transparent_44%),radial-gradient(circle_at_50%_90%,rgba(245,205,249,0.28),transparent_48%)] blur-2xl" />
        </div>
      </div>

      <div className="md:col-span-5 motion-safe:animate-[fadeUp_1000ms_cubic-bezier(0.34,1.2,0.64,1)_both]">
        <h2 className="mb-5 font-['Newsreader',serif] text-[2.25rem] leading-tight text-[#2c3437] sm:mb-6 sm:text-5xl">
          Memahami informasi,
          <br />
          hingga ke akarnya.
        </h2>
        <p className="mb-7 text-base leading-relaxed text-[#596064] sm:mb-8 sm:text-lg">
          AI kami tidak hanya memberi jawaban “benar” atau “salah”.
          Ia memetakan klaim, bias, dan sumber—agar kamu bisa menilai sendiri.
        </p>
        <button className="group inline-flex items-center gap-3 text-sm font-medium text-[#4e45e4] transition-colors hover:text-[#4135d8] sm:text-base">
          Jelajahi cara kerjanya
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
}
