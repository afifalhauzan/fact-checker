"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/utils";

const NAV_ITEMS = [
  { label: "Mulai Telaah", href: "/chat" },
  { label: "Telaah Bersama", href: "/telaah-bersama" },
  { label: "Rujukan", href: "/rujukan" },
];

/** Links between the main areas: inline in the top bar on wider screens, a second row on phones. */
export function TelaahNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("items-center gap-1", className)}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/chat" ? pathname === "/chat" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
              isActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
