import { RISK_TYPE_LABELS, type Risk } from "@/langchain/agents/analyzer/schema";

interface RiskCardProps extends Pick<Risk, "type" | "description" | "evidence"> {}

const riskStyleMap: Record<Risk["type"], { label: string; indicator: string; badge: string }> = {
  payment_request: {
    label: RISK_TYPE_LABELS.payment_request,
    indicator: "bg-red-600",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
  sensitive_data: {
    label: RISK_TYPE_LABELS.sensitive_data,
    indicator: "bg-red-600",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
  tppo: {
    label: RISK_TYPE_LABELS.tppo,
    indicator: "bg-rose-700",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
  },
  suspicious_contact: {
    label: RISK_TYPE_LABELS.suspicious_contact,
    indicator: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
  },
  manipulation: {
    label: RISK_TYPE_LABELS.manipulation,
    indicator: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  bias: {
    label: RISK_TYPE_LABELS.bias,
    indicator: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  overclaim: {
    label: RISK_TYPE_LABELS.overclaim,
    indicator: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
  missing_context: {
    label: RISK_TYPE_LABELS.missing_context,
    indicator: "bg-sky-500",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
};

export function RiskCard({ type, description, evidence }: RiskCardProps) {
  const style = riskStyleMap[type];

  return (
    <div className="rounded-xl border border-amber-200/70 border-l-5 border-l-amber-400 bg-slate p-4 shadow-sm transition-colors hover:bg-primary/10">
      {/* <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Indikator Mencurigakan</p> */}
      <div className="flex items-start gap-3">
        <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${style.indicator}`} />

        <div className="flex-1 space-y-2">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.badge}`}>
            {style.label}
          </span>
          <p className="text-sm leading-relaxed text-foreground">{description}</p>
          {evidence && <p className="text-xs italic leading-relaxed text-muted-foreground">Bukti: &ldquo;{evidence}&rdquo;</p>}
        </div>
      </div>
    </div>
  );
}
