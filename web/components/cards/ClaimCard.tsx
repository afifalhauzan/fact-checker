import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { RISK_LEVELS, type Claim, type RiskLevel } from "@/langchain/agents/analyzer/schema";
import { cn } from "@/utils/utils";

interface ClaimCardProps extends Pick<Claim, "text"> {
  riskLevel?: RiskLevel;
}

const LEVEL_STYLES: Record<
  RiskLevel,
  { label: string; advice: string; icon: typeof ShieldAlert; card: string; header: string; badge: string; title: string; segment: string }
> = {
  tinggi: {
    label: "Risiko Tinggi",
    advice: "Jangan transfer uang atau kirim data pribadi dulu.",
    icon: ShieldAlert,
    card: "border-red-200",
    header: "bg-red-50",
    badge: "bg-red-600",
    title: "text-red-700",
    segment: "bg-red-500",
  },
  sedang: {
    label: "Risiko Sedang",
    advice: "Verifikasi ke kanal resmi perusahaan sebelum lanjut.",
    icon: ShieldQuestion,
    card: "border-amber-200",
    header: "bg-amber-50",
    badge: "bg-amber-500",
    title: "text-amber-800",
    segment: "bg-amber-400",
  },
  rendah: {
    label: "Risiko Rendah",
    advice: "Belum ada tanda bahaya utama, tetap cocokkan dengan kanal resmi.",
    icon: ShieldCheck,
    card: "border-emerald-200",
    header: "bg-emerald-50",
    badge: "bg-emerald-600",
    title: "text-emerald-700",
    segment: "bg-emerald-500",
  },
};

const LEVEL_IN_TEXT = /^\s*tingkat\s+risiko(?:\s+awal)?\s*:\s*(rendah|sedang|tinggi)\s*\.?\s*/i;

/** Older stored claims only carry the level inside the text ("Tingkat Risiko Awal: Sedang. ..."). */
function splitClaim(text: string, riskLevel?: RiskLevel): { level?: RiskLevel; reason: string } {
  const match = text.match(LEVEL_IN_TEXT);
  return {
    level: riskLevel ?? (match?.[1].toLowerCase() as RiskLevel | undefined),
    reason: match ? text.slice(match[0].length) : text,
  };
}

export function ClaimCard({ text, riskLevel }: ClaimCardProps) {
  const { level, reason } = splitClaim(text, riskLevel);

  if (!level) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-base font-semibold leading-relaxed text-foreground">{text}</p>
      </div>
    );
  }

  const style = LEVEL_STYLES[level];
  const Icon = style.icon;
  const levelIndex = RISK_LEVELS.indexOf(level);

  return (
    <div className={cn("overflow-hidden rounded-xl border-2 bg-card shadow-sm", style.card)}>
      <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3", style.header)}>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white", style.badge)}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Tingkat risiko awal</p>
          <p className={cn("text-xl font-bold leading-tight", style.title)}>{style.label}</p>
        </div>
        <div className="w-full sm:w-44" aria-hidden>
          <div className="flex gap-1">
            {RISK_LEVELS.map((item, index) => (
              <span
                key={item}
                className={cn("h-2 flex-1 rounded-full", index <= levelIndex ? style.segment : "bg-black/10")}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Rendah</span>
            <span>Sedang</span>
            <span>Tinggi</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 px-4 py-3">
        <p className={cn("text-sm font-semibold", style.title)}>{style.advice}</p>
        {reason && <p className="text-sm leading-relaxed text-foreground">{reason}</p>}
        <p className="text-xs text-muted-foreground">Ini penilaian awal, bukan vonis.</p>
      </div>
    </div>
  );
}
