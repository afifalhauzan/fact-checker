"use client";

import React from "react";
import { useIframeStore } from "@/lib/iframe-store";
import { useGraphHistoryStore } from "@/lib/graph-history-store";
import { Button } from "@/components/ui/button";
import { ChartRenderer } from "./graph/ChartRenderer";
import { ShareModal } from "./selection/ShareModal";
import { Share2 } from "lucide-react";
import type { ChartEmbedData } from "@/types/chart";

interface IFrameViewerProps {
  // You can add props here if needed, such as the URL to display in the iframe
}

const ShareFabButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 md:bottom-8 md:right-8 flex items-center justify-center gap-4 w-14 h-14 md:w-auto md:h-13 md:px-5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-110 z-50"
    title="Bagikan"
  >
    <Share2 className="h-6 w-6 md:h-6 md:w-6" />
    <span className="hidden md:inline text-md font-medium whitespace-nowrap">Bagikan</span>
  </button>
);

export function IFrameViewer({ }: IFrameViewerProps) {
  const { currentView } = useIframeStore();
  const { setHistoryModalOpen } = useGraphHistoryStore();
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  // // Don't render if container is hidden
  // if (!isVisible) {
  //   return null;
  // } // changed by just simply displaying empty state when no currentView, instead of hiding entire container.

  console.log('[IFrameViewer] Rendering with currentView:', currentView);

  // Empty state when visible but no selected chart/iframe
  if (!currentView) {
    return (
      <div className="flex h-full min-h-[90dvh] flex-1 flex-col bg-background z-20">
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="animate-fade-up text-center w-sm">
            <div className="mx-auto mb-7 flex h-[72px] w-[72px] items-center justify-center rounded-lg bg-accent text-[34px] shadow-sm">
              📊
            </div>
            <h3 className="mb-2 text-h2">Belum ada dashboard</h3>
            <p className="text-caption">Mulai dengan membuat dashboard menggunakan mode Selection di samping, atau gunakan grafik dari chat.</p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <p className="text-caption text-sm">Atau jelajahi</p>
              <Button
                variant="link"
                // onClick={() => setHistoryModalOpen(true)} // TODO: Implement this to show iframe history
                className="h-auto p-0 text-sm"
              >
                Riwayat Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render based on view type
  if (currentView.type === "json") {
    const chartData = currentView.payload as ChartEmbedData;
    return (
      <div className="relative flex h-full min-h-0 flex-1 flex-col bg-background z-20">
        {/* Chart Content */}
        <div className="min-h-0 flex-1 overflow-auto p-6">
          <ChartRenderer data={chartData} size="lg" />
        </div>

        {/* FAB Share Button */}
        <ShareFabButton onClick={() => setIsShareModalOpen(true)} />

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareUrl={typeof window !== "undefined" ? window.location.href : ""}
          title="Bagikan Dashboard"
        />
      </div>
    );
  }

  if (currentView.type === "iframe") {
    const iframeUrl = currentView.payload as string;
    return (
      <div className="relative flex h-[90dvh] min-h-0 flex-1 flex-col bg-background overflow-y-auto border-0 p-0 m-0 z-20">
        {/* Iframe Content */}
        <iframe
          src={iframeUrl}
          className="h-full w-full flex-1 border-0"
          title="Dashboard"
        />

        {/* FAB Share Button */}
        <ShareFabButton onClick={() => setIsShareModalOpen(true)} />

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareUrl={iframeUrl}
          title="Bagikan Dashboard"
        />
      </div>
    );
  }

  return null;
}