"use client";

import React from "react";
import Link from "next/link";
import { Info, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { TelaahCard } from "@/components/telaah-bersama/telaah-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";
import { listPosts } from "@/lib/telaah-bersama/api";
import { MODUS_LABELS, type TelaahModus, type TelaahPost, type TelaahRiskLevel } from "@/lib/telaah-bersama/types";

type SortMode = "ramai" | "terbaru";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;
// TelaahBareng started in 2026, so the year filter offers this year back to then.
const FIRST_YEAR = 2026;

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
  const [posts, setPosts] = React.useState<TelaahPost[]>([]);
  const [hasMore, setHasMore] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState<SortMode>("ramai");
  const [risk, setRisk] = React.useState<TelaahRiskLevel | null>(null);
  const [modus, setModus] = React.useState<TelaahModus | null>(null);
  const [query, setQuery] = React.useState("");
  const [year, setYear] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState("");

  const years = React.useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: Math.max(1, current - FIRST_YEAR + 1) }, (_, index) => String(current - index));
  }, []);
  const activeFilterCount = [risk, modus, year, from || to].filter(Boolean).length;

  // The search waits for a pause in typing instead of firing on every key.
  React.useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Ignores responses to filters that have since changed.
  const requestIdRef = React.useRef(0);
  const load = React.useCallback(
    async (append: boolean) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const page = append ? Math.floor(posts.length / PAGE_SIZE) + 1 : 1;
        const result = await listPosts({ sort, risk, modus, q: searchQuery, year, from, to, limit: PAGE_SIZE, page });
        if (requestId !== requestIdRef.current) return;
        setPosts((current) => (append ? [...current, ...result.data] : result.data));
        setHasMore(result.hasMore);
      } catch (loadError) {
        if (requestId !== requestIdRef.current) return;
        setError(loadError instanceof Error ? loadError.message : "Telaah gagal dimuat.");
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [sort, risk, modus, searchQuery, year, from, to, posts.length]
  );

  // Re-runs only when a filter changes, not when more posts were appended.
  const loadRef = React.useRef(load);
  loadRef.current = load;
  React.useEffect(() => {
    void loadRef.current(false);
  }, [sort, risk, modus, searchQuery, year, from, to]);

  const resetFilters = () => {
    setRisk(null);
    setModus(null);
    setYear("");
    setFrom("");
    setTo("");
  };

  return (
    <div className="min-h-screen bg-background">
      <ProtectedTopNavbar />

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
            <div className="flex gap-2">
              <label className="relative block min-w-0 flex-1">
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
              <button
                type="button"
                onClick={() => setIsFilterOpen((open) => !open)}
                aria-expanded={isFilterOpen}
                aria-controls="telaah-filters"
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
                  isFilterOpen || activeFilterCount
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {isFilterOpen && (
              <div id="telaah-filters" className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="w-16 text-xs text-muted-foreground">Risiko</span>
                  <FilterChip active={risk === null} onClick={() => setRisk(null)}>Semua</FilterChip>
                  <FilterChip active={risk === "tinggi"} onClick={() => setRisk("tinggi")}>Tinggi</FilterChip>
                  <FilterChip active={risk === "sedang"} onClick={() => setRisk("sedang")}>Sedang</FilterChip>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="w-16 text-xs text-muted-foreground">Modus</span>
                  <FilterChip active={modus === null} onClick={() => setModus(null)}>Semua</FilterChip>
                  {(Object.keys(MODUS_LABELS) as TelaahModus[]).map((key) => (
                    <FilterChip key={key} active={modus === key} onClick={() => setModus(key)}>
                      {MODUS_LABELS[key]}
                    </FilterChip>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                  <span className="w-16">Dibagikan</span>
                  <select
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                    aria-label="Tahun dibagikan"
                    className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                  >
                    <option value="">Semua tahun</option>
                    {years.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-1.5">
                    dari
                    <input
                      type="date"
                      value={from}
                      max={to || undefined}
                      onChange={(event) => setFrom(event.target.value)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                    />
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    sampai
                    <input
                      type="date"
                      value={to}
                      min={from || undefined}
                      onChange={(event) => setTo(event.target.value)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                    />
                  </label>
                </div>
                {activeFilterCount > 0 && (
                  <button type="button" onClick={resetFilters} className="text-xs font-medium text-primary hover:underline">
                    Hapus semua filter
                  </button>
                )}
              </div>
            )}

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
          </div>

          <div className="mt-4 space-y-3" aria-busy={isLoading}>
            {posts.map((post) => (
              <TelaahCard key={post.id} post={post} />
            ))}
            {isLoading && posts.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">Memuat Telaah…</p>
            )}
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-800">{error}</p>
            )}
            {!isLoading && !error && posts.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {searchQuery ? `Belum ada Telaah yang cocok dengan "${searchQuery}".` : "Belum ada Telaah dengan filter ini."}
              </p>
            )}
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => void load(true)} disabled={isLoading}>
                  {isLoading ? "Memuat…" : "Muat lebih banyak"}
                </Button>
              </div>
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
        </aside>
      </main>
    </div>
  );
}
