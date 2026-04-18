import { useEffect, useRef, type RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(options?: {
  disabled?: boolean;
  dependency?: any; // usually messages.length
}): [RefObject<T>, RefObject<T>] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    if (options?.disabled) return;

    const end = endRef.current;
    if (!end) return;

    end.scrollIntoView({ behavior: "auto", block: "end" });
  }, [options?.dependency, options?.disabled]);

  return [containerRef, endRef];
}
