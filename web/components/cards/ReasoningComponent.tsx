import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { type Reasoning } from "@/langchain/agents/analyzer/schema";

interface ReasoningComponentProps {
  messageId: string;
  reasoning: Reasoning[];
  isStreaming: boolean;
  defaultOpen?: boolean;
}

export function ReasoningComponent({
  messageId,
  reasoning,
  isStreaming,
  defaultOpen = false,
}: ReasoningComponentProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const primaryReasoning = reasoning[0];

  React.useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  if (!primaryReasoning) {
    return null;
  }

  return (
    <section className="max-w-md rounded-lg bg-background py-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer list-none items-center justify-start gap-2 px-1 text-left text-xs font-medium text-foreground hover:text-primary"
        aria-expanded={isOpen}
      >
        {isStreaming ? (
          <div className="flex items-center gap-2">
            <span className="animate-pulse">Sedang menganalisis...</span>
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="inline-flex"
            >
              <ChevronDown className="h-3 w-3 animate-pulse text-muted-foreground" />
            </motion.span>
          </div>

        ) : (
          <div className="flex items-center gap-2">
            <span className="">Lihat tahapan analisis</span>
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="inline-flex"
            >
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </motion.span>
          </div>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`${messageId}-reasoning-content`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -4, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-3 ml-1 space-y-1.5 border-l border-gray-300 pl-3 text-xs"
            >
              <p className="pl-2 italic text-muted-foreground">{primaryReasoning.intent}</p>
              <ul className="space-y-1 pl-4">
                {primaryReasoning.steps.map((step, index) => (
                  <li key={`${messageId}-reasoning-step-${index}`} className="flex gap-1.5 text-muted-foreground">
                    <span className="flex-shrink-0 font-semibold text-primary">-&gt;</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              {isStreaming && (
                <div className="animate-pulse pl-2 pt-1 text-[11px] text-muted-foreground">Menganalisis...</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
