"use client";

import { Chat } from "@/components/chat";
import React from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { StreamingProvider } from "@/contexts/StreamingContext";
import { generateUUID } from "@/utils/browser-uuid";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  const [chatId] = React.useState(() => generateUUID());

  return (
    <ProtectedRoute>
      <StreamingProvider chatId={chatId}>
        <div className="flex min-h-screen flex-col bg-background">
          <ProtectedTopNavbar />

          <main className="relative flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col items-center justify-center max-h-[calc(100vh-4rem)]">
              <Chat />
            </div>
          </main>
        </div>
      </StreamingProvider>
    </ProtectedRoute>
  );
}
