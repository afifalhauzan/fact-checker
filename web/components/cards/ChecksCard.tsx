import { CircleAlert, CircleCheck, CircleMinus, Info, ChevronDown } from "lucide-react";
import type { Check } from "@/langchain/agents/analyzer/schema";
import { cn } from "@/utils/utils";

const STATUS_STYLES: Record<Check["status"], { icon: typeof CircleCheck; className: string; label: string }> = {
  ok: { icon: CircleCheck, className: "text-emerald-600", label: "Tidak ada temuan" },
  warning: { icon: CircleAlert, className: "text-amber-600", label: "Ada temuan" },
  info: { icon: Info, className: "text-sky-600", label: "Informasi" },
  skipped: { icon: CircleMinus, className: "text-muted-foreground", label: "Tidak dapat diperiksa" },
};

export function ChecksCard({ checks }: { checks: Check[] }) {
  const findings = checks.filter((check) => check.status === "warning").length;

  return (
    <details open className="group rounded-xl border border-input bg-background p-4 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-foreground">
        <span>
          Pemeriksaan yang dilakukan{" "}
          <span className="font-normal text-muted-foreground">
            ({checks.length} pemeriksaan{findings ? `, ${findings} temuan` : ""})
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <ul className="mt-3 space-y-2.5">
        {checks.map((check, index) => {
          const style = STATUS_STYLES[check.status];
          const Icon = style.icon;
          return (
            <li key={`${check.label}-${index}`} className="flex items-start gap-2.5">
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.className)} aria-label={style.label} />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug text-foreground break-words">{check.label}</p>
                <p className="text-xs leading-relaxed text-muted-foreground break-words">{check.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
