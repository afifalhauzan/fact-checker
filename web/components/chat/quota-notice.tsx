"use client";

import Link from "next/link";
import { ArrowRight, Hourglass, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuotaBlock } from "@/lib/quota";

/** Under a turn the quota refused: the way on for each reason (lib/quota.ts). */
export function QuotaNotice({
  reason,
  disabled,
  onContinue,
}: {
  reason: QuotaBlock;
  disabled?: boolean;
  onContinue: () => void;
}) {
  if (reason === "guest_limit" || reason === "guest_ip_limit") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-foreground">
          <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Dengan akun, kamu dapat beberapa sesi TelaahLoker setiap hari dan riwayatnya tersimpan.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/register?from=/chat">Daftar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login?from=/chat">Masuk</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (reason === "daily_limit") {
    return (
      <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Hourglass className="mt-0.5 h-4 w-4 shrink-0" />
        Sesi baru bisa dimulai lagi pukul 00.00 WIB. Sesi yang sudah ada tetap bisa dibuka dari riwayat.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-sm text-amber-900">
        <Hourglass className="mt-0.5 h-4 w-4 shrink-0" />
        Sesi baru memakai satu dari kuota harianmu.
      </p>
      <Button size="sm" className="shrink-0" disabled={disabled} onClick={onContinue}>
        Lanjutkan di sesi baru
        <ArrowRight />
      </Button>
    </div>
  );
}
