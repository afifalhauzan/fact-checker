"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGraphHistoryStore, isChartItem } from "@/lib/graph-history-store";
import { ChartRenderer } from "@/components/graph/ChartRenderer";
import { DashboardRenderer } from "@/components/graph/DashboardRenderer";
import { Button } from "@/components/ui/button";
import { extractDashboardData } from "@/utils/chart-processor";

interface DashboardProps {
  onClose?: () => void;
}

export function Dashboard({ onClose: _onClose }: DashboardProps) {
  const [hasMounted, setHasMounted] = useState(false);

  const { getCurrentItem } = useGraphHistoryStore();

  // Ensure consistent rendering between server and client
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Get current chart item and calculate history count
  const currentItem = hasMounted ? getCurrentItem() : null;

  const currentItemData = currentItem?.chartData;

  // Check if currentItem is a dashboard (cached to avoid multiple calls)
  const dashboardStructure = currentItemData ? extractDashboardData(currentItemData) : null;
  const isCurrentItemDashboard = dashboardStructure !== null;

  const displayChartData = currentItemData;

  return (
    <div className="relative flex flex-1 flex-col max-h-[calc(100vh-4rem)] bg-background overflow-y-auto z-20">
      <main className="relative z-0 flex flex-1 flex-col">
        <div className="flex flex-1 flex-col">
          {
            currentItem ? (
              <div className="flex-1 p-0 space-y-4" >
                <div className="bg-card rounded-xl overflow-hidden group relative">
                  <AnimatePresence mode="wait">
                    {isChartItem(currentItem) && displayChartData && (
                      <motion.div
                        key="chart"
                        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
                        className="p-6"
                      >
                        {displayChartData && dashboardStructure ? (
                          <DashboardRenderer data={dashboardStructure} />
                        ) : displayChartData && 'visual_config' in displayChartData ? (
                          <ChartRenderer data={displayChartData as any} />
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="animate-fade-up text-center w-sm">
                  <div className="mx-auto mb-7 flex h-[72px] w-[72px] items-center justify-center rounded-lg bg-accent text-[34px] shadow-sm">
                    📊
                  </div>
                  <h3 className="mb-2 text-h2">Belum ada grafik</h3>
                  <p className="text-caption">
                    Mulai dengan bertanya ke Metabot di kanan.
                  </p>
                </div>
              </div>
            )
          }
        </div>
      </main>
    </div>
  );
}