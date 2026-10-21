import { ImageIcon } from "lucide-react";
import { cn } from "@/utils/utils";

/** An image attached to a post. Opens full size in a new tab, since posters are often hard to read small. */
export function PostAttachment({ url, label, className }: { url: string; label: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex aspect-[3/4] w-full flex-col overflow-hidden rounded-lg border border-border bg-muted transition-colors hover:border-primary/40",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} loading="lazy" className="min-h-0 flex-1 object-cover" />
      <span className="flex items-center gap-1.5 border-t border-border bg-white/80 px-2.5 py-1.5 text-[11px] text-muted-foreground">
        <ImageIcon className="h-3 w-3 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    </a>
  );
}
