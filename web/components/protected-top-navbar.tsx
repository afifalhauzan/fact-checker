"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { AuthButton } from "@/components/auth/auth-button";
import Logo from "@/assets/logo.svg";

export function ProtectedTopNavbar() {
    const [hasMounted, setHasMounted] = React.useState(false);

    // Use fallback state during SSR and initial hydration
    const currentStatus = hasMounted ? 'online' : 'initializing';

    React.useEffect(() => {
        setHasMounted(true);
    }, []);

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-14 items-center justify-between px-4 sm:px-6">
                <Link href="/chat" className="flex min-w-0 items-center gap-2">
                    <Image
                        src={Logo}
                        alt="RiskCheck Loker"
                        width={132}
                        height={24}
                        className="h-8 w-auto"
                        priority
                    />
                </Link>
                <div className="flex items-center">
                    <AuthButton />
                </div>
            </div>
        </header>
    );
}
