import { cn } from "@/utils/utils";
import { MODUS_LABELS, type TelaahModus, type TelaahRiskLevel } from "@/lib/telaah-bersama/mock-data";

const RISK_STYLES: Record<TelaahRiskLevel, string> = {
  tinggi: "border-red-200 bg-red-50 text-red-700",
  sedang: "border-amber-200 bg-amber-50 text-amber-800",
};

export function RiskLevelBadge({ level, className }: { level: TelaahRiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        RISK_STYLES[level],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", level === "tinggi" ? "bg-red-600" : "bg-amber-500")} />
      Risiko {level === "tinggi" ? "Tinggi" : "Sedang"}
    </span>
  );
}

export function ModusBadge({ modus }: { modus: TelaahModus }) {
  return (
    <span className="inline-flex rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-muted-foreground">
      {MODUS_LABELS[modus]}
    </span>
  );
}

export function SeedBadge() {
  return (
    <span
      title="Diisi dari dataset pengembangan untuk demo, bukan dari pengguna nyata."
      className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs text-sky-700"
    >
      Contoh awal
    </span>
  );
}

// Temporary re-export while pages move to prototype-banner.tsx.
export { PrototypeBanner } from "./prototype-banner";
