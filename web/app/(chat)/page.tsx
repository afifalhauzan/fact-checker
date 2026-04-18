"use client";

import { Chat } from "@/components/chat";
import { Dashboard } from "@/components/dashboard";
import React, { useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { StreamingProvider } from "@/contexts/StreamingContext";
import { generateUUID } from "@/utils/browser-uuid";
import { Menu, X } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Page() {
  const [isDashboardOpen, setIsDashboardOpen] = React.useState(false);
  const [dashboardWidth, setDashboardWidth] = React.useState(60);
  const [isDragging, setIsDragging] = React.useState(false);
  const [chatId] = React.useState(() => generateUUID());

  const toggleDashboard = () => {
    setIsDashboardOpen(!isDashboardOpen);
  };

  const closeDashboard = () => {
    setIsDashboardOpen(false);
  };

  // Handle dragging for resizing
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const containerRect = document.querySelector('.resize-container')?.getBoundingClientRect();
    if (!containerRect) return;
    
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain width between 20% and 80%
    const constrainedWidth = Math.max(20, Math.min(80, newWidth));
    setDashboardWidth(constrainedWidth);
  }, [isDragging]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for mouse events
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <ProtectedRoute>
      <StreamingProvider chatId={chatId}>
        <div className="flex min-h-screen flex-col bg-background">
          <ProtectedTopNavbar />

          <main className="relative flex min-h-0 flex-1 resize-container">
            {/* Hamburger Menu Button */}
            <button
              onClick={toggleDashboard}
              className="fixed top-16 left-4 z-50 rounded-lg border border-border bg-card p-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden"
            >
              <div className="relative w-6 h-6">
                <Menu 
                  className={`h-6 w-6 absolute inset-0 transition-all duration-300 ${
                    isDashboardOpen 
                      ? 'opacity-0 rotate-90' 
                      : 'opacity-100 rotate-0'
                  }`} 
                />
                <X 
                  className={`h-6 w-6 absolute inset-0 transition-all duration-300 ${
                    isDashboardOpen 
                      ? 'opacity-100 rotate-0' 
                      : 'opacity-0 -rotate-90'
                  }`} 
                />
              </div>
            </button>

            {/* Mobile Overlay */}
            {isDashboardOpen && (
              <div
                className="fixed inset-x-0 top-14 bottom-0 z-30 bg-black/30 transition-opacity duration-300 ease-in-out lg:hidden"
                onClick={closeDashboard}
              />
            )}

            {/* Desktop Dashboard - Resizable */}
            <div 
              className="hidden lg:flex shrink-0 relative"
              style={{ width: `${dashboardWidth}%` }}
            >
              <Dashboard />
              
              {/* Draggable Divider */}
              <div
                className={`absolute top-0 right-0 w-1 h-full z-100 transition-all ease-in-out ${
                  isDragging 
                    ? 'bg-primary shadow-lg' 
                    : 'bg-border/50 hover:bg-primary/70'
                }`}
                onMouseDown={handleMouseDown}
                style={{ cursor: 'col-resize' }}
              >
                <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
                  <div className={`w-1 h-8 rounded-full transition-all ${
                    isDragging 
                      ? 'bg-primary' 
                      : 'bg-border hover:bg-primary/60'
                  }`} />
                </div>
              </div>
            </div>

            {/* Mobile Dashboard - Slides in from left */}
            <div
              className={`fixed inset-x-0 top-14 bottom-0 z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${
                isDashboardOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <Dashboard onClose={closeDashboard} />
            </div>

            {/* Chat Panel - Resizable */}
            <div 
              className="lg:flex flex-col max-h-[calc(100vh-4rem)] min-w-0 flex-1"
              style={{ width: `${100 - dashboardWidth}%` }}
            >
              <Chat />
            </div>
          </main>
        </div>
      </StreamingProvider>
    </ProtectedRoute>
  );
}
