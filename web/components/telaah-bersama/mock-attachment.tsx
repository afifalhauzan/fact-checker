import { ImageIcon, MessageSquareText } from "lucide-react";
import { cn } from "@/utils/utils";

// Drawn placeholder instead of a real poster or screenshot, so the prototype ships no real case data.
// A `url` (an image the user re-uploaded in the prototype) is shown as-is instead.
export function MockAttachment({
  label,
  variant,
  url,
  className,
}: {
  label: string;
  variant: "poster" | "chat";
  url?: string;
  className?: string;
}) {
  if (url) {
    return (
      <div className={cn("flex aspect-[3/4] w-full flex-col overflow-hidden rounded-lg border border-border bg-muted", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} className="min-h-0 flex-1 object-cover" />
        <div className="flex items-center gap-1.5 border-t border-border bg-white/80 px-2.5 py-1.5 text-[11px] text-muted-foreground">
          <ImageIcon className="h-3 w-3" />
          <span className="truncate">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-[3/4] w-full flex-col overflow-hidden rounded-lg border border-border bg-gradient-to-b",
        variant === "poster" ? "from-sky-100 to-white" : "from-emerald-50 to-white",
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {variant === "poster" ? (
          <>
            <div className="h-2.5 w-3/4 rounded bg-sky-700/70" />
            <div className="h-2 w-1/2 rounded bg-sky-700/40" />
            <div className="mt-2 h-10 rounded bg-sky-200/80" />
            <div className="h-1.5 w-full rounded bg-slate-300" />
            <div className="h-1.5 w-5/6 rounded bg-slate-300" />
            <div className="h-1.5 w-2/3 rounded bg-slate-300" />
            <div className="mt-auto h-3 w-1/2 rounded bg-red-300" />
          </>
        ) : (
          <>
            <div className="h-5 w-2/3 self-start rounded-lg bg-white shadow-sm" />
            <div className="h-5 w-1/2 self-end rounded-lg bg-emerald-200" />
            <div className="h-8 w-3/4 self-start rounded-lg bg-white shadow-sm" />
            <div className="h-5 w-2/5 self-end rounded-lg bg-emerald-200" />
            <div className="h-5 w-3/5 self-start rounded-lg bg-white shadow-sm" />
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5 border-t border-border bg-white/80 px-2.5 py-1.5 text-[11px] text-muted-foreground">
        {variant === "poster" ? <ImageIcon className="h-3 w-3" /> : <MessageSquareText className="h-3 w-3" />}
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
}
