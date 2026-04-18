import type { Claim } from "@/src/agents/analyzer/schema";

interface ClaimCardProps extends Pick<Claim, "text" | "confidence"> {}

export function ClaimCard({ text, confidence }: ClaimCardProps) {
  const boundedConfidence = Math.max(0, Math.min(1, confidence));
  const confidencePercent = Math.round(boundedConfidence * 100);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm leading-relaxed text-foreground">{text}</p>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Confidence</span>
          <span className="font-medium text-foreground">{confidencePercent}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
