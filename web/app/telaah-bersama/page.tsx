"use client";

import React from "react";
import Link from "next/link";
import { Info, Search, ShieldCheck } from "lucide-react";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { PrototypeBanner } from "@/components/telaah-bersama/prototype-banner";
import { TelaahCard } from "@/components/telaah-bersama/telaah-card";
import { cn } from "@/utils/utils";
import { MODUS_LABELS, hotScore, type TelaahModus, type TelaahPost, type TelaahRiskLevel } from "@/lib/telaah-bersama/mock-data";
import { useTelaahBersamaStore } from "@/lib/telaah-bersama/store";

type SortMode = "ramai" | "terbaru";

// A number typed as "0812-0000" should still find "+62 812 0000...", so digits are matched on their own.
function matchesQuery(post: TelaahPost, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;

  const fields = [
    post.title,
    post.summary,
    post.company,
    post.position,
    post.location,
    post.source.platform,
    post.source.account,
    ...post.contacts.map((contact) => contact.value),
  ].filter((field): field is string => !!field);
  const text = fields.join(" ").toLowerCase();
  const digits = fields.map((field) => field.replace(/\D/g, "").replace(/^62(8)/, "0$1")).join(" ");

  return words.every((word) => {
    const wordDigits = word.replace(/\D/g, "").replace(/^62(8)/, "0$1");
    return text.includes(word) || (wordDigits.length >= 4 && digits.includes(wordDigits));
  });
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-border bg-background text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export default function TelaahBersamaPage() {
  const posts = useTelaahBersamaStore((state) => state.posts);
  const [sort, setSort] = React.useState<SortMode>("ramai");
  const [risk, setRisk] = React.useState<TelaahRiskLevel | null>(null);
  const [modus, setModus] = React.useState<TelaahModus | null>(null);
  const [query, setQuery] = React.useState("");

  const visiblePosts = React.useMemo(() => {
    const filtered = posts.filter(
      (post) => (!risk || post.riskLevel === risk) && (!modus || post.modus === modus) && matchesQuery(post, query)
    );
    return [...filtered].sort((a, b) =>
      sort === "ramai" ? hotScore(b) - hotScore(a) : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts, risk, modus, query, sort]);

  return (
    <div className="min-h-screen bg-background">
      <ProtectedTopNavbar />
      <PrototypeBanner />

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <h1 className="font-[var(--font-instrument-serif)] text-4xl leading-tight text-[#17232c] sm:text-5xl">
            TelaahBareng
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Lowongan berisiko yang sudah ditelaah dan dibagikan pengguna. Cek apakah kamu menerima lowongan atau chat
            yang sama, lalu ceritakan pengalamanmu di diskusi.
          </p>

          <div className="mt-6 flex flex-col gap-3 border-b border-border pb-4">
            <label className="relative block">
              <span className="sr-only">Cari Telaah</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari perusahaan, posisi, nomor kontak, atau akun sumber"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <div className="flex gap-1" role="tablist" aria-label="Urutkan">
              {(["ramai", "terbaru"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={sort === mode}
                  onClick={() => setSort(mode)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    sort === mode ? "bg-foreground font-medium text-background" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {mode === "ramai" ? "Ramai ditelaah" : "Terbaru"}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-muted-foreground">Risiko</span>
              <FilterChip active={risk === null} onClick={() => setRisk(null)}>Semua</FilterChip>
              <FilterChip active={risk === "tinggi"} onClick={() => setRisk("tinggi")}>Tinggi</FilterChip>
              <FilterChip active={risk === "sedang"} onClick={() => setRisk("sedang")}>Sedang</FilterChip>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-muted-foreground">Modus</span>
              <FilterChip active={modus === null} onClick={() => setModus(null)}>Semua</FilterChip>
              {(Object.keys(MODUS_LABELS) as TelaahModus[]).map((key) => (
                <FilterChip key={key} active={modus === key} onClick={() => setModus(key)}>
                  {MODUS_LABELS[key]}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {visiblePosts.map((post) => (
              <TelaahCard key={post.id} post={post} />
            ))}
            {visiblePosts.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {query.trim() ? `Belum ada Telaah yang cocok dengan "${query.trim()}".` : "Belum ada Telaah dengan filter ini."}
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Info className="h-4 w-4 text-primary" />
              Cara kerja TelaahBareng
            </div>
            <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground">
              <li>Telaah lowonganmu di chat.</li>
              <li>Jika hasilnya Sedang atau Tinggi, kamu bisa membagikannya lewat tombol <b>Buat post</b>.</li>
              <li>Orang lain yang menerima lowongan serupa bisa menandai dan berdiskusi.</li>
            </ol>
            <Link
              href="/chat"
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              TelaahLoker
            </Link>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              Penilaian awal, bukan vonis
            </div>
            <p className="mt-2 text-amber-900/80">
              Tingkat risiko berasal dari telaah AI saat lowongan dibagikan. Selalu cocokkan dengan kanal resmi perusahaan
              sebelum mengambil keputusan.
            </p>
          </div>

          <Link
            href="/chat/prototipe"
            className="block rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 transition-colors hover:bg-violet-100"
          >
            <span className="font-semibold">Coba alur di chat →</span>
            <span className="mt-1 block text-violet-900/80">
              Prototipe: tombol Buat post, kartu Telaah serupa, dan peringatan lowongan kedua.
            </span>
          </Link>
        </aside>
      </main>
    </div>
  );
}
