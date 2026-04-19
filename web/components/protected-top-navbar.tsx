"use client";

import Link from "next/link";
import React from "react";
import { AuthButton } from "@/components/auth/auth-button";

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
                <Link href="/" className="flex min-w-0 items-center gap-2">
                    <div className="flex min-w-0 leading-tight">
                        <div className="truncate text-sm font-semibold tracking-tight text-foreground">
                            Fact<span className="text-primary">Checker</span> AI
                        </div>
                    </div>
                </Link>
                <div className="flex items-center">
                    <AuthButton />
                </div>
            </div>
        </header>
    );
}