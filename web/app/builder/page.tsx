"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, LayoutList } from "lucide-react";

import { Dashboard } from "@/components/dashboard";
import { Selection } from "@/components/selection";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { IFrameViewer } from "@/components/iframe-dashboard-viewer";
import { useBuilderStore } from "@/lib/builder-store";

export const dynamic = "force-dynamic";

type ViewMode = "dashboard" | "selection";

interface NavItem {
  id: ViewMode;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "selection", label: "Selection", icon: LayoutList },
];

export default function Page() {
  const { viewMode, setViewMode } = useBuilderStore();

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background">
        <ProtectedTopNavbar />

        <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Desktop Sidebar */}
          <aside className="hidden w-56 shrink-0 border-r border-border bg-card p-4 lg:flex lg:flex-col sticky top-14 h-[calc(100vh-64px)]">
            {/* <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Views
            </h2> */}
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none ${
                    viewMode === id
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {/* Shared Layout Pill */}
                  {viewMode === id && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary rounded-lg"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  {/* Content - Must be z-10 and relative to sit above the pill */}
                  <span className="relative z-10 flex items-center gap-3">
                    <Icon className={`h-4 w-4 transition-transform ${viewMode === id ? "scale-110" : ""}`} />
                    {label}
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Mobile Segmented Control */}
          <div className="p-2 lg:hidden border-b border-border bg-card">
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors outline-none ${
                    viewMode === id ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {viewMode === id && (
                    <motion.div
                      layoutId="mobile-active"
                      className="absolute inset-0 bg-background rounded-lg shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-1 lg:p-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                {viewMode === "dashboard" ? <IFrameViewer /> : <Selection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}