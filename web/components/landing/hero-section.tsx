import { Search } from "lucide-react";

const promptIdeas = [
  "Makan gula menyebabkan diabetes - apakah ini benar?",
  "Ringkas dan jelaskan klaim utama",
  "Apa bias dari opini ini?",
];

export function HeroSection() {
  return (
    <section className="mx-auto mb-24 w-full max-w-[1440px] px-4 pt-10 text-center sm:mb-32 sm:px-8">
      <h1 className="font-['Newsreader',serif] text-[3rem] leading-[0.96] tracking-tight text-[#2c3437] sm:text-[4.75rem] md:text-[6.25rem] motion-safe:animate-[fadeUp_700ms_cubic-bezier(0.34,1.2,0.64,1)_both]">
        Pahami kebenaran,
        <span className="mt-1 block italic text-[#4e45e4] sm:mt-2">secara interaktif.</span>
      </h1>

      <div className="mx-auto mt-8 max-w-3xl sm:mt-10 motion-safe:animate-[fadeUp_900ms_cubic-bezier(0.34,1.2,0.64,1)_both]">
        <p className="mb-7 text-base text-[#596064] sm:text-lg">Punya informasi yang bikin ragu atau bingung?</p>

        <div className="rounded-full bg-white p-1.5 shadow-[0_20px_40px_rgba(44,52,55,0.08)] ring-1 ring-[#dce4e8] transition-all focus-within:ring-2 focus-within:ring-[#4e45e4]/30 sm:p-2">
          <div className="flex items-center">
            <Search className="ml-4 size-4 text-[#747c80] sm:ml-6" strokeWidth={2} />
            <input
              type="text"
              placeholder="Tempel artikel, klaim, atau opini..."
              className="w-full bg-transparent px-3 py-3 text-sm text-[#2c3437] placeholder:text-[#acb3b7] focus:outline-none sm:px-6 sm:py-4 sm:text-base"
            />
            <button className="rounded-full bg-[#4e45e4] px-5 py-2.5 text-sm font-medium text-[#fbf7ff] shadow-[0_10px_25px_rgba(78,69,228,0.25)] transition hover:brightness-110 sm:px-8 sm:py-3.5">
              Analisis
            </button>
          </div>
        </div>

        {/* <div className="mt-6 flex flex-wrap justify-center gap-2.5 sm:mt-8 sm:gap-3">
          {promptIdeas.map((idea) => (
            <button
              key={idea}
              className="rounded-full bg-[#e2e0f9] px-3 py-1.5 text-xs text-[#505064] transition-colors hover:bg-[#d4d2eb] sm:px-4 sm:text-sm"
            >
              {idea}
            </button>
          ))}
        </div> */}
      </div>
    </section>
  );
}
