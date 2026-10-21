"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/utils";

const NAV_ITEMS = [
  { label: "Mulai Telaah", shortLabel: "Telaah", href: "/chat" },
  { label: "Telaah Bersama", shortLabel: "Bersama", href: "/telaah-bersama" },
];

/** Links between the two main areas; shown in the top bar next to the account button. */
export function TelaahNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/chat" ? pathname === "/chat" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors sm:px-3",
              isActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="sm:hidden">{item.shortLabel}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
