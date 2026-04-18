import React, { useRef, useEffect, useCallback } from "react";
import type { MetabotUIMessage } from "@/types/streaming";

interface UseAutoScrollProps {
  messages: MetabotUIMessage[];
  disabled?: boolean;
  messagesContainerRef?: React.RefObject<HTMLDivElement>;
}

interface UseAutoScrollReturn {
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  isAtBottom: boolean;
  scrollToBottom: () => void;
}

export function useAutoScroll({ messages, disabled = false, messagesContainerRef: externalRef }: UseAutoScrollProps): UseAutoScrollReturn {
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = externalRef || internalContainerRef;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);

  // Track if we've scrolled to initial bottom
  const hasScrolledInitialRef = useRef(false);

  // Force scroll to absolute bottom position (not relying on scrollIntoView calculations)
  const forceScrollToBottom = useCallback((container: HTMLDivElement | null) => {
    if (!container) return;

    let attempts = 0;
    const maxAttempts = 5;

    const run = () => {
      // Set scroll to absolute maximum
      container.scrollTop = container.scrollHeight;

      // Verify we're actually at bottom (within 2px tolerance)
      const atBottom =
        Math.abs(
          container.scrollHeight -
          container.clientHeight -
          container.scrollTop
        ) < 2;

      console.log(`[Chat] Force scroll attempt ${attempts + 1}/${maxAttempts}:`, {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        calculatedBottom: container.scrollHeight - container.clientHeight,
        difference: Math.abs(
          container.scrollHeight -
          container.clientHeight -
          container.scrollTop
        ),
        atBottom,
      });

      if (!atBottom && attempts < maxAttempts) {
        attempts++;
        requestAnimationFrame(run);
      } else {
        console.log(`[Chat] Scroll to bottom ${atBottom ? 'successful' : `completed after ${maxAttempts} attempts (allowing)`}`);
      }
    };

    requestAnimationFrame(run);
  }, []);

  // Ensure scroll to bottom after initial load and layout fully stabilizes
  useEffect(() => {
    // Only run once when messages first arrive
    if (messages.length > 0 && !hasScrolledInitialRef.current) {
      hasScrolledInitialRef.current = true;
      const container = messagesContainerRef.current;

      console.log('[Chat] Initial messages arrived:', { count: messages.length, container: !!container });
      
      if (!container) {
        console.warn('[Chat] Container ref not available yet');
        return;
      }

      console.log('[Chat] Container dimensions IMMEDIATELY:', {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop,
      });

      // Use ResizeObserver to detect when content actually renders
      // This is more reliable than counting animation frames, especially with async chart rendering
      let measurementAttempt = 0;
      const maxAttempts = 30; // Up to 3 seconds (100ms intervals)
      let lastMeasuredHeight = container.scrollHeight;
      let stableFrameCount = 0;
      const requiredStableFrames = 3; // 3 consecutive frames with same measurement = stable

      const checkLayout = () => {
        measurementAttempt++;
        const currentHeight = container.scrollHeight;
        
        console.log(`[Chat] Layout check ${measurementAttempt}/${maxAttempts}:`, {
          scrollHeight: currentHeight,
          clientHeight: container.clientHeight,
          childCount: container.children.length,
          heightDelta: currentHeight - lastMeasuredHeight,
          stableFrameCount,
        });

        // If height is still changing, reset stability counter
        if (currentHeight !== lastMeasuredHeight) {
          console.log(`[Chat] Height changed: ${lastMeasuredHeight} → ${currentHeight}, resetting stability counter`);
          stableFrameCount = 0;
          lastMeasuredHeight = currentHeight;
        } else {
          stableFrameCount++;
          console.log(`[Chat] Height stable (${stableFrameCount}/${requiredStableFrames})`);
        }

        // Once height is stable for 3 frames, layout is complete
        if (stableFrameCount >= requiredStableFrames) {
          console.log('[Chat] Layout stable! Height has not changed for 3 measurements. Forcing scroll to bottom.');
          forceScrollToBottom(container);
          return; // Exit the loop
        }

        // Continue checking if not stable yet and haven't exceeded max attempts
        if (measurementAttempt < maxAttempts) {
          setTimeout(checkLayout, 100); // Check again in 100ms
        } else {
          console.warn('[Chat] Layout check timeout after', maxAttempts * 100, 'ms. Forcing scroll anyway.');
          forceScrollToBottom(container);
        }
      };

      // Start checking layout after initial animation frames for browser to paint
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          console.log('[Chat] Starting layout stability monitoring');
          checkLayout();
        });
      });
    }
  }, [messages.length, forceScrollToBottom]);

  // Track scroll position to show/hide scroll-to-bottom FAB
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Don't update scroll state if disabled (highlighting active)
      if (disabled) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 100; // pixels from bottom
      const isBottom = scrollHeight - (scrollTop + clientHeight) < threshold;
      setIsAtBottom(isBottom);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messagesContainerRef, disabled]);

  const scrollToBottom = useCallback(() => {
    const end = messagesEndRef.current;
    if (end) {
      end.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, []);

  return {
    messagesContainerRef,
    messagesEndRef,
    isAtBottom,
    scrollToBottom
  };
}