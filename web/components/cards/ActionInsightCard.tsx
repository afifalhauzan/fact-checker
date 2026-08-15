import { Streamdown } from "streamdown";

interface ActionInsightCardProps {
  title: string;
  points: string[];
}

export function ActionInsightCard({ title, points }: ActionInsightCardProps) {
  if (!title.trim().length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-foreground">
        {points.map((point, index) => (
          <li key={`${title}-point-${index}`} className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed [&_p]:m-0">
              <Streamdown>{point}</Streamdown>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

