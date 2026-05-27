import type { SalaryBenefitAssessment } from "@/langchain/agents/analyzer/schema";

interface SalaryBenefitCardProps {
  assessment: SalaryBenefitAssessment;
}

export function SalaryBenefitCard({ assessment }: SalaryBenefitCardProps) {
  if (!assessment.summary.trim().length) {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-sm transition-colors hover:bg-amber-50/60">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{assessment.title}</p>
        <span className="inline-flex rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[11px] font-medium text-amber-700">
          {assessment.status}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-foreground">{assessment.summary}</p>

      {assessment.highlights.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          {assessment.highlights.map((item, index) => (
            <li key={`${assessment.title}-highlight-${index}`} className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {assessment.hint?.trim().length ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-white/70 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {assessment.hint}
        </p>
      ) : null}
    </section>
  );
}
