"use client";

import React from "react";
import { BadgeCheck, ExternalLink, Phone, Search, ShieldQuestion } from "lucide-react";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { PrototypeBanner } from "@/components/telaah-bersama/prototype-banner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/telaah-bersama/mock-data";
import {
  CHECK_TOOLS,
  FACT_CHECKERS,
  MOCK_FACT_CHECKS,
  SITUATIONS,
  type FactCheckResult,
  type RujukanChannel,
} from "@/lib/telaah-bersama/rujukan";

function UnverifiedChip() {
  return (
    <span
      title="Nomor dan tautan ini belum diverifikasi tim ke situs resmi lembaga."
      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800"
    >
      <ShieldQuestion className="h-3 w-3" />
      Perlu verifikasi tim
    </span>
  );
}

function ExternalAnchor({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function ChannelCard({ channel }: { channel: RujukanChannel }) {
  return (
    <li className="space-y-1.5 rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{channel.name}</p>
          <p className="text-xs text-muted-foreground">{channel.institution}</p>
        </div>
        {!channel.verified && <UnverifiedChip />}
      </div>
      {channel.prepare && <p className="text-xs text-muted-foreground">Siapkan: {channel.prepare}</p>}
      {(channel.contact || channel.url) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {channel.contact && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              {channel.contact}
            </span>
          )}
          {channel.url && <ExternalAnchor href={channel.url}>Buka situs resmi</ExternalAnchor>}
        </div>
      )}
    </li>
  );
}

function FactCheckSearch() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<FactCheckResult[] | null>(null);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
    if (!words.length) return;
    setResults(
      MOCK_FACT_CHECKS.filter((item) =>
        words.some((word) => item.keywords.some((keyword) => keyword.includes(word)) || item.title.toLowerCase().includes(word))
      )
    );
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nama perusahaan atau isi lowongan, mis. magang kementerian"
          aria-label="Cari di media cek fakta"
        />
        <Button type="submit" disabled={!query.trim()}>
          <Search />
          Cari
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Pencarian hanya di situs media cek fakta di bawah, bukan di seluruh web.
      </p>

      {results && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-violet-700">Contoh hasil (simulasi prototipe, bukan artikel sungguhan)</p>
          {results.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Belum ditemukan artikel cek fakta untuk kata kunci ini. Itu bukan berarti lowongannya aman.
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((result) => (
                <li key={result.title} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-foreground">{result.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {result.source} · {formatDate(result.date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function RujukanPage() {
  return (
    <div className="min-h-screen bg-background">
      <ProtectedTopNavbar />
      <PrototypeBanner />

      <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:px-6">
        <header>
          <h1 className="font-[var(--font-instrument-serif)] text-4xl leading-tight text-[#17232c] sm:text-5xl">Rujukan</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Ke mana harus melapor, cara mengecek sendiri ke sumber resmi, dan artikel cek fakta dari media tepercaya.
          </p>
          <nav className="mt-4 flex flex-wrap gap-2" aria-label="Situasi">
            {SITUATIONS.map((situation) => (
              <a
                key={situation.id}
                href={`#${situation.id}`}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                {situation.title}
              </a>
            ))}
          </nav>
        </header>

        <section aria-labelledby="lapor-heading" className="space-y-4">
          <h2 id="lapor-heading" className="text-lg font-semibold text-foreground">
            Lapor & adukan
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SITUATIONS.map((situation) => (
              <article
                key={situation.id}
                id={situation.id}
                className="scroll-mt-24 space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm target:border-primary target:ring-2 target:ring-primary/20"
              >
                <div>
                  <h3 className="text-base font-semibold text-foreground">{situation.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{situation.description}</p>
                </div>
                <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-foreground">
                  {situation.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <ul className="space-y-2">
                  {situation.channels.map((channel) => (
                    <ChannelCard key={channel.name} channel={channel} />
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="cek-heading" className="space-y-4">
          <h2 id="cek-heading" className="text-lg font-semibold text-foreground">
            Cek mandiri ke sumber resmi
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHECK_TOOLS.map((tool) => (
              <li key={tool.name} className="space-y-1.5 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                  {!tool.verified && <UnverifiedChip />}
                </div>
                <p className="text-xs text-muted-foreground">{tool.institution}</p>
                <p className="text-sm text-foreground">{tool.use}</p>
                <ExternalAnchor href={tool.url}>Buka</ExternalAnchor>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="fakta-heading" className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <h2 id="fakta-heading" className="text-lg font-semibold text-foreground">
              Cari di media cek fakta
            </h2>
            <FactCheckSearch />
          </div>
          <aside className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Media penanda tangan IFCN
            </p>
            <ul className="space-y-1.5">
              {FACT_CHECKERS.map((checker) => (
                <li key={checker.domain}>
                  <ExternalAnchor href={checker.url}>{checker.name}</ExternalAnchor>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground">Status sertifikasi terkini perlu dicek di situs IFCN.</p>
          </aside>
        </section>
      </main>
    </div>
  );
}
