import Link from "next/link";
import { ArrowRight, HandHelping } from "lucide-react";
import { RiskLevelBadge } from "@/components/telaah-bersama/badges";
import { hotScore, posts } from "@/lib/telaah-bersama/mock-data";

const MAX_TRENDING = 3;

export function TrendingSection() {
  // shortcut: ranked from prototype data at render time; switch to the Laravel list endpoint (sort=ramai).
  const trending = [...posts].sort((a, b) => hotScore(b) - hotScore(a)).slice(0, MAX_TRENDING);

  return (
    <section id="telaah-bersama" className="mx-auto mb-24 w-full max-w-7xl px-4 sm:mb-32 sm:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-[var(--font-instrument-serif)] text-[2.45rem] leading-[0.98] text-[#17232c] sm:text-5xl">
            Ramai ditelaah minggu ini.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#5a6a76]">
            Lowongan berisiko yang dibagikan pengguna di Telaah Bersama. Menerima yang mirip? Kamu tidak sendirian.
          </p>
        </div>
        <Link
          href="/telaah-bersama"
          className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[#2b6f95] transition-colors hover:text-[#215875] sm:text-base"
        >
          Lihat Telaah Bersama
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {trending.map((post) => (
          <Link
            key={post.id}
            href={`/telaah-bersama/${post.id}`}
            className="flex flex-col rounded-lg border border-[#17232c]/10 bg-white p-5 shadow-[0_18px_45px_rgba(23,35,44,0.06)] transition-colors hover:border-[#2b6f95]/40"
          >
            <RiskLevelBadge level={post.riskLevel} className="self-start" />
            <h3 className="mt-3 line-clamp-3 text-base font-semibold leading-snug text-[#17232c]">{post.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#5a6a76]">{post.summary}</p>
            <p className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs text-[#5a6a76]">
              <HandHelping className="size-3.5 text-[#2b6f95]" />
              <span className="font-medium text-[#17232c]">{post.reactionCount}</span> orang juga menerima ini
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
