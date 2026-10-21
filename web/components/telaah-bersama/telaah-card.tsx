import Link from "next/link";
import { EyeOff, HandHelping, MessageCircle } from "lucide-react";
import { formatPeriod, formatRelative, type TelaahPost } from "@/lib/telaah-bersama/types";
import { ModusBadge, RiskLevelBadge, SeedBadge } from "./badges";

export function TelaahCard({ post }: { post: TelaahPost }) {
  const period = formatPeriod(post.openDate, post.closeDate);
  const phone = post.contacts.find((contact) => contact.kind === "phone");

  return (
    <Link
      href={`/telaah-bersama/${post.id}`}
      className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <RiskLevelBadge level={post.riskLevel} />
        <ModusBadge modus={post.modus} />
        {post.isSeed && <SeedBadge />}
        {post.status === "hidden_pending_edit" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-900">
            <EyeOff className="h-3 w-3" />
            Disembunyikan, perlu disunting
          </span>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">{post.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.summary}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {post.source.platform && (
          <span>
            Sumber: <span className="text-foreground">{post.source.platform}</span>
            {post.source.account ? ` · ${post.source.account}` : ""}
          </span>
        )}
        {period && <span>Periode: {period}</span>}
        {phone && <span>Kontak: {phone.value}</span>}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <HandHelping className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">{post.reactionCount}</span> juga menerima
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount} diskusi
          </span>
        </div>
        <span>
          {post.author} · {formatRelative(post.createdAt)}
        </span>
      </div>
    </Link>
  );
}
