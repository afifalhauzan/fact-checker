"use client";

import { useEffect } from "react";
import { MessageSquareText } from "lucide-react";
import { cn } from "@/utils/utils";
import { sessionsLeft, useQuotaStore } from "@/lib/quota-store";

/** Today's TelaahLoker sessions, in the profile popup. Fetched each time the popup opens. */
export function QuotaBar() {
  const { quota, refresh } = useQuotaStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!quota || quota.guest || quota.sessionsLimit === undefined) return null;

  if (quota.exempt) {
    return (
      <p className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground">
        <MessageSquareText className="h-4 w-4" />
        Sesi TelaahLoker tanpa batas
      </p>
    );
  }

  const used = Math.min(quota.sessionsUsed ?? 0, quota.sessionsLimit);
  const left = sessionsLeft(quota) ?? 0;

  return (
    <div className="space-y-1.5 px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-3 text-foreground">
          <MessageSquareText className="h-4 w-4" />
          Sesi hari ini
        </span>
        <span className="tabular-nums text-muted-foreground">
          {used}/{quota.sessionsLimit}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Sesi TelaahLoker yang terpakai hari ini"
        aria-valuemin={0}
        aria-valuemax={quota.sessionsLimit}
        aria-valuenow={used}
      >
        <div
          className={cn("h-full rounded-full transition-[width]", left === 0 ? "bg-amber-500" : "bg-primary")}
          style={{ width: `${(used / quota.sessionsLimit) * 100}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {left === 0 ? "Kuota habis. " : `Sisa ${left} sesi. `}Direset pukul 00.00 WIB.
      </p>
    </div>
  );
}
