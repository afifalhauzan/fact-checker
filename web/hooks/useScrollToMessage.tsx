import React, { useRef, useEffect } from "react";
import { useInteractionStore } from "@/lib/interaction-store";

interface UseScrollToMessageProps {
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  onScrollLock?: (locked: boolean) => void;
}

interface UseScrollToMessageReturn {
  justScrolledToContextRef: React.MutableRefObject<boolean>;
  shouldLockScroll: boolean;
}

export function useScrollToMessage({ 
  messagesContainerRef,
  onScrollLock
}: UseScrollToMessageProps): UseScrollToMessageReturn {
  const [shouldLockScroll, setShouldLockScroll] = React.useState(false);
  const justScrolledToContextRef = useRef(false);

  const { targetMessageId, scrollTrigger, clearTargetMessage } = useInteractionStore();

  useEffect(() => {
    const state = useInteractionStore.getState();
    console.log('[Chat] Interaction store state:', {
      targetMessageId: state.targetMessageId,
      scrollTrigger: state.scrollTrigger,
      fromDestructure: { targetMessageId, scrollTrigger }
    });
    
    if (!targetMessageId || !scrollTrigger) {
      console.log('[Chat] Scroll-to-context effect: skipped (missing:', { targetMessageId: !targetMessageId, scrollTrigger: !scrollTrigger }, ')');
      return;
    }

    console.log('[Chat] Scroll-to-context effect triggered:', { targetMessageId, scrollTrigger, timestamp: new Date().toLocaleTimeString() });

    // Delay to ensure DOM is ready
    const timer = setTimeout(() => {
      console.log('[Chat] Starting element search for messageId:', targetMessageId);
      
      // Debug: List all available message IDs in DOM
      const allMessageElements = document.querySelectorAll('[data-message-id]');
      console.log('[Chat] Available message elements in DOM:', Array.from(allMessageElements).map(el => el.getAttribute('data-message-id')));
      
      const targetElement = document.querySelector(
        `[data-message-id="${targetMessageId}"]`
      );

      if (targetElement && messagesContainerRef.current) {
        console.log('[Chat] Found target element:', targetElement);
        
        // Lock scroll to prevent auto-scroll-to-bottom while highlighting
        setShouldLockScroll(true);
        onScrollLock?.(true);

        // Calculate scroll position with ~100px offset so message isn't tucked under header
        const container = messagesContainerRef.current;
        const elementRect = targetElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const elementTop = elementRect.top - containerRect.top + container.scrollTop;
        const targetScroll = Math.max(0, elementTop - 100); // 100px offset from top

        console.log('[Chat] Scroll calculation:', {
          elementRectTop: elementRect.top,
          containerRectTop: containerRect.top,
          containerScrollTop: container.scrollTop,
          elementTop,
          targetScroll,
          currentScrollTop: container.scrollTop
        });

        // Smooth scroll to position
        container.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });

        console.log('[SCROLL] Smooth scroll initiated to:', targetScroll, 'for message:', targetMessageId);
      } else {
        console.warn('[Chat] Cannot scroll - missing:', {
          hasTargetElement: !!targetElement,
          hasContainer: !!messagesContainerRef.current,
          query: `[data-message-id="${targetMessageId}"]`
        });
      }

      // Clear target after scroll completes (prevents accidental re-triggers)
      // Use timeout to let animation complete and highlighting fade out
      setTimeout(() => {
        console.log('[Chat] Clearing target message after 3000ms');
        clearTargetMessage();
        // Mark that we just scrolled to context (prevents auto-scroll from interfering)
        justScrolledToContextRef.current = true;
        console.log('[Chat] Set justScrolledToContextRef = true');
        
        // Keep scroll lock on for a bit longer to ensure highlight completes
        setTimeout(() => {
          console.log('[Chat] Releasing scroll lock');
          setShouldLockScroll(false);
          onScrollLock?.(false);
          
          // Clear the flag after a brief moment to allow normal auto-scroll to resume
          setTimeout(() => {
            justScrolledToContextRef.current = false;
            console.log('[Chat] Context scroll completed - justScrolledToContextRef = false, auto-scroll re-enabled');
          }, 200);
        }, 500);
      }, 3000);
    }, 100);

    return () => clearTimeout(timer);
  }, [scrollTrigger, targetMessageId, messagesContainerRef, clearTargetMessage, onScrollLock]);

  return {
    justScrolledToContextRef,
    shouldLockScroll
  };
}