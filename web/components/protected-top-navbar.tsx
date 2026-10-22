"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React from "react";
import { AuthButton } from "@/components/auth/auth-button";
import { Button } from "@/components/ui/button";
import Logo from "@/assets/logo.svg";
import { TelaahNav } from "@/components/telaah-bersama/telaah-nav";

/**
 * The one top bar of the site. The homepage keeps it minimal (logo, "Buka Telaah", account) and the
 * TelaahLoker / TelaahBareng links only appear once the visitor is inside the app.
 */
export function ProtectedTopNavbar() {
    const isLanding = usePathname() === "/";

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
                <Link href="/" className="flex shrink-0 items-center gap-2 justify-self-start" aria-label="TelaahKarier, ke beranda">
                    <Image
                        src={Logo}
                        alt="TelaahKarier"
                        width={150}
                        height={30}
                        className="h-10 w-auto"
                        priority
                    />
                </Link>
                {!isLanding && <TelaahNav className="hidden md:flex" />}
                {/* Pinned to the last column: on phones the middle nav is hidden and takes no cell */}
                <div className="col-start-3 flex items-center gap-2 justify-self-end">
                    {isLanding && (
                        <Button asChild className="h-10 rounded-lg px-4">
                            <Link href="/chat">Buka Telaah</Link>
                        </Button>
                    )}
                    <AuthButton logoutRedirectTo="/" />
                </div>
            </div>
            {!isLanding && (
                <TelaahNav className="no-scrollbar flex overflow-x-auto border-t border-border px-2 py-1 md:hidden" />
            )}
        </header>
    );
}
