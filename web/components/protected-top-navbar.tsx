"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { AuthButton } from "@/components/auth/auth-button";
import Logo from "@/assets/logo.svg";
import { TelaahNav } from "@/components/telaah-bersama/telaah-nav";

/** The one top bar of the site, on the homepage and every app page, so navigation stays the same everywhere. */
export function ProtectedTopNavbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6">
                <Link href="/" className="flex shrink-0 items-center gap-2 justify-self-start" aria-label="TelaahKarier, ke beranda">
                    <Image
                        src={Logo}
                        alt="TelaahKarier"
                        width={132}
                        height={24}
                        className="h-8 w-auto"
                        priority
                    />
                </Link>
                <TelaahNav className="hidden md:flex" />
                <div className="flex items-center justify-self-end">
                    <AuthButton logoutRedirectTo="/" />
                </div>
            </div>
            <TelaahNav className="no-scrollbar flex overflow-x-auto border-t border-border px-2 py-1 md:hidden" />
        </header>
    );
}
