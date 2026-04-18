import type { Risk } from "@/langchain/agents/analyzer/schema";

interface RiskCardProps extends Pick<Risk, "type" | "description"> {}

const riskStyleMap: Record<Risk["type"], { label: string; indicator: string; badge: string }> = {
  bias: {
    label: "Bias",
    indicator: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  overclaim: {
    label: "Overclaim",
    indicator: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
  missing_context: {
    label: "Missing Context",
    indicator: "bg-sky-500",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
};

export function RiskCard({ type, description }: RiskCardProps) {
  const style = riskStyleMap[type];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${style.indicator}`} />

        <div className="flex-1 space-y-2">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.badge}`}>
            {style.label}
          </span>
          <p className="text-sm leading-relaxed text-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
