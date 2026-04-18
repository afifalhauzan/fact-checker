"use client";

import React from "react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { IFrameViewer } from "@/components/iframe-dashboard-viewer";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-background">
        <ProtectedTopNavbar />

        <main className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-auto p-1 lg:p-2">
            <IFrameViewer />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}